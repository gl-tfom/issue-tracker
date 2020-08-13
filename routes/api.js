/*
*
*
*       Complete the API routing below
*
*
*/
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.set('useUnifiedTopology', true);
const connstr = `mongodb+srv://${process.env.USER}:${process.env.PW}@${encodeURIComponent(process.env.HOST)}/${encodeURIComponent(process.env.DB)}?retryWrites=true&w=majority`;

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

const options = {useNewUrlParser: true, useFindAndModify: false};

var dbConnection;

const connectToDb = () => {
  if (!dbConnection) {
    dbConnection = mongoose.connect(connstr, options)
      .then((db) => db)
      .catch(err => console.log('error while connecting to db'));
  }
  return dbConnection;
};

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res, next) {
      const query = req.query;
      const project = req.params.project;

      connectToDb()
        .then(async (data) => {
          const issue = mongoose.model(project, issueSchema, project);
          const results = await issue
            .find(query)
            .then(data => data)
            .catch(err => {
              console.log(err);
              res.send('failed to retreive data');
              return;
            });
          res.json(results);
          return;
        })
        .catch(next);
    })
    
    .post(async function (req, res, next){
      var project = req.params.project;
      // missing required fields
      if (req.body.issue_title == '' || req.body.issue_text == '' || req.body.created_by == '') {
        res.send('Missing required fields');
        return;
      }
      connectToDb()
        .then(async(data) => {
          const issue = mongoose.model(project, issueSchema, project);

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
            .then((item) => item)
            .catch(err =>  { 
              console.log(err);
              res.send('Failed to save record to db');
              return;
            });

          res.json(new_issue);
          return;
        })
        .catch(next);
    })
    
    .put(async function (req, res, next){
      var project = req.params.project;
      connectToDb()
        .then(async (data) => {
          const issue_model = mongoose.model(project, issueSchema, project);
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
          const updatedItem = await issue_model
            .findByIdAndUpdate({_id: id}, update_info)
            .then(item => {
              if (item != undefined) {
                res.send('successfully updated!');
              }
            })
            .catch(err => {
              console.log(err);
              res.send('could not update ' + id);
              return;
            });

          res.send(updatedItem);
          return;
        })
        .catch(next);
    })
    
    .delete(async function (req, res, next){
      var project = req.params.project;

      connectToDb()
        .then(async (data) => {
          const issue_model = mongoose.model(project, issueSchema, project);
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
                  return 'success: deleted ' + id
                }
              })
              .catch(err => {
                console.log(err);
                return 'could not delete ' + id;
              });

            res.send(deletedItem);
            return;
          }
        })
        .catch(next)
    });
};
