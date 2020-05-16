import React from 'react';
import Feedback from './Feedback'

export default (props) => {
    return (
        <>
            {props.class == 'footer-fixed' && <Feedback />}
            <div className={props.class}>
                <div className="left">
                    <a className="white-text" href="mailto:sam@realitything.com" > <span className="footer-text small-text">Contact Us</span></a>
                </div>
                    <span className="footer-text small-text">@ 2020 Remote Learning </span>
                
                <div className="right">
                    <span className="footer-text small-text"> Developed by <b>RealityThing</b> </span>
                </div>
            </div>
        </>
    )
}
