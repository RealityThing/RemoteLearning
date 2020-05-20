
// React and redux modules
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import axios from 'axios'
import isEmpty from '../../utils/is-empty'
import '../../styles/main.css'
import io from "socket.io-client";
import TextFieldGroup from '../layout/TextFieldGroup';
import { setStream } from "../../actions/videosActions";
import Owner from './Owner';
import Participant from './Participant'
import { getValueIndexOfArray, eachKey, getCharNWordsCount } from '../../utils/valueHelpers'
import Spinner from '../layout/Spinner'
import M from 'materialize-css';
import ChangeUsername from './ChangeUsername';
import Whiteboard from '../whiteboard/Whiteboard';
import Feedback from '../layout/Feedback'

// const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
// var peerConnection = new RTCPeerConnection(configuration)
// var globalUsers = {};
/*
    32432525: { 
        name, 
        status,
        offer,
        streamId
    }
*/
const HOST = 'https://www.remotelearning.space'
var streams = {};
var hasReceived = false;

// window.addEventListener("offline", function(event){
//     console.log("You are now offline.");
//     M.toast({html: 'Your connection has been lost', displayLength: 1000000, classes: 'red' })
// });
// window.addEventListener("online", function(event){
//     console.log("You are now back online.");
//     M.Toast.dismissAll();
//     M.toast({html: "You're back online", displayLength: 5000, classes: 'green' })

// });

// peerConnection.onaddstream = async event => {
//     console.log('stream received:', event.stream.id)
//     console.log(globalUsers)

//     for (let userId of Object.keys(globalUsers)) {

//         // find which user this stream is for
//         if ('streamId' in globalUsers[userId] && globalUsers[userId].streamId == event.stream.id) {

//             if (userId in streams) { 
//                 streams[userId].stream = event.stream
    
//             } else {
//                 streams[userId] = { stream: event.stream }
//             }

//             console.log('streamed user found:', userId)
//         }
//     }
    
//     // remoteStream.addTrack(event.track, remoteStream);
//     // store.dispatch(setStream(event.streams[0], 1));
// };

// Custom react component/class
class CreateRoom extends Component {

    constructor(props){
        super(props);
        this.state = {
            room: {},
            rooms: [],
            socket: null,
            stream: null,
            roomEnded: false,

            loading: true,
            inValidId: false,
            userIsSet: false,
            errors: {},

            id: '',
            username: '',
            storedUsername: '',
            isOwner: false,
            changeUsername: false,

            // Challenge data
            challengeStatus: 'wait', // 'edit', 'start', 'complete'
            challenge: null,
            showChallenges: false,
            countDown: 0,
            countDownStarting: true,
            hasParticipated: false,
            answerSent: false,
            mobileScreen: false,

            users: {},
            recentLeavers: [],

            messages: [],
            message: '',
            
            localVideoRef: React.createRef(),
            user_streams: {}
        }
        this.timerReachedZero = null
        this.countDownIsZero = null
    }

    componentWillMount() {
        let isMobile = window.matchMedia("only screen and (max-width: 600px)").matches;

        if (isMobile) {
            this.setState({ mobileScreen: true })
        }
    }

    componentDidMount = async() => {

        await this.validateRoomId();
        const { loading, inValidId, room, userIsSet } = this.state;
        var elems = document.querySelector('.tooltipped');
        M.Tooltip.init(elems, {});

        if (!loading && !inValidId && !isEmpty(room)) {
            let socket = io.connect(window.location.origin);

            // document.getElementById('remote').srcObject = remoteStream;
            this.setState({ socket }, () => userIsSet && this.socketEvents(socket));
        }
    }

    // refresh = async () => {
    //     this.state.socket.emit('disconnect');
    //     this.setState({
    //         room: {},
    //         rooms: [],
    //         socket: null,
    //         stream: null,
    //         roomEnded: false,

    //         loading: true,
    //         inValidId: false,
    //         userIsSet: false,
    //         errors: {},

    //         id: '',
    //         username: '',
    //         storedUsername: '',
    //         isOwner: false,
    //         changeUsername: false,

    //         challengeStatus: 'wait',
    //         challenge: null,
    //         showChallenges: false,
    //         countDown: 0,
    //         countDownStarting: true,

    //         users: {},
    //         recentLeavers: [],

    //         messages: [],
    //         message: '',
            
