import React from 'react'
import isEmpty from '../../utils/is-empty'


class Results extends React.Component {

     // returns correct, close, not quite
     answerStatus = (userId, challenge) => {
        if (userId in challenge.participants) {
            if (challenge.participants[userId] == challenge.answer) {
                return 'correct'
            } else if (challenge.answer.includes(challenge.participants[userId])) {
                return 'close'
            } else {
                return 'not quite'
            }

        } else {
            return 'hmmm. something went wrong'
        }
    }

    render() {
        let { myId, users, challenge } = this.props;

        return (
            <div>
                <ul className="collection with-header">
                    <li className="collection-header">
                        <h4 className="heading">{challenge.question}</h4>
                        <h5 className="me">Answer: {challenge.answer}</h5>
                        <span>{`${challenge.participants.length} participant${challenge.participants.length > 1 ? 's' : ''}`}</span>
                    </li>
                   
                    { challenge.participants.map(participant => {
                        return (
                            <li className={`collection-item ${participant.id == myId && 'my-answer'}`}>
                                <p>{participant.name} answered: {participant.answer === null ? 'loading...' : isEmpty(participant.answer) ? 'none' : participant.answer}</p>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }
}

export default Results