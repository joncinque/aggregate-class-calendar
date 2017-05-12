import { Template } from 'meteor/templating';

import './cronjobs.html';

Template.cronjobs.onCreated(()=>{
  let dict = new ReactiveDict();
  this.state = dict;
  Meteor.call('cronmanager.name', (err, jobname) => {
    this.state.set('cronname', jobname);
    return jobname;
  }).then(jobname=>{
    Meteor.call('cronmanager.nextScheduledAt', jobname, (err, data) => {
      this.state.set('crontime', data);
    });
  });
});

Template.cronjobs.helpers({
  cronname() {
    return Template.instance().state.get('cronname');
  },
  crontime() {
    return Template.instance().state.get('crontime');
  },
});

Template.cronjobs.events({
  'click cronpause'() {
    Meteor.call('cronmanager.pause', (err, data) =>{
      if (err) {
        console.log(err);
      }
    });
  },
  'click cronstart'() {
    Meteor.call('cronmanager.start', (err, data) =>{
      if (err) {
        console.log(err);
      }
    });
  },
});
