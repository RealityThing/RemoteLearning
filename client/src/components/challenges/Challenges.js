
// React and redux modules
import React, { Component } from 'react';

import '../../styles/main.css';
import Challenge from './Challenge';
import challengesStore from '../../challenges.json';

// Custom react component/class
class Challenges extends Component {

    render() {
        return (
            <div className="collection challenges">
                { challengesStore.map(challenge => {
                    return <Challenge key={challenge.id} challenge={challenge} {...this.props}/>
                })}

                <Challenge challenge={{ name: 'Sketching', comingSoon: true}} />
            </div>
        )
    }
}


export default Challenges
