const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const RoomSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  dateCreated: {
    type: Date,
    default: Date.now
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
    unique: true,
  },
});

module.exports = Room = mongoose.model('rooms', RoomSchema);
