
import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import TextFieldGroup from "./TextFieldGroup";
import isEmpty from '../../utils/is-empty';

const TextArea = ({
                            name,
                            placeholder,
                            classes,
                            value,
                            icon,
                            label,
                            error,
                            info,
                            infoClass,
                            onChange,
                            disabled
                        }) => {
    return (
        <div className="input-field">
            {icon && <i className="material-icons prefix">{icon}</i>}
            <textarea
                className={`materialize-textarea validate ${classes}`}
                placeholder={placeholder}
                id={name}
                name={name}
                disabled={disabled}
                value={value}
                onChange={onChange}
            />
            {label && <label className={!isEmpty(value) ? 'active' : ''} for={name}>{label}</label>}
            {error ? (<span className="helper-text invalid-feedback"> {error} </span>) 
            : info ? (<span className={`helper-text ${infoClass}`} >{info}</span>
            ) : null }

        </div>
    )
}

TextArea.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    error: PropTypes.string,
    info: PropTypes.string
};



export default TextArea;
