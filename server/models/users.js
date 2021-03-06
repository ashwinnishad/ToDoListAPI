const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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
  var token = jwt.sign({_id: user._id.toHexString(), access},  process.env.JWT_SECRET).toString();

  user.tokens = user.tokens.concat([{
    access,
    token
  }]);

  return user.save().then(() => {
    return token; // the token var is passed to server.js where it serves as the value for success argument for the next .then() call
  });
};

UserSchema.methods.removeToken = function(token) {
  var user = this;
  return user.update({
    $pull: {
    tokens: {
      token: token
    }
  }
}); // pulls an intem from an array that matches a criteria
};

UserSchema.statics.findByToken = function(token) {
  var User = this; //model methods gets called with the model
  var decoded;

  try {
    decoded = jwt.verify(token,  process.env.JWT_SECRET);
  }
  catch (e) {
      // return new Promise((resolve, reject) => {
      //   reject();
      // });
    return Promise.reject('test')
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};    //everything you add on to statics, turns into a model method instead of an instance method

UserSchema.statics.findByCredentials = function(email, password) {
  var User = this;
  return User.findOne({email}).then((user) => {
    if(!user) {
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if(res)
          resolve(user);
        else
        reject();
      });

    });
  });
};


UserSchema.pre('save', function(next) { //middleware method to make sure password matches before saving a note
  var user = this;
  if(user.isModified('password'))
  {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });

  } // if modified, returns true. vice versa
  else {
    next();
  }


});

var User = mongoose.model('User', UserSchema  );

module.exports = {
  User: User
}
