const express = require('express');
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

app.listen(port, () => {
  console.log(`port ${port}.`);
});


module.exports = {
  app: app
}
