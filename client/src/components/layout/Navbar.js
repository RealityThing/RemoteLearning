import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import components
import { logoutUser } from "../../actions/authActions";

class Navbar extends Component {

    onLogoutClick = (event) => {
        event.preventDefault();
        this.props.logoutUser();
    };

    render() {
        const { isAuthenticated, user } = this.props.auth;

        const authLinks = (
            <ul className="navbar-nav ml-auto">

                <li className="nav-item">
                    <Link className="nav-link" to="/">Learning Together</Link>
                </li>
                <li className="nav-item">
                    <Link to="" className="nav-link" onClick={this.onLogoutClick}>
                        <img src={user.avatar}
                             alt={user.name}
                             className="rounded-circle"
                             style={{ width: '25px', marginRight: '5px'}}
                             title="You must have a Gravatar connected to your email to display an image" />
                        {" "}
                        Log out
                    </Link>
                </li>
            </ul>
        );

        const guestLinks = (
            <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                    <Link className="nav-link" to="/register">Sign Up</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                </li>
            </ul>
        );

        return (
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark mb-4">
                <div className="container">
                    <Link className="navbar-brand" to="/">MERNQuick</Link>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#mobile-nav">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="mobile-nav">

                        { isAuthenticated ? authLinks : guestLinks }

                    </div>
                </div>
            </nav>
        )
    }
}

Navbar.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
    auth: state.auth
});

export default connect(mapStateToProps, { logoutUser })(Navbar);
