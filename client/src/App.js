import React, { Component } from 'react';

// React Router
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';

// Redux
import { Provider } from 'react-redux';
import store from './store';

// CSS
import './styles/main.css';

// JWT Token
import jwt_decode from 'jwt-decode';
import setAuthToken from './utils/setAuthToken';

// Actions
import { logoutUser, setCurrentUser } from './actions/authActions';

// Components
import PrivateRoute from './components/layout/PrivateRoute';

import Navbar from './components/layout/Navbar';
import Landing from './components/layout/Landing';

import Login from './components/account/Login';
import Register from './components/account/Register';

import CreateRoom from './components/room/CreateRoom';
import ViewRoom from './components/room/ViewRoom';
import Footer from './components/layout/Footer';

// Check for token
if (localStorage.jwtToken) {
  // Set account token header
  setAuthToken(localStorage.jwtToken);

  // Decode token and get user info and expiration
  const decoded = jwt_decode(localStorage.jwtToken);

  // Set user and isAuthenticate
  store.dispatch(setCurrentUser(decoded));
}

class App extends Component {
  constructor(props){
    super(props);
    this.state = { loading: false }
  }
  setLoader = status => {
    console.log(status)
    this.setState({ loading: status })
  }
  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className='App container'>
            <Route exact path='/' component={Landing} />
            <Route exact path='/create' component={CreateRoom} />
            <Route exact path='/room/:id' 
              render={props => <ViewRoom {...props} setLoader={this.setLoader} />}
            />
          </div>
        </Router>
       {!this.state.loading && <Footer class={window.location.href.includes('/room/') ? 'footer-fixed' : 'footer'} />}
      </Provider>
    );
  }
}

export default App;
