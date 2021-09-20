import React from 'react';
import Feedback from './Feedback'

export default () => {
    return (
        <>
        <div className='footer'>
            <div className="left">
                <a className="white-text" href="mailto:sam@realitything.com" > <span className="footer-text small-text">Contact Us</span></a>
                |
                <Feedback/>
            </div>
            
            <div className="right">
                <span className="footer-text small-text">@ 2020 Remote Learning </span>
            </div>
        </div>
        </>
    )
}
