const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid')
const cors = require('cors')

//const mongoose = require('mongoose')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
//var db = mongoose.connection;
//db.on('error', console.error.bind(console, 'connection error:'));
//db.once('open', function() {
//  console.log("we're connected!")
  
//});
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = process.env.MLAB_URI;

// Database Name
const dbName = 'testing123';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server



app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/exercise/users', (req, res) => {
  client.connect(function(err) {
    const db = client.db(dbName);
    assert.equal(null, err);
    db.collection('users').find({}, { projection: { _id: 1, username: 1}}).toArray((err, result) => {
  if (err) console.log(err);
    res.json(result);
      
                                });
  
    
  });
  
});

app.post('/api/exercise/new-user', (req, res) => {
  console.log('hello');
  
  let nuser = {username: req.body.username};
  client.connect(function(err) {
    const db = client.db(dbName);
  assert.equal(null, err);
  console.log("Connected successfully to server");
  let id = shortid.generate();
    nuser._id = id;
    //let nuserWithoutLog = nuser;
    nuser.log = [];
  
  db.collection('users').insertOne(nuser, (err, result) => {
    if(err) console.log("here is the error: " + err);
    //console.log("here is the result "+ result)
    let newUser = {};
    newUser._id = result.ops[0]._id;
    newUser.username = result.ops[0].username;
    res.json(newUser);
  })
    
});
 
});
app.post('/api/exercise/add', (req, res) => {
  /*
  [ ]What if user doesn't exist
  [X]What if description isn't filled in
  [X]What if duration isn't a number
  [X]what if date isn't a date
  [ ]log is an array of objects holding strings of dates.
  
  */
//  console.log(req.body);
  let id = req.body.userId;
  let des = req.body.description;
  let dur = req.body.duration;
  let dat = req.body.date;
  if (!parseInt(dur)) {
    res.send("You need to enter a number in the duration field!");
  }
  //console.log("the length of the description is " + des.length + "characters");
  if (des.length < 3){
    res.send("Your descripton is too short, this is a required field with minimum length of 3 characters!");
  } 
  //res.send('else');
  if (!Date.parse(dat)) {
    let now = new Date();
    dat = now.toDateString();
    console.log('req.body.date =' + req.body.dat)
    console.log('no date was present')
  }else{
    let now = new Date(dat);
    dat = now.toDateString();
    console.log('a date was present')
  }
  client.connect(function(err){
    const db = client.db(dbName);
  assert.equal(null, err);
    let targ = {_id: id}
    let exerLog = { description: des, duration: dur, date: dat};
    db.collection('users').findOneAndUpdate(targ, { $push:{log: exerLog}}, (err, result) => {
      if (err) {
        console.log("a glorious error has arrisen!  It's nature is " + err);
      }else{
        if(result.value == null){
          res.send(id + " isn't a valid ID in our Database.  No record updated.")
        }
        console.log(result.value);
        let durnum = parseInt(exerLog.dur);
        let answer = {username:result.value.username, description:des, date: dat, _id: id};
        answer.duration = parseInt(exerLog.duration);
        
       // answer.log.push(exerLog);
        res.json(answer);
      }
    });
    
    
    
  })
  
});
app.get('/api/exercise/log', (req, res) => {
  let id = req.query.userId;
  if (id == undefined) res.send("You need to send a userId paramater to this API to get any data back!");
  client.connect(function(err) {
    const db = client.db(dbName);
    assert.equal(null, err);
    db.collection('users').findOne({_id:req.query.userId}).then((result) => {
                                                                console.log('promise ' + result)
      let count = result.log.length;
      let answer = result;
      //Work left to finish:  handle from, to and limit params !  Almost done!
      let from = req.query.from;
      let to = req.query.to;
      let limit = parseInt(req.query.limit);
      let log = result.log;
      let prolog = [];
      let fromDateOb = new Date(from);
      let fromMil = Date.parse(fromDateOb);
      let fromDateString = fromDateOb.toDateString();
      let toDateOb = new Date(to);
      let toMil = Date.parse(toDateOb);
      let toDateString = toDateOb.toDateString();
      console.log("toMil is " + toMil);
      console.log('fromMil is ' + fromMil);
      console.log('log is ' + log)
      console.log('from is' + from);
     console.log('to is' + to);
     console.log('limit is' + limit);
//new Date(datestring) creates the date object, Date.parse(dateobject) returns miliseconds
     if (from == undefined && to == undefined){
      if (limit){
        answer.limit = limit;
        let prolog3 = answer.log.slice(0, limit);
        answer.log = prolog3;
      }
       answer.count = count;
      res.json(answer);
       
     }else{
       
       if (from) {
         answer.from = fromDateString;
         for (let i = 0; i < log.length; i++){
            let tc = new Date(log[i].date);
       let tc1 = Date.parse(tc);
           console.log('tc1 is ' + tc1);
           if (tc1 >= fromMil ) {
             prolog.push(log[i]);
           }
           console.log("prolog after first loop" + prolog);
         }
         if (to) {
           answer.to = toDateString;
           let prolog1 = [];
         for (let i = 0; i < prolog.length; i++){
            let tc = new Date(prolog[i].date);
       let tc1 = Date.parse(tc);
           if (tc1 <= toMil ) {
             prolog1.push(prolog[i]);
           }
         }
           prolog = prolog1;
       }
       }else{
         if (to) {
           answer.to = toDateString;
         for (let i = 0; i < log.length; i++){
            let tc = new Date(log[i].date);
       let tc1 = Date.parse(tc);
           if (tc1 <= toMil ) {
             prolog.push(log[i])
           }
         }
       }
       }
       let count = prolog.length;
       if (limit) {
         console.log('inside if limit condition')
       console.log(prolog.length);
         answer.limit = limit;
         let limit2 = limit + 1;
         if (limit < count){
           let prolog2 = prolog.slice(0, limit)
            prolog = prolog2
           
           
         }
       }
     } 
      answer.log = prolog;
      res.json(answer);
                                                                }).catch((err) => {
   console.log('Caught this ' + err)   
    }); 
  });
  
  
  
  
});
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
