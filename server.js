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
    let { room, id } = req.body;

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

        if (id) newRoom.owner = id

        newRoom
            .save()
            .then(savedRoom => res.json(savedRoom));
        }

    })
    .catch(err => console.log(err))
})

// Check if room exists
app.get('/api/room/:roomId/:userId', (req, res) => {
  let { roomId, userId } = req.params;

  if (isEmpty(roomId) || !ObjectId.isValid(roomId)) {
    res.status(404).json({ roomId: 'Invalid room ID' });
    return;
  }

  Room.findById(roomId).then(room => {
    if (room) {
        console.log('user:', userId)
        console.log('owner:', room.owner)

        if (roomId in rooms) {
            console.log('room exists', rooms[roomId])

        } else if (userId && userId == room.owner) {
            rooms[roomId] = { users: {}, board: {} }
            console.log('new room', rooms[roomId]);

        } else {
            console.log('room not live atm')
            res.status(404).json({ roomId: "Room is not live at the moment, contact owner." })
            return;
        }

        res.json({ success: true, room });

    } else {
      res.status(404).json({ roomId: 'Room not found' });
    }
  })
  .catch(err => console.log(err))
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

// Open socket connection
io.on('connect', socket => {
    connections.push(socket);
    console.log('sockets connected', connections.length)
    
    // new user
    socket.on('new-user', (roomId, name, owner) => {
        socket.username = name;

        if (roomId in rooms && !(socket.id in rooms[roomId].users)) {
            socket.join(roomId);

            users[socket.id] = roomId;
            rooms[roomId].users[socket.id] = { name, owner };
            
            getUsers();
            socket.to(roomId).broadcast.emit('user-joined', name);
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
            console.log(oldName, newName)
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
        console.log(challenge)
        rooms[roomId].challenge = challenge
        console.log('new challenge')
        socket.to(roomId).broadcast.emit('get-challenge', challenge)
    })

    socket.on('new-participant', challenge => {
        let roomId = getRoomId()
        if (rooms[roomId].challenge.id == challenge.id && socket.id in rooms[roomId].users) {
            let answer = challenge.studentAnswer;
            rooms[roomId].challenge.participants.push({ id: socket.id, name: rooms[roomId].users[socket.id].name, answer: answer && answer !== null && answer.trim().length > 0 ? answer.trim() : null })
            let participants = rooms[roomId].challenge.participants;
            console.log('new participant')
            io.sockets.to(roomId).emit('get-participants', participants)
        }
    })
    
    
    socket.on('send-answer', (challengeId, answer) => {
        let roomId = getRoomId()
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
        // if (rooms[roomId]) {
        //     if (rooms[roomId].board.drawing) {
        //         setTimeout(function(drawObject) {
        //             return function() { rooms[roomId].board.drawing.push(drawObject) }
        //         }(drawObject), 0);
        //     } else
        //         rooms[roomId].board.drawing = [drawObject]
        // }

        console.log(rooms[roomId]);
        socket.to(roomId).broadcast.emit('get-draw-board', drawObject, socket.id)
    })

    socket.on('send-editing-status', status => {
        let roomId = getRoomId()
        // if (rooms[roomId]) {
        //     rooms[roomId].board.status = status
        // }
        socket.to(roomId).broadcast.emit('get-editing-status', status)
    })

    socket.on('on-erase-board', () => {
        let roomId = getRoomId()
        // if (rooms[roomId]) rooms[roomId].board.drawing = []

        socket.to(roomId).broadcast.emit('erase-board')
    })

    // socket.on('get-entire-board', () => {
    //     let roomId = getRoomId()
    //     rooms[roomId] && rooms[roomId].board && socket.emit('entire-board', rooms[roomId].board)
    // })

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
        closeRoom();
    })

    socket.on('disconnect', () => {
        let roomId = getRoomId();

        if (roomId) {
            socket.to(roomId).broadcast.emit('user-left', socket.id)
            delete rooms[roomId].users[socket.id]
            delete users[socket.id]
            getUsers(roomId);
        }

        connections.splice(connections.indexOf(socket), 1);
        console.log('a socket disconnected', connections.length)
    })


    function getUsers(roomId=getRoomId()) {
        console.log('rooms', rooms)
        console.log(roomId)
        roomId && io.sockets.to(roomId).emit('get-users', rooms[roomId].users ? rooms[roomId].users : {});
    }

    function closeRoom() {
        let roomId = getRoomId();
        io.sockets.to(roomId).emit('leave-room')

        console.log(users)
        Object.keys(users).forEach(key => {
            delete users[key]
        })

        delete rooms[roomId]
        console.log(users)
    }


    function getRoomId() {
        if (socket.id && socket.id in users) {
            return users[socket.id]
        }
        return false;
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