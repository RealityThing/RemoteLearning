import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TextFieldGroup from '../layout/TextFieldGroup';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import axios from 'axios'
import isEmpty from '../../utils/is-empty'
import '../../styles/main.css'
import logo from '../../assets/logo.png'
import Spinner from '../layout/Spinner';
import Feedback from './Feedback'

import '../../styles/meanmenu.css'
import '../../styles/settings.css'
import '../../styles/style.css'
import '../../fonts/ep-icon-fonts/css/style.css'
import '../../fonts/fontawesome-5/css/all.min.css'

class Landing extends Component {

    constructor(props){
        super(props);
        this.state = {
            roomId: '',
            errors: {},
            id: false,
            loading: false
        }
        this.video = null
    }

    componentDidMount() {
        let id = localStorage.getItem('id')
        if (!isEmpty(id)) this.setState({ id })
    }

    onSubmit = e => {
        e.preventDefault();
        let { roomId, id } = this.state;
        let errors = {}

        if (isEmpty(roomId)) {
            errors.roomId = 'Please enter a valid room ID'
            this.setState({ errors })
            return;
        }
        id = id ? id : 'none'
        this.setState({ loading: true });

        // call api to check if room exists
        axios.get(`/api/room/${roomId}/${id}`)
            .then(res => {
                console.log(res.data);
                this.setState({ loading: false })
                
                if (res.data.userId && res.data.userId != id) {
                    localStorage.setItem('id', res.data.userId)
                }
                this.props.history.push(`/room/${roomId}`)
            })
            .catch(err => {
                console.log(err.response.data)
                if (err && err.response && err.response.data) {
                    this.setState({ errors: err.response.data, loading: false })
                }
            })
    }

    toggleVideo = () => {
        if (this.video == null) return false
        console.log(this.video);

        this.video.paused ? this.video.play() : this.video.pause()
    }

