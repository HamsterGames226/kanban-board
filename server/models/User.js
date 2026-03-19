const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: '#5865f2'
  },
  customAvatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  displayName: {
    type: String,
    default: '',
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'idle', 'dnd'],
    default: 'offline'
  },
  statusText: {
    type: String,
    default: '',
    maxlength: 100
  },
  language: {
    type: String,
    enum: ['ru', 'en'],
    default: 'ru'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);