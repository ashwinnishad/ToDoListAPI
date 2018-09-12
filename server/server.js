const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const{ObjectID} =require('mongodb');


var {mongoose} = require('./db/mongoose.js');
var{ToDo} = require('./models/todo.js');
var{User} = require('./models/users.js');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res)=> {
  var todo = new ToDo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  })
});

app.get('/todos', (req,res) => {
  ToDo.find().then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', (req, res) => { // URL Parameters: put a colon (:) before a specific attribute in a document. in our example, we use ID.
  var id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  ToDo.findById(id).then((todo) => {
    if(!todo) {
      res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });

});

app.delete('/todos/:id', (req,res) => {
  //get the id
  var id = req.params.id;

  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  ToDo.findByIdAndRemove(id).then((todo) => {
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

app.patch('/todos/:id', (req,res) => {
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

  ToDo.findByIdAndUpdate(id, {
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
})


app.listen(port, () => {
  console.log(`port ${port}.`);
});


module.exports = {
  app: app
}
