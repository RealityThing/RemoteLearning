const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({

  username: {
    type: String,
    trim: true
  },

  email: {
    type: String
  },

  password: {
    type: String
  },

  // educator or student
  status: {
    type: String
  },

  dateRegistered: {
    type: Date,
    default: Date.now
  },

  logins: {
    type: Number,
    default: 1
  },

  rooms: [
    {
        type: Schema.Types.ObjectId,
        ref: 'rooms'
    }
  ]
});

module.exports = User = mongoose.model('users', UserSchema);
