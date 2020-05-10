
import React from 'react';
import classnames from 'classnames';
import M from 'materialize-css';

class SelectList extends React.Component {

    componentDidMount() {
        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems, {});
    }

    render () { 
        let { name,
            value,
            defaultValue,
            label,
            error,
            info,
            onChange,
            options } = this.props;

        return (
            <div className="input-field">
                <select onChange={onChange} name={name} value={value}>
                    <option value="" disabled selected>{defaultValue}</option>
                    { name == 'timer' ? [5,10,20,30,40,50,60].map(time => <option key={time} value={time}>{time} seconds</option>) : options.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                {label && <label>{label}</label>}
                {info && (<small className="form-text text-mutated">{info}</small>)}
                {error && (<div className="invalid-feedback"> {error} </div>)}
            </div>
        )
    }
}

export default SelectList;
