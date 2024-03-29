var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');

const isEmpty = require('./backend/validation/is-empty');
const Room = require('./backend/models/Room');
const User = require('./backend/models/User');
const Feedback = require('./backend/models/Feedback');

const ObjectId = require('mongoose').Types.ObjectId;

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { database, port } = require('./backend/config/config');

// Connect to MongoDB
mongoose
  .connect(database, { useNewUrlParser: true })
  .then(() => console.log('Mongodb connected'))
  .catch(err => console.log('Mongodb error:', err));

// Passport middleware
app.use(passport.initialize());

let connections = [];
let rooms = {
    /* roomid: { 
            users: { 
                userId: { 
                    name, 
                    status,
                    offer,
                    streamId
                }
            },
            name: ''
        }
    */
}
let users = {};

// Passport Config
// require('./backend/config/passport')(passport);

// Create a room
app.post('/api/room', (req, res) => {
    let { room, id, username } = req.body;

    if (isEmoji(room))
        room = removeEmojis(room);

    Room.findOne({ name: room }).then(doc => {
        if (doc) {
            let errors = { room: 'Room name already exists' };
            res.status(404).json(errors);

        } else {
            const newRoom = new Room({
                name: room
            });

            if (id && ObjectId.isValid(id)) {
                console.log('POST ROOM API: Creating new room')

                User.findById(id).then(user => {
                    if (user) {
                        console.log('POST ROOM API: User found')

                        newRoom.owner = id;
                        return newRoom
                            .save()
                            .then(savedRoom => {
                                user.rooms.push(savedRoom._id)
                                user.logins += 1
                                user.save()
                                    .then(() => res.json(savedRoom))
                                    .catch(err => console.log(err))
                            });
                    } else {
                        console.log('POST ROOM API: User id not found')
                        saveUser(newRoom, username, res)
                    }
                })
            } else {
                saveUser(newRoom, username, res)
            }

        }
    })
    .catch(err => console.log(err))
})

