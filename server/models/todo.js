const mongoose = require('mongoose');

var ToDo = mongoose.model('ToDo', { // model is a blueprint/schema. instance of a model is a document.
  text: {
    type: String,
    required: true,
    minlength: 1,
    trim: true // removes leading or trailing white spaces
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = {
  ToDo: ToDo
}
