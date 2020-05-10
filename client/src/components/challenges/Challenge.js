import React from 'react';

class Challenge extends React.Component {

    render () {
        let { challenge } = this.props;

        return (
            <a href="javascript:void(0);" className="collection-item challenge" onClick={() => this.props.selectChallenge && this.props.selectChallenge(challenge)}>
                <div className="header">
                    <h5>{challenge.name}</h5>
                    { challenge.comingSoon && <span>Coming Soon</span>}
                    {/* <span>{challenge.description}</span> */}
                </div>
            </a>
        )
    }
}

export default Challenge