
// Import types
import { SET_STREAM } from '../actions/types';

// Exporting reducer...
export default function(state = {}, action) {

    switch (action.type) {

        case SET_STREAM:
            let { stream, user} = action.payload;
            state[user] = stream; 
            console.log('state', state);

            return state;

        default:
            return state;
    }
}
