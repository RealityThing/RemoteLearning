
// React
import React, { Component } from 'react';

// Connecting Redux
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

// Components
import TextFieldGroup from '../layout/TextFieldGroup';

// Actions
import { registerUser } from '../../actions/authActions';


// Defining a custom component/class
class Register extends Component {

    constructor() {
        super();
        this.state = {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            password2: '',
            errors: {}
        };
    };

    componentDidMount() {
        if (this.props.auth.isAuthenticated) {
            this.props.history.push('/');
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.errors){
            this.setState({ errors: nextProps.errors });
        }
    }

    // This method gets triggered when a user enters something
    onChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value
        });
    };

    // This method gets called when a user submits
    onSubmit = (event) => {
        event.preventDefault();

        const newUser = {
            first_name: this.state.first_name,
            last_name: this.state.last_name,
            email: this.state.email,
            password: this.state.password,
            password2: this.state.password2
        };

        this.props.registerUser(newUser, this.props.history);
    };

    render() {

        // Desctructing allows us to pull errors from the state object
        const { errors } = this.state;
        const { user } = this.props.auth;

        // Set class 'is-invalid' only if there is an errors name.

        return (
            <div className="register">
                {user ? user.name : null}
                <div className="container">
                    <div className="row">
                        <div className="col-md-8 m-auto">
                            <h1 className="display-4 text-center">Sign Up</h1>

                            <form noValidate onSubmit={this.onSubmit}>
                                <TextFieldGroup
                                    label="First name"
                                    name="first_name"
                                    value={this.state.first_name}
                                    onChange={this.onChange}
                                    error={errors.first_name}
                                />

                                <TextFieldGroup
                                    label="Last name"
                                    name="last_name"
                                    value={this.state.last_name}
                                    onChange={this.onChange}
                                    error={errors.last_name}
                                />

                                <TextFieldGroup
                                    type="email"
                                    label="Email Address"
                                    name="email"
                                    value={this.state.email}
                                    onChange={this.onChange}
                                    error={errors.email}
                                />

                                <TextFieldGroup
                                    type="password"
                                    label="Password"
                                    name="password"
                                    value={this.state.password}
                                    onChange={this.onChange}
                                    error={errors.password}
                                />

                                <TextFieldGroup
                                    type="password"
                                    label="Confirm Password"
                                    name="password2"
                                    value={this.state.password2}
                                    onChange={this.onChange}
                                    error={errors.password2}
                                />

                                <input type="submit" className="btn btn-info btn-block mt-4"/>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

// Mapping prop types e.g. registerUser is a function so we set the proptypes as function and required.
Register.propTypes = {
    registerUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired
};


// mapping state to props, state.account comes from the rootreducer
const mapStateToProps = (state) => ({
    auth: state.auth,
    errors: state.errors
})

// Export all actions used
export default connect(mapStateToProps, { registerUser })(withRouter(Register));

