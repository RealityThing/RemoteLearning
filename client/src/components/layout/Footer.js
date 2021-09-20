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
            
            {!window.matchMedia("only screen and (max-width: 600px)").matches ? (
                <span className="footer-text small-text">@ 2020 Remote Learning </span>
            ): null }
            
            {/* <div className="right">
                <a className="white-text" target="_blank" href="https://realitything.com/"><span className="footer-text small-text"> Developed by <b>RealityThing</b> </span></a>
            </div> */}
        </div>
        </>
    )
}
