import React from 'react'
import TextFieldGroup from '../layout/TextFieldGroup';
import logo from '../../assets/logo.png'

const ChangeUsername = ({ username, changeUsername, setUsername, errors, room }) => {
    return (
        <div className="col-md-12 text-center">
            <div className="center">
                <img src={logo} className="logo"/>
                <h4 className="joining">Joining {room.name}</h4>
            </div>
            <div className="row">
                <form noValidate onSubmit={setUsername}>
                    <div className="col s4"/>
                    <div className="col s3">
                        <TextFieldGroup
                            type="text"
                            placeholder="Enter your full name to join the room"
                            name="username"
                            value={username}
                            onChange={changeUsername}
                            error={errors.username}
                        />           
                    </div>

                    <div className="col btnt">
                        <input type="submit" value="Enter" className="btn btn-primary"/>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChangeUsername