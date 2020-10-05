// added a comment
// please work

require('./config/config.js');

const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const{ObjectID} =require('mongodb');


var {mongoose} = require('./db/mongoose.js');
var{ToDo} = require('./models/todo.js');
var{User} = require('./models/users.js');
var {authenticate} = require('./middleware/authenticate.js');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res)=> { //
  var todo = new ToDo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  })
});

app.get('/todos', authenticate, (req,res) => { // updated, to-dos by user
  ToDo.find({_creator: req.user._id}).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', authenticate, (req, res) => { // URL Parameters: put a colon (:) before a specific attribute in a document. in our example, we use ID.
  var id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  ToDo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo) {
      res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });

});

app.delete('/todos/:id', authenticate, (req,res) => {
  //get the id
  var id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  ToDo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if(!todo) {
      res.status(404).send();
    }
    res.status(200);
    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });

  //validate id, if not return 404

  //remove todo by id. success->if no doc received send 404, if found send 200 & error-> 404
});

app.patch('/todos/:id', authenticate, (req,res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if(_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  }
  else {
    body.completed = false;
    body.completedAt = null;
  }

  ToDo.findOneAndUpdate({_id: id,
  _creator: req.user._id}, {
    $set: body
  }, {
    new: true
  }).then((todo) => {
    if(!todo) {
      return res.status(400).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});

app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => { // the token returned from users.js
    res.header('x-auth', token).send(user); // x-auth is a custom header we're creating. not necessary that HTML will recognize it
  }).catch((e) => {
    res.status(400).send(e);
  });

});


app.get('/users/me', authenticate, (req,res) => {
  res.send(req.user);
});

//POST /users/login {email, password} this is for login for existing users.

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  //pass the email and password and get the user back
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });

  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

app.listen(port, () => {
  console.log(`port ${port}.`);
});


module.exports = {
  app: app
}