    //         localVideoRef: React.createRef(),
    //         user_streams: {}
    //     }, async () => {
    //         this.timerReachedZero = null
    //         this.countDownIsZero = null
    //         await this.validateRoomId();
    //         const { loading, inValidId, room, userIsSet } = this.state;

    //         if (!loading && !inValidId && !isEmpty(room)) {
    //             let socket = io();

    //             // document.getElementById('remote').srcObject = remoteStream;
    //             this.setState({ socket }, () => userIsSet && this.socketEvents(socket));
    //         }
    //     })
    // }

    socketEvents = async socket => {

        // this.getStream();
        this.newUser(socket);
        this.getUsers(socket);
        // this.updateStreams();
        this.userJoined(socket);
        this.getNewMessages(socket);
        this.userLeft(socket);
        this.getChallenge(socket);
        this.getParticipants(socket)
        this.nameChange(socket);
        this.leaveRoom(socket)
        this.disconnected(socket);

        // socket.on("new-offer", async (offer, from, users) => {
        //     this.createRTCAnswer(offer, from, users)
        // });
        // this.answerReceived(socket);

        // setInterval(() => {
        //     socket.emit('get-all-offers');
        //     console.log('get offers called')
        // }, 50000)

        // socket.on('get-offers', async users => {
        //     this.checkForNewOffers(users)
        // })
    }

    disconnected = socket => {
        socket.on('disconnect', () => {
            console.log('disconnected')
            M.toast({html: 'Your connection has been lost', displayLength: 1000000, classes: 'red'})
            setTimeout(() => {
                window.location.reload()
            }, 5000)
        })
    }

    // getStream = async () => {
    //     let { socket, localVideoRef } = this.state;
    //     let stream = null;
    //     let constraints = { video: true, audio: true, video: { width: 320 } }

    //     try {
    //         stream = await navigator.mediaDevices.getUserMedia(constraints);

    //         try {
    //             localVideoRef.current.srcObject = stream;

    //         } catch (error) {
    //             localVideoRef.current.src = URL.createObjectURL(stream);
    //         }

    //         console.log('my id:', socket.id)
    //         this.setState({ stream });

    //         stream.getTracks().forEach(track => {
    //             peerConnection.addTrack(track, stream)
    //         });
            
    //         this.sendStream();
          
    //     } catch(err) {
    //         console.log(err)
    //     }
    // }

    // sendStream = async () => {
    //     let { socket, stream } = this.state;
    //     const offer = await peerConnection.createOffer();
    //     await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    //     socket.emit("send-offer", offer, stream.id);
    //     console.log('stream sent:', stream.id)
    // }

    // createRTCAnswer = async (offer, from, users) => {
    //     let { socket } = this.state;
    //     // console.log('client 2 received offer from', from);

    //     globalUsers = users;
        
    //     await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    //     const answer = await peerConnection.createAnswer();
    //     await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    //     let client1 = from;
    //     let client2 = socket.id;

    //     // send answer back to the client who created the connection
    //     // console.log('client 2 sent offer back to client 1 to create connection')
    //     socket.emit("send-answer", answer, client1, client2);
    // }

    // answerReceived = async socket => {
    //     socket.on("answer-received", async (answer) => {

    //         await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

    //         if (!hasReceived) {
    //             this.sendStream();
    //             hasReceived = true;
    //         }
    //     });
    // }

    // updateStreams = () => {
    //     setInterval(() => {
    //         let { socket, user_streams, recentLeavers } = this.state;
            
    //         let user = socket.id;
    //         let newStreams = {}

    //         if (recentLeavers.length > 0) {
    //             console.log('recentLeavers', recentLeavers)

    //             // remove user stream
    //             recentLeavers.forEach(id => {
    //                 if (id in streams) {
    //                     delete streams[id]
    //                     console.log('delete', id)
    //                 } 

    //                 if (id in user_streams) {
    //                     delete user_streams[id]
    //                     console.log('delete', id)
    //                 }
    //             })

    //             this.setState({ recentLeavers: [], user_streams })
    //         }

    //         Object.keys(streams).forEach(key => {
    //             if (!(key in user_streams) && key != user) {
    //                 newStreams[key] = { stream: streams[key].stream, streamRef: React.createRef() }
    //             }
    //         })

    //         if (Object.keys(newStreams).length > 0) {
    //             this.setState({ 
    //                 user_streams: { ...user_streams, ...newStreams }
    //             }, () => {

    //                 setTimeout(() => {
    //                     let { user_streams } = this.state;

