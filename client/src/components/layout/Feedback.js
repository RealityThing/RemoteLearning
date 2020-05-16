// React and redux modules
import React, { Component } from 'react';
import '../../styles/main.css'
import TextArea from './TextArea'
import TextFieldGroup from './TextFieldGroup'
import M from 'materialize-css';

import isEmpty from '../../utils/is-empty';
import axios from 'axios';

class Footer extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            message: '',
            email: '',
            sent: false,
            errors: {}
        }
    }

    componentDidMount() {
        M.AutoInit()
    }

    submit = e => {
        e.preventDefault();
        let { message, email } = this.state;

        if (!isEmpty(message)) {
            let data = {message}
            
            if (!isEmpty(email)) data.email = email;
            console.log(data);

            axios.post(`/api/feedback`, data)
                .then(res => {
                    if (res && res.data && res.data.success) {
                        this.setState({ sent: true, message: '', email: '', errors: {} })
                    }
                })
                .catch(err => {
                    console.log(err.response.data);
                    this.setState({ errors: err.response.data, sent: false })
                });
        } else {
            this.setState({ errors: { message: 'Message cannot be empty', sent: false }})
            return false
        }
    }

    render() {
        return (
            <div className="mb">
                <a className="btn teal lighten-2 modal-trigger" href="#modal1">Send Feedback</a>

                <div id="modal1" className="modal">
                <div className="modal-content">
                    <h5 className="">Send us any issues or feedback you have had while using RemoteLearning</h5>
                    <br/>
                    
                    <form onSubmit={this.submit}>
                        <TextArea 
                            name="message"
                            placeholder="Write a message here"
                            error={this.state.errors.message}
                            value={this.state.message}
                            onChange={e => this.setState({ message: e.target.value })}
                        />

                        <TextFieldGroup 
                            name="email"
                            type="email"
                            label="Email"
                            info="Optional"
                            value={this.state.email}
                            onChange={e => this.setState({ email: e.target.value })}
                        />

                        <input type="submit" className="btn teal lighten-2" value="Submit"/>

                    </form>
                </div>
                    <div className="modal-footer">
                        {this.state.errors && this.state.errors.error ? <span className="helper-text invalid-feedback">{this.state.errors.error}</span>: null}
                        {this.state.sent && <span className="helper-text me">Message has been sent</span>}
                        <a href="javascript:void(0);" onClick={() => this.setState({ errors: {}, message: '', email: '', sent: false })} className="modal-close btn-flat">Close</a>
                    </div>
                </div>
            </div>
        )
    }
}

export default Footer

