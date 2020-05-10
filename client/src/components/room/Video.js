
// React and redux modules
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

class Video extends Component {

    render() {
        return (
            <div>

            </div>
        )
    }
}


// Map state to props so they can be used in this component
const mapStateToProps = (state) => ({
    auth: state.auth,
    profile: state.profile
});


// Connect actions to use within redux and export component
export default connect(mapStateToProps, { })(Video);
