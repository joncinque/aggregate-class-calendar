import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Tasks } from '../api/tasks.js';

import './task.js';
import './body.html';

Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  // get whatever is in the 'tasks' channel from the server
  Meteor.subscribe('tasks');
});

Template.body.helpers({
  tasks() {
    const instance = Template.instance();
    if (instance.state.get('hideCompleted'))
    {
      // if hide completed is checked on the reactive dict, then filter
      return Tasks.find({ checked: { $ne: true } }, { sort: { createdAt: -1 } });
    }

    // otherwise, show them all
    return Tasks.find({}, { sort: { createdAt: -1 } });
  },
  incompleteCount() {
    return Tasks.find({ checked: { $ne: true } }).count();
  }
});

Template.body.events({
  'submit .new-task'(event) {
    // See what the event has
    console.log(event);
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from the form element
    const target = event.target;
    const text = target.text.value;

    // Insert task into the collection
    /* old version, calling directly into db
    Tasks.insert({
      text,
      createdAt: new Date(), // now
      owner: Meteor.userId(), // builtin to check the unique id
      username: Meteor.user().username, // field from the full user document
    });
    */
    // new version, calling server
    Meteor.call('tasks.insert', text);

    // Clear
    target.text.value = '';
  },
  'change .hide-completed input'(event, instance) {
    instance.state.set('hideCompleted', event.target.checked);
  },
});
