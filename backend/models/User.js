// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// // Create Schema
// const UserSchema = new Schema({
    
//   first_name: {
//     type: String,
//     required: true,
//     trim: true
//   },

//   last_name: {
//     type: String,
//     required: true,
//     trim: true
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },

//   password: {
//     type: String,
//     required: true
//   },

//   // educator or student
//   status: {
//     type: String,
//     required: true
//   },

//   dateRegistered: {
//     type: Date,
//     default: Date.now
//   },

//   logins: {
//     type: Number,
//     default: 1
//   },

//   classes: [
//     {
//         type: Schema.Types.ObjectId,
//         ref: 'rooms'
//     }
//   ]
// });

// module.exports = User = mongoose.model('users', UserSchema);