    //                     for (let newUser of Object.keys(newStreams)) {
    //                         let eStream = user_streams[newUser].stream;

    //                         try {
    //                             user_streams[newUser].streamRef.current.srcObject = eStream;
    //                         } catch (error) {
    //                             user_streams[newUser].streamRef.current.src = URL.createObjectURL(eStream);
    //                         }
    //                     }
    //                     this.setState({ user_streams }, () => console.log('stream passed to ref', this.state.user_streams))

    //                 }, 5000)
    //             })
    //         }
    //     }, 5000)

    //     // console.log(socket && socket.id == user ? 'my stream' : 'adding stream')
    //     // if (user in user_streams || socket && socket.id == user) return;

    // }

    validateRoomId = async e => {
        let roomId = this.props.match.params.id;
        if (isEmpty(roomId)) {
            this.setState({ inValidId: true })
            return;
        }

        let userRooms = localStorage.getItem('rooms');
        let id = localStorage.getItem('id');
        let storedUsername = localStorage.getItem('username');

        if (!isEmpty(userRooms)) 
            userRooms = await JSON.parse(userRooms) 
        else 
            userRooms = []
        
        let userIsSet = false;
        let username = '';

        if (isEmpty(storedUsername)) {
            username = ''
        } else {
            username = storedUsername
            userIsSet = true;
        }

        this.setState({ id, username, userIsSet, storedUsername, rooms: userRooms })
        id = id ? id : 'none'
        // call api to check if room exists
        let res = await axios.get(`/api/room/${roomId}/${id}`)
        try {
            console.log(res.data);
            if (res && res.data && res.data.success) {
                let isOwner = false;
                if (id && id == res.data.room.owner) isOwner = true
                console.log('isOwner', isOwner);

                if (res.data.userId && res.data.userId != id) {
                    localStorage.setItem('id', res.data.userId)
                }

                if (userIsSet) {
                    this.saveRoom(res.data.room);
                }
                
                this.setState({ inValidId: false, loading: false, isOwner, room: res.data.room });
            } else {
                console.log(2)
            }
        } catch (err) {
            console.log(err.response.data)
            this.setState({ inValidId: true, loading: false })
        }
    }

    newUser = async socket => {
        let { room, username, id } = this.state;
        socket.emit('new-user', room._id, username, room.owner == id);
    }

    getUsers = async socket => {
        socket.on('get-users', users => {
            this.setState({ users }, () => {
                let {messages} = this.state;
                if (messages.length === 0) {
                    this.showOwnerTag();
                }
            });            
        })
    }

    showOwnerTag = () => {
        let { messages } = this.state;
        let name = this.getOwner('name');
        if (name) {
            let msg = <div className="small-text"><strong className="owner">{name}</strong> created the room</div>
            let msgs = [...messages]
            msgs[0] = msg;
            console.log(msgs)
            this.setState({ messages: msgs })
        }
    }

    // checkForNewOffers = (users) => {
    //     let { user_streams, socket } = this.state;
    //     if (Object.keys(users).length === 0) return;

    //     for (let key of Object.keys(users)) {
    //         // check if there is an offer and we dont already have it
    //         if ('offer' in users[key] && !(key in user_streams) && key != socket.id) {
    //             console.log('offer found from', key)
    //             this.createRTCAnswer(users[key].offer, key, users)
    //         }
    //     }
    // }

    userJoined = async socket => {
        socket.on('user-joined', user => {
            let msg = [<strong className="other">{user}</strong>, ' has joined the room']
            this.setState({ messages: [...this.state.messages, msg] })
        })
    }

    sendMessage = e => {
        e.preventDefault();

        if (!isEmpty(this.state.message)) {
            this.state.socket.emit('send-message', this.state.message);

            let msg = [<strong className='me'>{this.state.username}</strong>, ': ' + this.state.message];
            this.setState({ message: '', messages: [...this.state.messages, msg] });
        }
    }

    changeUsername = e => this.setState({ username: e.target.value })

    setUsername = e => {
        e.preventDefault();
        let { socket, username, storedUsername, userIsSet, room, changeUsername } = this.state;

        let errors = {}
        
        let c = getCharNWordsCount(username);

        if (isEmpty(username) || c && c.chars < 7 || c.words < 2) {
            errors.username = 'Please enter your full name'
            this.setState({ errors })
            return;
        }

        if (username != storedUsername) {
            localStorage.setItem('username', username)
            this.setState({ storedUsername: username });
        }

        if (userIsSet) {
            if (changeUsername) {
                socket.emit('name-change', username);
                this.setState({ changeUsername: false })
            };
            return
        }

        this.saveRoom(room)
        this.setState({ userIsSet: true, errors }, () => this.socketEvents(socket));
    }

