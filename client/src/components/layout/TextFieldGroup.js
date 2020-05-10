import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import '../../styles/main.css';

const TextFieldGroup = ({
    name,
    placeholder,
    classes,
    value,
    icon,
    label,
    error,
    info,
    type,
    onChange,
    disabled
}) => {
    return (
        <div className="input-field">
            {icon && <i className="material-icons prefix">{icon}</i>}
            <input type={type}
                className={`validate ${classes}`}
                placeholder={placeholder}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
            {label && <label for={name}>{label}</label>}
            {error ? (<span className="helper-text invalid-feedback"> {error} </span>) 
            : info ? (<span className="helper-text" >{info}</span>
            ) : null }

        </div>
    )
}

TextFieldGroup.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    error: PropTypes.string,
    info: PropTypes.string,
    disabled: PropTypes.string
};

TextFieldGroup.defaultProps = {
    type: 'text'
};

export default TextFieldGroup;
