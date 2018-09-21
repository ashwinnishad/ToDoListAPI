const expect = require('expect');
const request = require('supertest');
const{ObjectID} =require('mongodb');

const {app} = require('./../server');
const {ToDo} = require('./../models/todo.js');
const {User} = require('./../models/users.js');

const {todos, populateTodos, populateUsers, users} = require('./seed/seed.js');

// runs some code before every single test case. In this specific example, we expect todos.length ti be 1. thats not the case.
// so we use beforeEach
beforeEach(populateUsers);
beforeEach (populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Testing to-do';
    request(app)
    .post('/todos')
    .set('x-auth', users[0].tokens[0].token)
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
    .set('x-auth', users[0].tokens[0].token)
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
    .set('x-auth', users[0].tokens[0].token)
    .expect((res) => {
      expect(res.body.todos.length).toBe(1);
    })
    .end(done);
  })
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });

  it('should not return todo doc created by another user', (done) => {
    request(app)
    .get(`/todos/${todos[1]._id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });


  it('should return 404 if todo not found', (done) => {
    var id = new ObjectID();
    request(app)
    .get(`/todos/${id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 for non-object IDs', (done) => {
      request(app)
      .get('/todos/1234')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  })
});

describe('DELETE /todos/:id', () => {
  it('should delete todo provided id', (done) => {
    var hexId = todos[1]._id.toHexString();
    request(app)
    .delete( `/todos/${hexId}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(hexId);
    })
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      ToDo.findById(hexId).then((todo) => {
        expect(todo).toBeNull();
        done();
      }).catch((e) => done(e));
    })
  });

  it('should delete todo provided id', (done) => {
    var hexId = todos[0]._id.toHexString();
    request(app)
    .delete( `/todos/${hexId}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      ToDo.findById(hexId).then((todo) => {
        expect(todo).toBeTruthy();
        done();
      }).catch((e) => done(e));
    })
  });

  it('should return 404 if todo not found', (done) => {
    var id = new ObjectID();
    request(app)
    .delete(`/todos/${id.toHexString()}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 if objectID is invalid', (done) => {
    request(app)
    .delete('/todos/1234')
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    // get id, update tex, set completed=true, make assertion (expect) that text changed, completed is true, completedAt is a number
    var id = todos[0]._id.toHexString();
    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
      text: "second todo test updated",
      completed: true
    })
    .expect(200)
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      ToDo.findById(id).then((todo) => {
          expect(todo.text).toBe("second todo test updated");
          expect(todo.completed).toBe(true);
          expect(todo.completedAt).toBeA(number);
          done();
      }).catch((e) => done());

    });
  });

  it('shouldnt update the todo created by other users', (done) => {
    // get id, update tex, set completed=true, make assertion (expect) that text changed, completed is true, completedAt is a number
    var id = todos[0]._id.toHexString();
    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      text: "second todo test updated",
      completed: true
    })
    .expect(400)
    .end(done);
    });

  it('should clear completedAt when todo is not completed', (done) => {
    //update text, set completed false,expecrt 200, expect(text changed and completed is false and completedAt is null use toBeNull )
    var id  = todos[1]._id.toHexString();
    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      text: "updating with a false value for completed",
      completed: false
    })
    .expect(200)
    .end((err, res) => {
      if(err) {
        return done(err);
      }
      ToDo.findById(id).then((todo) => {
          expect(todo.text).toBe("updating with a false value for completed");
          expect(todo.completed).toBe(false);
          expect(todo.completedAt).toBeNull();
          done();
    }).catch((e) => done());
  });
});
});

describe('GET /users/me', () => { //2 test cases, 1 for valid authentication token, one without token to make sure private route is private
  it('should return user if authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
    .expect(401)
    .expect((res) => {
      expect(res.body).toEqual({});
    })
    .end(done);
  });
});


describe('POST /users', () => {
  it('should create a user', (done) => { // for valid data
    var email = 'abncsd@example.com';
    var password = '1234sd';

    request(app)
    .post('/users')
    .send({email, password})
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toBeTruthy();
      expect(res.body._id).toBeTruthy();
      expect(res.body.email).toBe(email);
    })
    .end((err) => {
      if(err) {
        return done(err);
      }
      User.findOne({email}).then((user) => {
        expect(user).toBeTruthy();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should return validation errors if request is invalid', (done) => { // for eg, invalid email
    var email = 'ash12!!@g@#.co2@';
    var password = '30928euryf';

    request(app)
    .post('/users')
    .send({email, password})
    .expect(400)
    .expect((res) => {
      expect(res.headers['x-auth']).toBeUndefined();
    })
    .end(done);
  });

  it('should not create a user if email is in use', (done) => {

    request(app)
    .post('/users')
    .send({email: users[0].email,
      password: '123edhdhs'})
    .expect(400)
    // .expect((res) => {
    //   expect(res.body.email).toBe(email);
    // })
    .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
    .post('/users/login')
    .send({email: users[1].email,
          password: users[1].password})
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toBeTruthy();
    })
    .end((err,res) => {
      if(err)
        return done(err);

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens[1]).toMatchObject({
          access: 'auth',
          token: res.headers['x-auth']
        })
        done();
      }).catch((e) => done(e));
    })
  });

  it('should reject invalid login', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: 'asasda'
    })
    .expect(400)
    .expect((res) => {
      expect(res.headers['x-auth']).toBeUndefined();
    })
    .end((err,res) => {
      if(err)
        return done(err);

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((e) => done(e));
    });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
    .delete('/users/me/token')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .end((err, res) => {
      if(err)
        return done(err);

      User.findById(users[0]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((e) => done(e));
    })

  });
});
