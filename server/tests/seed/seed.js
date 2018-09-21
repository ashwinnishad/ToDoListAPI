const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {ToDo} = require('./../../models/todo');
const {User} = require('./../../models/users.js');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();
const users = [{
  _id: userOneID,
  email: 'ash@gmail.com',
  password: 'paswword1',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneID, access: 'auth'}, '12344').toString()
  }]
}, {
  _id: userTwoID,
  email: 'michael@hotmail.com',
  password: 'dundermifflin',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoID, access: 'auth'}, '12344').toString()
  }]
}];


const todos = [{
    _id: new ObjectID(),
    text: 'first todo test',
    _creator: userOneID
}, {
  _id: new ObjectID(),
  text: 'second todo test',
  completed: true,
  completedAt: 12342,
  _creator: userTwoID
}];

const populateTodos = (done) => {
  ToDo.remove({}).then(() => {
    return ToDo.insertMany(todos);
  }).then(() => done()) ;
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    Promise.all([userOne, userTwo])
  }).then(() => done());
};

module.exports = {todos, populateTodos, populateUsers, users};
