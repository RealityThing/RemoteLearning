import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TextFieldGroup from '../layout/TextFieldGroup';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import axios from 'axios'
import isEmpty from '../../utils/is-empty'
import '../../styles/main.css'
import logo from '../../assets/logo.png'

class Landing extends Component {

    constructor(props){
        super(props);
        this.state = {
            roomId: '',
            errors: {},
            id: false
        }
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
        // call api to check if room exists
        axios.get(`/api/room/${roomId}/${id}`)
            .then(res => {
                console.log(res.data);
                this.props.history.push(`/room/${roomId}`)
            })
            .catch(err => {
                console.log(err.response.data)
                if (err && err.response && err.response.data) {
                    this.setState({ errors: err.response.data })
                }
            })
    }

    render() {
        return (
            <div className="landing">
                <div className="dark-overlay landing-inner mt-3">
                    <div className="container">
                        <div className="row">
                            <div className="text-center">
                                <div className="center">
                                    <img src={logo} className="logo"/>
                                    <div className="info-msg">
                                        <span>An interactive platform for schools, university or anyone!<br/> Ask questions and challenge others in real-time.<br/> No sign-up required, just create a room then send the link to others.</span>
                                    </div>
                                </div>
                                <div className="row">
                                    <form noValidate onSubmit={this.onSubmit}>
                                        <div className="col s12 m0 l3"/>
                                        <div className="col s12 m6 l3">
                                            <TextFieldGroup
                                                type="text"
                                                placeholder="Paste room ID"
                                                name="roomId"
                                                value={this.state.roomId}
                                                onChange={e => this.setState({ roomId: e.target.value })}
                                                error={this.state.errors.roomId}
                                            />
                                        </div>
                                        <div className="row">
                                            <div className="col btnt">
                                                <input type="submit" value="Enter Room" className="btn btn-info btn-block mt-4"/>
                                            </div>

                                            <div className="col btnt">
                                                <Link to="/create" className="btn btn-lg btn-light">Create a room</Link>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
