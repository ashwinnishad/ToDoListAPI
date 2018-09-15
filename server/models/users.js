const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true, // 2 accounts with same email not possible
    validate: { // using isEmail to match regex of email user is using
      validator: validator.isEmail,
      message: '${VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        requried: true
      }
  }]
});


UserSchema.methods.toJSON = function() {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function() { //arrow functions do not bind with 'this' keyword. so we're using a normal function
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(), access}, '12344').toString();

  user.tokens = user.tokens.concat([{
    access,
    token
  }]);

  return user.save().then(() => {
    return token; // the token var is passed to server.js where it serves as the value for success argument for the next .then() call
  });
};

var User = mongoose.model('User', UserSchema  );

module.exports = {
  User: User
}
