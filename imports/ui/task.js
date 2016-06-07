import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Tasks } from '../api/tasks.js';

import './task.html';

// Add all functions on the "class" here
Template.task.helpers({
  isOwner()
  {
    return this.owner == Meteor.userId();
  }
});

Template.task.events({
  'click .toggle-checked'()
  {
    // Update the checked property
    /* old version, calling directly to db
    Tasks.update(this._id, {
      $set: { checked: ! this.checked },
    });
    */
    // new version, calling into server
    Meteor.call('tasks.setChecked', this._id, !this.checked);
  },
  'click .delete'()
  {
    // old version, calling directly to db
    //Tasks.remove(this._id);
    // new version, calling to server
    Meteor.call('tasks.remove', this._id);
  },
  'click .toggle-private'()
  {
    Meteor.call('tasks.setPrivate', this._id, !this.private);
  }
});
