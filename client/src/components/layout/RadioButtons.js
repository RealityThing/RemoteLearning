
import React from 'react';
import '../../styles/main.css'

const RadioButtons = ({
            choices,
            name,
            classes,
            error,
            info,
            infoClass,
            onChange,
            disabled,
            selectedChoice
        }) => {

    return (
        <div className="input-field">
            <div className="row center">
                { choices.map(choice => {
                    return (
                        <label>
                            <input 
                                className={`with-gap ${classes}`} 
                                disabled={disabled} 
                                name={name} 
                                type="radio"  
                                value={choice}
                                onChange={onChange}
                                checked={selectedChoice == choice}
                            />
                            <span className="radiolabel">{choice}</span>
                        </label>
                    )
                })}
            </div>
            <div className="row">
                    {error ? (<span className="helper-text invalid-feedback"> {error} </span>) 
                    : info ? (<span className={`helper-text ${infoClass}`} >{info}</span>
                    ) : null }
            </div>
        </div>
    )
}

export default RadioButtons;