function saveUser (newRoom, username, res) {
    console.log('POST ROOM API: new user')

    newRoom.save()
        .then(room => {
            const newUser = new User({
                username,
                rooms: [room._id]
            })
        
            newUser.save()
                .then(user => {
                    room.owner = user._id;
                    room.save()
                        .then(savedRoom => res.json(savedRoom))
                        .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))

   
}

// Check if room exists
app.get('/api/room/:roomId/:userId', (req, res) => {
  let { roomId, userId } = req.params;

  if (isEmpty(roomId) || !ObjectId.isValid(roomId)) {
    res.status(404).json({ roomId: 'Invalid room ID' });
    return;
  }

  Room.findById(roomId).then(room => {
    if (room) {

        if (roomId in rooms) {
            console.log('GET ROOM: room exists')

            if (userId && ObjectId.isValid(userId)) {
                console.log('GET ROOM: user found')

                User.findById(userId).then(user => {
                    if (user) {
                        if (!user.rooms.includes(roomId)) {
                            user.rooms.push(roomId)
                            user.logins += 1
                            console.log('GET ROOM: add new room')
                            user.save()
                                .then(() => {
                                    res.json({ success: true, room });
                                })
                                .catch(err => console.log(err))
                        } else {
                            user.logins += 1
                            user.save()
                                .then(() => res.json({ success: true, room }))
                                .catch(err => console.log(err))
                        }
                    } else {
                        newUserGetAPI(room, res)
                        return;
                    }
                })
            } else {
                newUserGetAPI(room, res)
                return;
            }

        } else if (userId && userId == room.owner) {
            rooms[roomId] = { users: {}, board: {} }
            console.log('GET ROOM: Owner')

            User.findById(userId).then(user => {
                user.logins += 1
                user.save()
                    .then(() => {
                        res.json({ success: true, room });
                    })
                    .catch(err => console.log(err))
            })

        } else {
            console.log('GET ROOM: room not live atm')
            res.status(404).json({ roomId: "Room is not live at the moment, contact owner." })
            return;
        }

    } else {
      res.status(404).json({ roomId: 'Room not found' });
    }
  })
  .catch(err => console.log(err))
})

function incrementLogin (id) {

}

function newUserGetAPI (room, res) {
    const newUser = new User({
        username: '',
        rooms: [room._id]
    })

    console.log('GET ROOM: new user')

    newUser.save()
        .then(user => {
            res.json({ success: true, room, userId: user._id });
            return
        })
        .catch(err => console.log(err))
}

app.post('/api/feedback', (req,res) => {

    if (isEmpty(req.body.message)) {
        res.status(400).json({ message: 'Please enter a message' })
        return
    }

    Feedback.findOne({ message: req.body.message }).then(feedback => {
        if (feedback) {
            res.status(400).json({ message: 'Message already sent' })
            return
            
        } else {
            const newFeedback = new Feedback(req.body)

            newFeedback.save().then(() => {
                res.json({ success: true })

            }).catch(err => {
                console.log(err)
                res.status(400).json({ error: 'Something went wrong' })
            })
        }
    })
})


server.listen(port, () => console.log(`Server running on ${port}`));


// Serve static assets if in production
// Set static folder
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// The client can listen for the event with the on() method! Once the connection is open, the frontend can receive updates without refreshing the page.

io.set('heartbeat timeout', 10000); 
io.set('heartbeat interval', 5000);

// Open socket connection
io.on('connect', socket => {
    connections.push(socket);
    console.log('sockets connected', connections.length)
    
    // new user
    socket.on('new-user', (roomId, name, owner) => {
        socket.username = name;
        console.log('User connected:', name)

        if (roomId in rooms && !(socket.id in rooms[roomId].users)) {
            socket.join(roomId);

            // users[socket.id] = roomId;
            rooms[roomId]['users'][socket.id] = { name, owner };
            socket.room = roomId

            getUsers();
            socket.to(roomId).broadcast.emit('user-joined', name);

            socket.emit('get-board-status', rooms[roomId].board)
        }
    })

    socket.on('name-change', newName => {
        if (socket.username == newName) return
        let oldName = socket.username;

        socket.username = newName
        let roomId = getRoomId()
        if (socket.id in rooms[roomId].users) {
            rooms[roomId].users[socket.id].name = newName;
            getUsers();
            io.sockets.to(roomId).emit('get-name-change', oldName, newName, socket.id)
        }
    })

     // send message
     socket.on('send-message', data => {
        let roomId = getRoomId()
        let messageObj = { id: socket.id, username: socket.username, message: data };
        roomId && socket.to(roomId).broadcast.emit('new-message', messageObj) // emit sends message to all users, this will emit to all connected sockets
    })

    socket.on('new-challenge', challenge => {
        let roomId = getRoomId()
        if (rooms[roomId]) {
            rooms[roomId].challenge = challenge
            console.log('new challenge by', socket.username, challenge)
            socket.to(roomId).broadcast.emit('get-challenge', challenge)
        }
    })

    socket.on('new-participant', challenge => {
        let roomId = getRoomId()
        if (rooms[roomId].challenge.id == challenge.id && socket.id in rooms[roomId].users) {
            let answer = challenge.studentAnswer;
            rooms[roomId].challenge.participants.push({ id: socket.id, name: rooms[roomId].users[socket.id].name, answer: answer && answer !== null && answer.trim().length > 0 ? answer.trim() : null })
            let participants = rooms[roomId].challenge.participants;
            console.log('new participant', socket.username)
            io.sockets.to(roomId).emit('get-participants', participants)
        }
    })
    
    
    socket.on('send-answer', (challengeId, answer) => {
        let roomId = getRoomId()
        console.log('new answer by', socket.username, answer)
        let participants = rooms[roomId].challenge.participants;
        let participantId = participants.findIndex(participants => participants.id === socket.id);
        if (rooms[roomId].challenge.id == challengeId && participantId !== -1) {
            rooms[roomId].challenge.participants[participantId].answer = answer;
            io.sockets.to(roomId).emit('get-participants', rooms[roomId].challenge.participants, true)
        }
    })

     // returns correct, close, not quite
     function answerStatus (userId, challenge) {
        if (userId in challenge.participants) {
            if (challenge.participants[userId] == challenge.answer) {
                return 'correct'
            } else if (challenge.answer.includes(challenge.participants[userId])) {
                return 'close'
            } else {
                return 'not quite'
            }

        } else {
            return 'hmmm. something went wrong'
        }
    }

    socket.on('reset-challenge', challengeId => {
        let roomId = getRoomId()
        if (rooms[roomId].challenge.id == challengeId) {
            rooms[roomid].challenge = null
        }
    })

    // Whiteboard
    socket.on('on-draw-board', async drawObject => {
        let roomId = getRoomId()
        // if (rooms[roomId] && rooms[roomId].board) {
        //     if (rooms[roomId].board.drawing) {
        //         setTimeout(function(drawObject) {
        //             return function() { rooms[roomId].board.drawing.push(drawObject) }
        //         }(drawObject), 0);
        //     } else
        //         rooms[roomId].board.drawing = [drawObject]
        // }

        socket.to(roomId).broadcast.emit('get-draw-board', drawObject, socket.id)
    })

    socket.on('send-editing-status', status => {
        let roomId = getRoomId()
        if (rooms[roomId]) {
            rooms[roomId].board.status = status
            socket.to(roomId).broadcast.emit('get-editing-status', status)
        }
    })

    socket.on('on-erase-board', () => {
        let roomId = getRoomId()
        if (rooms[roomId]) {
            if (rooms[roomId]) rooms[roomId].board.drawing = []

            socket.to(roomId).broadcast.emit('erase-board')
        }
    })

    socket.on('get-entire-board', () => {
        let roomId = getRoomId()
        rooms[roomId] && rooms[roomId].board && socket.emit('entire-board', rooms[roomId].board)
    })

    socket.on('undo-sketch', (removeSketch, updatedDrawings) => {
        let roomId = getRoomId()
        if (rooms && rooms[roomId] && rooms[roomId].board) {
            rooms[roomId].board.drawing = updatedDrawings
            socket.to(roomId).broadcast.emit('new-undo', removeSketch)
        }
    })

     // STREAMS

    /*
        Client A sends offer to all other clients
        Client B, C receives a new offer and sends an answer back to Client A
        Client A receives both answers and the connection is established
    */

   socket.on("send-offer", (offer, streamId) => {
        console.log('server received offer from', socket.id)
        console.log(rooms)
        let roomId = getRoomId()
        rooms[roomId].users[socket.id].streamId = streamId
        rooms[roomId].users[socket.id].offer = offer
        roomId && socket.to(roomId).broadcast.emit("new-offer", offer, socket.id, rooms[roomId].users);
    });

    // socket.on("send-answer", (answer, client1, client2) => {
    //     console.log(client2, 'is sending answer to', client1)
    //     socket.to(client1).emit("answer-received", answer, client2);
    // });


    socket.on('get-all-offers', () => {
        let roomId = getRoomId()
        roomId && socket.emit('get-offers', rooms[roomId].users)
    })

    // socket.emit("get-all-offers", rooms[getRoomId()].users)

    // socket.on("send-stream", stream => {
    //     let roomId = getRoomId()
    //     roomId && socket.to(roomId).broadcast.emit("stream-sent", stream, socket.id);
    // });

    // socket.on("receive-stream", stream => {
    //     let roomId = getRoomId()
    //     roomId && socket.to(roomId).broadcast.emit("stream-received", stream, socket.id);
    // });


    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        let roomId = getRoomId()
        roomId && socket.to(roomId).broadcast.emit('typing', socket.username);
    });

    socket.on('close-room', () => {
        console.log('room closed')
        closeRoom();
    })

    socket.on('disconnect', () => {
        let roomId = getRoomId();
        console.log('roomId', roomId)

        if (roomId) {
            socket.leave(roomId)
            socket.to(roomId).broadcast.emit('user-left', socket.id)
            if (rooms && rooms[roomId] && rooms[roomId].users && rooms[roomId].users[socket.id]) {
                delete rooms[roomId].users[socket.id]
                delete users[socket.id] && users[socket.id]
            }
            getUsers(roomId);
        }

        connections.splice(connections.indexOf(socket), 1);
        console.log('a socket disconnected', connections.length)
    })


    function getUsers(roomId=getRoomId()) {
        users = rooms[roomId] && rooms[roomId].users ? rooms[roomId].users : {}
        console.log(Object.keys(users).length, 'users in room', roomId)
        roomId && io.sockets.to(roomId).emit('get-users', users);
    }

    function closeRoom() {
        let roomId = getRoomId();
        io.sockets.to(roomId).emit('leave-room')

        // Object.keys(users).forEach(key => {
        //     delete users[key]
        // })

        delete rooms[roomId]
    }


    function getRoomId () {
        return socket.room
        // if (socket.id && socket.id in users) {
        //     return users[socket.id]
        // }
        // return false;
    }

    // get all rooms that the user is a part of
    function getUserRooms() {
        return Object.entries(rooms).reduce((ids, [id, room]) => {
            if (room.users[socket.id] != null) ids.push(id)
            return names
        }, [])
    }
})

function removeEmojis (str) {
    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    return str.replace(regex, '');
}

function isEmoji (str) {
    var ranges = [
        '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])' // U+1F680 to U+1F6FF
    ];
    if (str.match(ranges.join('|'))) {
        return true;
    } else {
        return false;
    }
}