import axios from 'axios';

// Import types
import { SET_STREAM } from "./types";


export const setStream = (stream, user) => {
    return {
        type: SET_STREAM,
        payload: { stream, user }
    }
};