    render() {
        return (
                <div className="site-wrapper">
                    <div className="hero-area">
                        <div className="container">
                            <div className="rowc center justify-content-center">
                                <div className="col l8 xl7">
                                <div className="hero-content">
                                    <img src={logo} className="logo"/>
                                    <p>Easily collaborate with others through a digital whiteboard.</p>
                                    <iframe className="video-player" width="650" height="390" src="https://www.youtube.com/embed/I_4kEnfrUD0?controls=0showinfo=0&relo=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

                                </div>
                                </div>
                                
                                <div className="col l7 xl6">
                                    <div className="subscription-form">
                                        <div className="call-action">
                                            <a href="#join-room" className="btn btn-landing green btn-lg btn-block join-a-room-btn mt-4 modal-trigger">
                                                <i style={{ marginRight: 5 }} className="fas fa-users"></i>
                                                Join A Room
                                            </a>
                                            <Link to="/create" className="btn btn-landing btn-lg btn-light">
                                                <i style={{ marginRight: 5 }} className="fa fa-plus-circle"></i>
                                                Create a room
                                            </Link>
                                        </div>
                                            {/* <input type="text" class="form-control" placeholder="Enter your email"/> */}
                                            {/* <button class="submit-btn btn--hover-shine ">Subscribe</button> */}
                                        <p className="form-text">Built for teachers, professors and students.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="join-room" className="modal join-room-modal">
                        <div className="modal-content">
                            <div className="row center">
                                <h3>Join A Room</h3>
                                
                                <form onSubmit={this.onSubmit}>
                                    <div className="col s12 center">
                                        <TextFieldGroup 
                                            name="roomId"
                                            type="text"
                                            placeholder="Room Id"
                                            value={this.state.roomId}
                                            onChange={e => this.setState({ roomId: e.target.value })}
                                            error={this.state.errors.roomId}
                                        />
                                    </div>
                                    <div className="col s12 center">
                                        <input type="submit" value="Enter Room" className="btn btn-large btn-info btn-block"/>
                                    </div>
                                    { this.state.loading && <Spinner/> }
                                </form>
                            </div>
                        </div>
                        {/* <div className="modal-footer">
                            {this.state.errors && this.state.errors.error ? <span className="helper-text invalid-feedback">{this.state.errors.error}</span>: null}
                            {this.state.sent && <span className="helper-text me">Message has been sent</span>}
                            <a href="javascript:void(0);" onClick={() => this.setState({ errors: {}, message: '', email: '', sent: false })} className="modal-close btn-flat">Close</a>
                        </div> */}
                    </div>

                    <div className="container">
                        <div className="feature-area">
                            <div className="container">
                                <div className="row center">
                                    <h2 style={{ marginBottom: 25 }}>How It Works</h2>
                                </div>
                                <div className="row center mb-d-30">
                                    <div className="col l4 s12 mb--30">
                                        <div className="feature-widget">
                                        <div className="widget-icon">
                                            <i className="icon icon-tablet-mobile"></i>
                                        </div>
                                        <div className="content">
                                            <h5>1. Create A Room</h5>
                                            <p>It is totally free and no registeration is required.</p>
                                        </div>
                                        </div>
                                    </div>
                                    <div className="col l4 s12 mb--30">
                                        <div className="feature-widget">
                                        <div className="widget-icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className="content">
                                            <h5>2. Invite Students</h5>
                                            <p>Share the link with others so they can join in.</p>
                                        </div>
                                        </div>
                                    </div>
                                    <div className="col l4 s12 mb--30">
                                        <div className="feature-widget">
                                        <div className="widget-icon">
                                            <i className="fas fa-chalkboard-teacher"></i>
                                        </div>
                                        <div className="content">
                                            <h5>3. Collaborate</h5>
                                            <p>Use the whiteboard to teach and challenge others.</p>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-section-01">
                        <div className="container">
                            <div className="row center">
                                <div className="col m6 s12 whiteboard-image">
                                    <div className="content-f-image">
                                        <img className="z-depth-3" src={require('../../assets/whiteboard.gif')} alt=""/>
                                    </div>
                                </div>

                                <div className="col m6 s12">
                                    <div className="content-right-content">
                                        <h2 className="t" style={{ fontSize: 60 }}>Digital Whiteboard.</h2>
                                        <p className="white-text">Write and draw in real-time, this will allow students to see your changes as you draw.</p>
                                        <br/>
                                        <p className="white-text">As the room creator, you can allow others to draw or just let them watch.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-section-02">
                        <div className="container">
                            <div className="row center">
                                <div className="col m6 s12">
                                    <div className="content-right-content">
                                        <h2 className="t" style={{ fontSize: 60 }}>Create Challenges.</h2>
                                        <p className="white-text">Challenge others in real-time. Ask questions, quiz students and keep them engaged.</p>
                                    </div>
                                </div>

                                <div className="col m6 s12 whiteboard-image-bottom">
                                    <div className="content-f-image">
                                        <img className="z-depth-3" src={require('../../assets/challenge.gif')} alt=""/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="video-containert">
                        <div className="container">
                            <div className="row">
                                <div className="subscription-form center">
                                    <h2 className="heading-demo">Try It Out!</h2>
                                    <div className="call-action">
                                        <a href="#join-room" className="btn btn-landing green btn-lg btn-block join-a-room-btn mt-4 modal-trigger">
                                            <i style={{ marginRight: 5 }} className="fas fa-users"></i>
                                            Join A Room
                                        </a>
                                        <Link to="/create" className="btn btn-landing btn-lg btn-light">
                                            <i style={{ marginRight: 5 }} className="fa fa-plus-circle"></i>
                                            Create a room
                                        </Link>
                                    </div>
                                    <p className="form-text">If you have any feedback for us, please <Feedback feedback={true} /> it through.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


            // <div className="landing">
            //     <div className="dark-overlay landing-inner mt-3">
            //         <div className="container">
            //             <div className="row">
            //                 <div className="text-center">
            //                     <div className="center">
            //                         <img src={logo} className="logo"/>
            //                         <div className="row">
            //                             {/* <iframe className="video-player" width="650" height="390" src="https://www.youtube.com/embed/I_4kEnfrUD0?controls=0showinfo=0&relo=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> */}
            //                         </div>
            //                         <h5 className="heading">
            //                             An interactive platform that puts your classroom into the digital world.
            //                         </h5>
            //                         {/* <span>An interactive and fun learning platform for all!<br/> Collaborate, draw, ask questions and challenge others in real-time.<br/> No sign-up required, just create a room then send the link to others.</span> */}
            //                     </div>
            //                     <div className="row">
            //                         <form noValidate onSubmit={this.onSubmit}>
            //                             <div className="col s0 m0 l3"/>
            //                             <div className="col s12 m8 l3">
            //                                 <TextFieldGroup
            //                                     type="text"
            //                                     placeholder="Room ID"
            //                                     name="roomId"
            //                                     value={this.state.roomId}
            //                                     onChange={e => this.setState({ roomId: e.target.value })}
            //                                     error={this.state.errors.roomId}
            //                                 />
            //                             </div>
            //                             <div className="row">
            //                                 <div className="col btnt">
            //                                     <input type="submit" value="Enter Room" className="btn btn-info btn-block mt-4"/>
            //                                 </div>

            //                                 <div className="col btnt">
            //                                     <Link to="/create" className="btn btn-lg btn-light">Create a room</Link>
            //                                 </div>
            //                             </div>
            //                         </form>
            //                         { this.state.loading && <Spinner/> }
            //                     </div>
            //                 </div>
            //             </div>

            //             <div className="row">
            //                 <div className="center">
            //                     <h3>How It Works</h3>
            //                     <div className="col">
            //                         x
            //                     </div>
            //                     <div className="col">
            //                         x
            //                     </div>
            //                     <div className="col">
            //                         x
            //                     </div>
            //                 </div>
            //             </div>

            //         </div>
            //     </div>
            // </div>
        )
    }
}

Landing.propTypes = {
    auth: PropTypes.object.isRequired
}

const mapStateToProps = (state) => ({
    auth: state.auth
});

export default connect(mapStateToProps)(Landing);
