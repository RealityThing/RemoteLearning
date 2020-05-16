const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const FeedbackSchema = new Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },

  dateCreated: {
    type: Date,
    default: Date.now
  },

  email: {
    type: String
  },
});

module.exports = Feedback = mongoose.model('feedbacks', FeedbackSchema);