    saveRoom = room => {
        let { rooms } = this.state;
        if (rooms.includes(room._id)) return

        this.setState({ rooms: [...rooms, room._id]})
        localStorage.setItem('rooms', JSON.stringify(rooms));
    }   

    getNewMessages = async socket => {
        socket.on('new-message', data => {
            let { messages } = this.state;

            let msg = [<strong className={data.id == socket.id ? 'me' : data.id == this.getOwner() ? 'owner' : 'other' }>{data.username}</strong>, ': ' + data.message];
            let msgs = [...messages]

            if (msgs.length >= 25)
                msgs.splice(1, 1);

            msgs.push(msg);
            this.setState({ messages: msgs })
        })
    }

    userLeft = async socket => {
        socket.on('user-left', id => {
            let { users, recentLeavers } = this.state;

            let msg = [<strong className="other">{users[id].name}</strong>, ' has left the room']
            if (!recentLeavers.includes(id)) {
                this.setState({ recentLeavers: [...recentLeavers, id] })
            }
            this.setState({ messages: [...this.state.messages, msg]})
        })
    }

    nameChange = async socket => {
        socket.on('get-name-change', (oldName, newName, id) => {
            let { messages, isOwner } = this.state;
            let ownerChangeName = id == this.getOwner();

            let _class = ownerChangeName && !isOwner ? 'owner' : socket.id == id ? 'me' : 'other'

            let msg = [
                <strong className={_class}>{socket.id == id ? 'You': oldName}</strong>, 
                ` changed ${socket.id == id ? 'your' : 'their'} name to `, 
                <strong className={_class}>{newName}</strong>
            ]
            this.setState({ messages: [...messages, msg]})
        })
    }

    closeRoom = () => {
        let {room, id, socket} = this.state;
        if (id && id == room.owner) {
            let procced = window.confirm(`This will kick all the users and close the room, you may re-open the room again by going to the same URL. Are you sure you want to procced?`);
            if (!procced) return

            socket.emit('close-room')
        }
    }

    leaveRoom = async socket => {
        socket.on('leave-room', () => {
            this.setState({ roomEnded: true });
        })
    }

    typing = e => {
        this.setState({ message: e.target.value });
    }

    // renderVideos = () => {
    //     const { localVideoRef, user_streams } = this.state;
    //     return (
    //         <div className="col videos">
    //             <div className="video-view-mode">
    //                 {/* Add single view mode on click */}
    //             </div>
    //             <video ref={localVideoRef} muted autoPlay className="local-video"></video>
    //             {/* <video id="remote" muted autoPlay className="remote-video"></video> */}

    //             { Object.keys(user_streams).map(user => {
    //                 console.log('vid', user_streams[user])
    //                 return <video ref={user_streams[user].streamRef} muted autoPlay className="remote-video"></video>
    //             })}
    //         </div>
    //     )
    // }

    selectChallenge = challenge => {
        if (challenge && window.location.hostname !== "localhost") {
            challenge.question = ''
            challenge.answer = ''
            challenge.choices = []
        }
        this.setState({ errors: {}, challenge: {...challenge, owner: this.state.socket.id}, challengeStatus: challenge == null ? 'wait' : 'edit' })
    }

    onEditChallenge = (e, status=false) => {
        let { name, value } = e.target;

        this.setState({ 
            challenge: {
                ...this.state.challenge,
                [name]: value
            }
         }, () => {
            let { socket, challenge, hasParticipated } = this.state

             if (status == 'participant') {
                if (hasParticipated) return;

                this.setState({ hasParticipated: true });
                if (getValueIndexOfArray(socket.id, 'id', challenge.participants) === -1) {
                    socket.emit('new-participant', challenge);
                }
             }
         })
    }

    addChoice = () => {
        let { challenge } = this.state;
        let errors = {}

        if (isEmpty(challenge.choice)){
            errors.choice = 'You must add a choice'
        } else if (challenge.choices.includes(challenge.choice)) {
            errors.choice = 'This choice is already added'
        } else if (challenge.choices.length > 7) {
            errors.choice = 'Too many choices.'
        }

        if (eachKey(errors).length > 0) {
            this.setState({ errors })
            return
        }

        this.setState({ errors, challenge: {...challenge, choices: [...challenge.choices, challenge.choice], choice: '' }})
    }

