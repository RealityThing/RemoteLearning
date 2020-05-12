
// React and redux modules
import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios'
import TextFieldGroup from '../layout/TextFieldGroup';
import isEmpty from '../../utils/is-empty'
import '../../styles/main.css'
import { getCharNWordsCount, eachKey } from '../../utils/valueHelpers';
import logo from '../../assets/logo.png'
import Spinner from '../layout/Spinner';

// Custom react component/class
class CreateRoom extends Component {

    constructor(props) {
        super(props);

        this.state = {
            room: '',
            id: '',
            username: '',
            storedUsername: '',
            errors: {},
            rooms: [],
            loading: false
        }
    }

    componentWillMount = async () => {
        let id = localStorage.getItem('id')
        let username = localStorage.getItem('username')
        let rooms = localStorage.getItem('rooms');

        if (!isEmpty(rooms)) {
            rooms = await JSON.parse(rooms);

            console.log(rooms);
            this.setState({rooms});
        }

        if (!isEmpty(id)) this.setState({ id })
        if (!isEmpty(username)) this.setState({ username, storedUsername: username });
    }


    componentWillReceiveProps(nextProps){
        if (nextProps.errors){
            this.setState({ errors: nextProps.errors });
        }
    }

    onChange = (event) => {
        this.setState({
           [event.target.name]: event.target.value
        });
    }

    onSubmit = async e => {
        e.preventDefault();
        
        let { room, rooms, username, id, storedUsername } = this.state;

        let data = { room, username, id: !isEmpty(id) ? id : false };
        let errors = {}

        if (isEmpty(room)) {
            errors.room = 'Please enter a room name'
            this.setState({ errors })
        } 

        let c = getCharNWordsCount(username);

        if (isEmpty(username) || c && c.chars < 7 || c.words < 2) {
            errors.username = 'Please enter your full name'
            this.setState({ errors })
        }

        if (!isEmpty(errors)) return
        this.setState({ loading: true, errors: {} });

        axios.post(`/api/room`, data)
            .then(async res => {
                if (res && res.data && res.data._id) {
                    console.log(res.data);

                    if (storedUsername != username) {
                        localStorage.setItem('username', username)
                        this.setState({ storedUsername: username, errors });
                    }

                    if (isEmpty(id)) {
                        localStorage.setItem('id', res.data.owner)
                    } else if (id != res.data.owner) {
                        console.log('somethings wrong')
                    }

                    rooms.push(res.data._id);
                    localStorage.setItem('rooms', JSON.stringify(rooms));

                    this.setState({ loading: false });
                    this.props.history.push(`/room/${res.data._id}`)
                } else {
                    this.setState({ loading: false });
                }
            })
            .catch(err => {
                if (err && err.response && err.response.data)
                    this.setState({ errors: err.response.data, loading: false })
            })
    }

    render() {

        const { errors, username, room, loading } = this.state;

        return (
            <div className="login landing">
                <div className="container">
                    <div className="row">
                        <div className="col-md-8 m-auto">
                            <div className="center">
                                <img src={logo} className="logo"/>
                            </div>
                            <form noValidate onSubmit={this.onSubmit}>
                                
                                <div className="row">
                                    <div className="col s12 m0 l3"/>
                                    <div className="col s12 m6 l3">
                                        <TextFieldGroup
                                            type="text"
                                            placeholder="Full Name"
                                            info="This will be shown to the students"
                                            name="username"
                                            value={username}
                                            onChange={e => this.setState({ username: e.target.value })}
                                            error={errors.username}
                                        /> 
                                    </div>
                                
                                    <div className="col s12 m6 l3">
                                        <TextFieldGroup
                                            type="text"
                                            placeholder="Class Name"
                                            info="e.g CS-101-Class1"
                                            name="room"
                                            value={room}
                                            onChange={this.onChange}
                                            error={errors.room}
                                        />
                                    </div>

                                    <div className="col btnt">
                                        <input type="submit" value="Create" className="btn btn-info btn-block mt-4"/>
                                    </div>
                                </div>
                            </form>
                            <div className="row">
                                <div className="col">
                                    { loading && <Spinner/>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default CreateRoom
