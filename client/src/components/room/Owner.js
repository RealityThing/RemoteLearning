import React from 'react';
import Challenges from '../challenges/Challenges';
import challengesStore from '../../challenges.json'
import TextFieldGroup from '../layout/TextFieldGroup'
import TextArea from '../layout/TextArea'
import SelectList from '../layout/SelectList'
import Results from './Results';
import RadioButtons from '../layout/RadioButtons';
import copy from "copy-to-clipboard";  
class Owner extends React.Component {

    render () {
        const { HOST, myId, users, room, challenge, errors, countDown,clearChallenge, addChoice, showChallenges, challengeStatus, selectChallenge, onEditChallenge, startChallenge, setChallengeStatus } = this.props;
        return (
            <>
                { showChallenges ? challengeStatus == 'wait' && showChallenges ? (
                        <Challenges selectChallenge={selectChallenge}/> 
                    ) : challengeStatus == 'edit' ? (
                        <>
                            <h5>{challenge.name}</h5>
                            <form noValidate onSubmit={e => { e.preventDefault(); }}>
                                <TextArea
                                    type="text"
                                    label="Question"
                                    name="question"
                                    error={errors.question}
                                    value={challenge.question}
                                    onChange={onEditChallenge}
                                />
                                
                                { challenge.type == 'Q&A' ? (
                                    <TextArea
                                        type="text"
                                        label="Answer (this will not be shown to the students)"
                                        name="answer"
                                        error={errors.answer}
                                        value={challenge.answer}
                                        onChange={onEditChallenge}
                                    />
                                ) : (
                                    <>
                                        <div className="row">
                                            <div className="col s8">
                                                <TextArea
                                                    type="text"
                                                    label="Add a choice"
                                                    name="choice"
                                                    error={errors.choice}
                                                    value={challenge.choice}
                                                    onChange={onEditChallenge}
                                                    onKeyPress={e => {
                                                        if (e.which === 13) {
                                                            e.preventDefault();
                                                            addChoice();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="col">
                                                <button onClick={addChoice} className="btn btnt btn-small"> Add choice</button>
                                            </div>
                                        </div>
                                        <RadioButtons 
                                            selectedChoice={challenge.answer}
                                            choices={challenge.choices}
                                            name="answer"
                                            error={errors.answer}
                                            onChange={onEditChallenge}
                                        />
                                    </>
                                )}
                                
                                <div className="row">
                                    <div className="col s6">
                                        <TextArea
                                            type="text"
                                            label="Info (optional)"
                                            name="info"
                                            value={challenge.info}
                                            onChange={onEditChallenge}
                                        />
                                    </div>

                                    <div className="col s6">
                                        <SelectList 
                                            name="timer"
                                            label="Timer"
                                            value={challenge.timer}
                                            defaultValue="Select a timer"
                                            onChange={onEditChallenge}
                                        />
                                    </div>
                                </div>
                                <div className="col">
                                    <input onClick={startChallenge} type="submit" value="Begin Challenge" className="btn green"/>
                                </div>

                                <div className="col">
                                    <button className="btn red lighten-1" onClick={() => selectChallenge(null)}>Cancel</button>
                                </div>
                                
                                <div className="col">
                                    <a onClick={clearChallenge} href="javascript:void(0);" className="btn grey">Clear All</a>
                                </div>

                            </form>
                        </>
                    ) : challengeStatus == 'start' ? (
                        // show timer, number of users answered
                         <>
                            { countDown > 0 ? (
                                <>
                                    <h4 className="heading">Challenge starting in {countDown}</h4>
                                </>
                            ) : (
                                <>
                                    <h4 className="heading">{challenge.question}</h4>
                                    <span>{`${challenge.participants.length} participant${challenge.participants.length > 1 ? 's' : ''} - ${challenge.timer} second${challenge.timer > 1 ? 's' : ''} left`}</span>
                                </>
                            )}

                        </>
                    ) : challengeStatus == 'complete' ? (
                        // once timer has reached zero, display the answer the results of all students to everyone
                        <>
                            <Results myId={myId} users={users} challenge={challenge} />
                            <button className="btn" onClick={() => setChallengeStatus('wait')}>New Challenge</button>
                        </>
                    ) : null
                : null}

                { !showChallenges || challengeStatus == 'wait' || challengeStatus == 'edit' ? (
                    <div className="row">
                        <div className="col">
                            <br/>
                            <span>Send this link to your students so they can join the room. Click to copy:</span>
                            <br/>
                            <a href="javascript:void(0);" onClick={() => copy(`${HOST}/room/${room._id}`)}>{`${HOST}/room/${room._id}`}</a>
                        </div>
                    </div>  
                ) : null }
            </>
        )
    }
}

export default Owner