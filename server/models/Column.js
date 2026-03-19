const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  cards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }],
  order: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#5865f2'
  }
}, { timestamps: true });

module.exports = mongoose.model('Column', columnSchema);