    getParticipants = socket => {
        socket.on('get-participants', (participants, answers) => {
            console.log('participants', participants)
            this.setState({ challenge: { ...this.state.challenge, participants} });
        })
    }
    
    startChallenge = e => {
        e.preventDefault();
        let { socket, challenge, users } = this.state;
        let errors = {};

        if (isEmpty(challenge.question)) {
            errors.question = 'Question field cannot be empty'
        }

        if (isEmpty(challenge.answer)) {
            if (challenge.type == 'Q&A') {
                errors.answer = 'Answer field cannot be empty'
            } else {
                if (challenge.choices.length > 1) {
                    errors.answer = 'You must select the correct answer'
                }
            }
        }

        if (challenge.type == 'MC' && challenge.choices.length < 2) {
            errors.choice = 'You must add atleast 2 choices'
        }

        if (eachKey(errors).length) {
            this.setState({ errors })
            return
        }
        
        if (eachKey(users).length === 1 && socket.id in users) {
            window.alert('There are no students in the room, send them the link so they can join.');
            return
        }

        let c = {
            ...challenge,
            question:  challenge.question.trim(),
            answer: challenge.answer.trim()
        }

        console.log(c.answer);

        let beginNow = window.confirm(`There is ${eachKey(users).length - 1} student${eachKey(users).length - 1 > 1 ? 's' : ''} in the room, do you want to begin the challenge now?`);
        if (!beginNow) return

        this.setState({ errors, challenge: c, challengeStatus: 'start', countDown: 5 }, () => {
            this.newChallenge(socket, this.state.challenge);
            this.initTimer()
        });
    }

    // Owner
    newChallenge = (socket, challenge) => {
        socket.emit('new-challenge', challenge);
    }

    // Students
    getChallenge = socket => {
        socket.on('get-challenge', challenge => {
            this.setState({ challenge, challengeStatus: 'start', countDown: 5, showChallenges: true }, () => this.initTimer());
        })
    }

    initTimer = () => {
        this.countDownIsZero = setInterval(this.countDown, 1000);
    }

    countDown = () => {
        let { countDown } = this.state;

        if (countDown > 0) {
            countDown -= 1;
            this.setState({ countDown });

        } else {
            clearInterval(this.countDownIsZero);
            this.timerReachedZero = setInterval(this.challengeTimer, 1000);
        }
    }

    challengeTimer = () => {
        let { challenge, socket } = this.state;
        let _timer = challenge.timer;

        if (_timer > 1) {
            _timer -= 1
            this.setState({ challenge: { ...this.state.challenge, timer: _timer }})

        } else {
            clearInterval(this.timerReachedZero);
            this.timerReachedZero = null;

            this.challengeCompleted();
        }
    }

    sendAnswer = e => {
        e.preventDefault();
        let { socket, challenge } = this.state;

        if (isEmpty(challenge.studentAnswer)) {
            this.setState({ errors: { studentAnswer: challenge.type == 'Q&A' ? 'You must provide an answer' : 'You must select an answer' }});
            return
        } else {
            this.setState({ errors: {} });
        }

        let answer = challenge.studentAnswer.trim();
        this.setState({ answerSent: true });

        if (socket.id != challenge.owner) {
            socket.emit('send-answer', challenge.id, answer)
        }
    }

    challengeCompleted = () => {
        this.setState({ answerSent: false, hasParticipated: false });
        this.setState({ challengeStatus: 'complete' })
    }

    setChallengeStatus = status => {
        if (status == 'wait' || status == 'edit' || status == 'start' || status == 'complete')
            this.setState({ challengeStatus: status });
    }

    getOwner = (name=false) => {
        let { users } = this.state;
        let id = eachKey(users).filter(id => users[id].owner)
        if (id && id.length){
            if (name) {
                return users[id[0]].name
            } else {
                return id[0]
            }
        }
        return false;
    }

    clearChallenge = () => {
        let { challenge } = this.state;

        if (challenge) { 
            this.setState({ errors: {}, challenge: { ...challenge, question: '', answer: '', choices: [], choice: '' }})
        }
    }

