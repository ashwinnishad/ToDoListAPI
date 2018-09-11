const expect = require('expect');
const request = require('supertest');
const{ObjectID} =require('mongodb');

const {app} = require('./../server');
const {ToDo} = require('./../models/todo.js');

const todos = [{
    _id: new ObjectID(),
    text: 'first todo test'
}, {
  _id: new ObjectID(),
  text: 'second todo test'
}]


// runs some code before every single test case. In this specific example, we expect todos.length ti be 1. thats not the case.
// so we use beforeEach
beforeEach ((done) => {
  ToDo.remove({}).then(() => {
    return ToDo.insertMany(todos);
  }).then(() => done()) ;
});

describe('POST', () => {
  it('should create a new todo', (done) => {
    var text = 'Testing to-do';
    request(app)
    .post('/todos')
    .send({
      text: text
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.text).toBe(text);
    })
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      ToDo.find({text}).then((todos) => {
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch((e) => done(e));
    })
  });

  it('should not create to-do with invalid data', (done) => {
    request(app)
    .post('/todos')
    .send({}) //sending empty object which is invalid data
    .expect(400)
    .end((err,res) => {
      if(err) {
        return done(err);
      }

      ToDo.find().then((todos) => {
        expect(todos.length).toBe(2);
        done();
      }).catch((e) => done(e));
    });

  });
}); // end of describe

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
    .get('/todos')
    .expect((res) => {
      expect(res.body.todos.length).toBe(2);
    })
    .end(done);
  })
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var id = new ObjectID();
    request(app)
    .get(`/todos/${id.toHexString()}`)
    .expect(404)
    .end(done);
  });

  it('should return 404 for non-object IDs', (done) => {
      request(app)
      .get('/todos/1234')
      .expect(404)
      .end(done);
  })
});
