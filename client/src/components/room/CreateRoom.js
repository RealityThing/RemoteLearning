
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

    removeEmojis = str => {
        var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
        return str.replace(regex, '');
    }

    isEmoji = str => {
        var ranges = [
            '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])' // U+1F680 to U+1F6FF
        ];
        if (str.match(ranges.join('|'))) {
            return true;
        } else {
            return false;
        }
    }

    onSubmit = async e => {
        e.preventDefault();
        
        let { room, rooms, username, id, storedUsername } = this.state;

        let data = { room, username, id: !isEmpty(id) ? id : false };
        let errors = {}

        if (this.isEmoji(username))
            username = this.removeEmojis(username)

        if (this.isEmoji(room))
            room = this.removeEmojis(room);

        if (isEmpty(room)) {
            errors.room = 'Please enter a room name'
            this.setState({ errors })
        } 

        let c = getCharNWordsCount(username);

        if (isEmpty(username) || c && c.chars < 4 || c.words < 2) {
            errors.username = 'Please enter your full name'
            this.setState({ errors })
        }

        if (!isEmpty(errors)) return
        console.log(username, room);
        
        this.setState({ loading: true, errors: {} });

        axios.post(`/api/room`, data)
            .then(async res => {
                if (res && res.data && res.data._id) {
                    console.log(res.data);

                    if (storedUsername != username) {
                        localStorage.setItem('username', username)
                        this.setState({ storedUsername: username, errors });
                    }

                    if (isEmpty(id) || id != res.data.owner) {
                        localStorage.setItem('id', res.data.owner)
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
            <div className="container">
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
            </div>
        )
    }
}

export default CreateRoom