    render() {
        const { mobileScreen, showChallenges, username, roomEnded, answerSent, disconnected, changeUsername, errors, room, socket, loading, inValidId, users, messages, userIsSet, isOwner, countDown, challenge, challengeStatus, challengeResults } = this.state;

        return (
            <div className="row">
                { loading ? <Spinner/> : inValidId ? 'Invalid ID' : !userIsSet || changeUsername ? (
                    <ChangeUsername username={username} changeUsername={this.changeUsername} setUsername={this.setUsername} errors={errors} room={room} />
                ) : roomEnded ? (
                    <>
                        { isOwner ? <p>You have closed the room.</p> : <p>Room has ended.</p>}
                    </>
                ) : (
                    <div className="row">
                        {/* Left column */}
                        <div className="col s12 m8 l8 nav">
                            <div className="row">
                                <div className="col s12 m6 l6">
                                    <h4>Room: {room.name}</h4>
                                    <span>Hi {username} </span>
                                    <div>
                                        <a className="link-dash" onClick={() => {this.setState({ changeUsername: true });}} href="javascript:void(0);">Change username</a>
                                    </div>
                                   { isOwner && (
                                        <div>
                                            <a className="red-color link-dash" onClick={() => this.closeRoom()} href="javascript:void(0);">Close room</a>
                                        </div>
                                   )}
                                    <br/>
                                    <span>Users: {eachKey(users).length}</span>
                                </div>
                                { isOwner && challengeStatus !== 'start' && (
                                   <>
                                    <div className="col">
                                        <div className="top-create-btn">
                                            <a className="btn" onClick={() => {
                                                    this.setState({ challengeStatus: 'wait', showChallenges: true });
                                                }}>
                                                <i className="material-icons right">add</i> 
                                                challenge
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="top-create-btn">
                                            <a className="btn whiteboardbtn" onClick={() => this.setState({ showChallenges: false })}>
                                                <i className="material-icons right">dashboard</i> 
                                                Whiteboard
                                            </a>
                                        </div>
                                    </div>
                                   </>
                                )}
                            </div>

                            <div className="row">
                                <div className="col s12 center">
                                    { isOwner ? <Owner challenge={challenge} HOST={HOST} errors={errors} addChoice={this.addChoice} clearChallenge={this.clearChallenge} room={room} showChallenges={showChallenges} myId={socket && socket.id} users={users} countDown={countDown} challengeStatus={challengeStatus} selectChallenge={this.selectChallenge} onEditChallenge={this.onEditChallenge} startChallenge={this.startChallenge} challengeResults={challengeResults} setChallengeStatus={this.setChallengeStatus} />
                                        : <Participant challenge={challenge} errors={errors} answerSent={answerSent} sendAnswer={this.sendAnswer} myId={socket && socket.id} users={users} onEditChallenge={this.onEditChallenge} viewBoard={() => this.setState({ showChallenges: false })} countDown={countDown} challengeStatus={challengeStatus} challengeResults={challengeResults} setChallengeStatus={this.setChallengeStatus} />
                                    }
                                   {socket &&  <div style={{ display: showChallenges ? 'none' : 'block'}}>
                                        <Whiteboard mobileScreen={mobileScreen} leaving={showChallenges ? 'yes' : 'no'} room={room} myId={socket} users={users} isOwner={isOwner} socket={socket} />
                                    </div>}
                                    
                                </div>
                            </div>
                        </div>

                        {/* Right column - messenger */}
                        <div className="col s12 m4 l4">
                            <div className="card-panel messenger">
                                <h5>Messenger</h5>
                                <div className="chat" id="chat">
                                    { messages.map((message, i) => <div key={i} className="small-text">{message}</div>)}
                                </div>
                    
                                <form noValidate onSubmit={this.sendMessage}>
                                    <TextFieldGroup
                                        type="text"
                                        placeholder="Write a message"
                                        name="message"
                                        classes='input-text'
                                        value={this.state.message}
                                        onChange={this.typing}
                                    />
                                    <input type="submit" value="Send" className="btn btn-primary"/>
                                </form>
                            </div>
                            { room && <a href={`/room/${room._id}`} ><span className="small-text link-dash">Refresh room if you are experiencing issues.</span></a> }
                            <br/>
                            <Feedback top={true}/>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}


// Map state to props so they can be used in this component
const mapStateToProps = (state) => ({
    auth: state.auth,
    profile: state.profile,
    videos: state.videos
});


// Connect actions to use within redux and export component
export default connect(mapStateToProps, { setStream })(withRouter(CreateRoom));
