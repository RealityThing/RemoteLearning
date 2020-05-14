import React from 'react';
import Challenges from '../challenges/Challenges';
import challengesStore from '../../challenges.json'
import TextFieldGroup from '../layout/TextFieldGroup'
import TextArea from '../layout/TextArea'
import SelectList from '../layout/SelectList'
import Results from './Results';
import RadioButtons from '../layout/RadioButtons';

class Participant extends React.Component {

    render () {
        const { myId, users, viewBoard, countDown, errors, sendAnswer, answerSent, challenge, challengeStatus, onEditChallenge } = this.props;
        return (
            <>
                {
                    challengeStatus == 'wait' ? (
                        <>
                            <p>You will be notified when the owner creates a challenge.</p>
                        </>
                    ) : challengeStatus == 'start' ? (
                        <>
                            { countDown > 0 ? (
                                <>
                                    <h4 className="heading">Challenge starting in {countDown}</h4>
                                </>
                            ) : (
                                <>
                                    <h4 className="heading">{challenge.question}</h4>
                                    <span>{`${challenge.participants.length} participant${challenge.participants.length > 1 ? 's' : ''} - ${challenge.timer} second${challenge.timer > 1 ? 's' : ''} left`}</span>
                                   
                                    <form noValidate onSubmit={sendAnswer}>
                                        { challenge.type == 'Q&A' ? (
                                            <TextArea
                                                type="text"
                                                label="Type out your answer"
                                                name="studentAnswer"
                                                disabled={answerSent}
                                                error={errors.studentAnswer}
                                                value={challenge.studentAnswer}
                                                noValidate={true}
                                                info={answerSent ? 'Your answer has been recorded.' : false}
                                                infoClass='me'
                                                onChange={e => onEditChallenge(e, 'participant')}
                                                onKeyPress={e => {
                                                    if (e.which === 13) {
                                                        sendAnswer(e);
                                                    }
                                                }}
                                            />  
                                        ) : (
                                            <div className="row center">
                                                <RadioButtons 
                                                    selectedChoice={challenge.studentAnswer}
                                                    choices={challenge.choices}
                                                    name="studentAnswer"
                                                    error={errors.studentAnswer}
                                                    disabled={answerSent}
                                                    info={answerSent ? 'Your answer has been recorded.' : false}
                                                    infoClass='me'
                                                    onChange={e => onEditChallenge(e, 'participant')}
                                                />
                                            </div>
                                        )}
                                        <input type="submit" value="Send answer" disabled={answerSent} className="btn btn-primary"/>
                                    </form>
                                </>
                            )}
                        </>
                    ) : challengeStatus == 'complete' ? (
                        <>
                            <Results myId={myId} users={users} challenge={challenge} />
                            <button className="btn " onClick={viewBoard}> View board </button>
                        </>
                    ) : null
                }
            </>
        )
    }
}

export default Participant