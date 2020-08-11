/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');
mongoose.set('useUnifiedTopology', true);
const dburl = process.env.MONGODB_URI;
var Schema = mongoose.Schema;

const issueSchema = new Schema({
  issue_title: String,
  issue_text: String,
  created_on: Date,
  updated_on: Date,
  created_by: String,
  assigned_to: String,
  open: Boolean,
  status_text: String
});

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res) {
      mongoose.connect(dburl, {useNewUrlParser: true})
        .catch(err => err);

      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', () => {
        console.log("connected to db!");
      });

      const query = req.query;
      const project = req.params.project;

      const issue = mongoose.model('issues_tracker', issueSchema, project);
      
      const results = await issue
        .find(query)
        .then(data => data)
        .catch(err => {
          console.log(err);
          res.sendStatus(500);
          return;
        })
        .finally(() => db.close());
      res.json(results);
      return;
    })
    
    .post(async function (req, res){
      mongoose.connect(dburl, {useNewUrlParser: true})
      .catch(err => err);
      
      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', () => {
        console.log("connected to db!");
      });
      if (req.body.issue_title == '' || req.body.issue_text == '' || req.body.created_by == '') {
        res.send('Missing required fields');
        return;
      }
      var project = req.params.project;
      const issue = mongoose.model('issues_tracker', issueSchema, project);
      // req.body holds all form data passed to path
      
      const new_issue = new issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to ? req.body.assigned_to : '',
        open: true,
        status_text: req.body.status_text ? req.body.status_text : ''
      });

      new_issue.save()
        .then((item) => console.log(item + ' added to db!'))
        .catch(err =>  { 
          console.log(err);
          res.sendStatus(500);
          return;
        })
        .finally(() => db.close());

      res.json(new_issue);
      return;
    })
    
    .put(async function (req, res){
      mongoose.connect(dburl, {useNewUrlParser: true})
      .catch(err => err);

      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', () => {
        console.log("connected to db!");
      });
      // needs id to find specific issue to update
      //  Returned will be 'successfully updated' or 'could not update '+_id. This should always update updated_on. If no fields are sent return 'no updated field sent
      var project = req.params.project;
      const issue_model = mongoose.model('issues_tracker', issueSchema, project);
      // const issue = new issue_model();
      const id = req.body._id ? req.body._id : '';
      const body_arr = Object.values(req.body);
      const valid_items = body_arr.filter((item) => item != '').length > 1 ? true : false;
      if (valid_items == false) {
        res.send('no updated field sent');
        return;
      }
      let update_info = {updated_on: new Date()};
      for (const item in req.body) {
        if (item != '_id') {
          update_info = {...update_info, [item]: req.body[item]};
        }
      }

      // console.log('update info is: ' + JSON.stringify(update_info));

      const updatedItem = await issue_model
        .findByIdAndUpdate({_id: id}, update_info)
        .then(item => {
          if (item != undefined) {
            console.log(`added ${item} to database`);
            res.send('successfully updated!');
          }
        })
        .catch(err => {
          console.log(err);
          res.send('could not update ' + id);
          return;
        })
        .finally(() => db.close());

      res.send(updatedItem);
      return;
    })
    
    .delete(async function (req, res){
      mongoose.connect(dburl, {useNewUrlParser: true})
      .catch(err => err);

      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', () => {
        console.log("connected to db!");
      });
      var project = req.params.project;
      const issue_model = mongoose.model('issues_tracker', issueSchema, project);
      //  If no _id is sent return '_id error', success: 'deleted '+_id, failed: 'could not delete '+_id.
      const id = req.body._id ? req.body._id : ''
      if (id == '') {
        res.send('_id error');
        return;
      } else {
        const deletedItem = await issue_model
          .findByIdAndDelete(id)
          .then(item => {
            if (item != null) {
              // console.log('deleted ' + item);
              return 'success: deleted ' + id
            }
          })
          .catch(err => {
            console.log(err);
            return 'could not delete ' + id;
          })
          .finally(() => db.close());

        res.send(deletedItem);
        return;
      }
    });
    mongoose.connection.on('close', () => console.log('db conn closed'));
};
