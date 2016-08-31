import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import moment from 'moment';

import { Courses } from '../api/courses.js';

import './course.html';

// Add all functions on the "class" here
Template.course.helpers({
  startEnd()
  {
    return moment(this.start._d).format("MMM D H:mm") + "-" + moment(this.end._d).format("H:mm");
  }
  /*
  isOwner()
  {
    return this.owner == Meteor.userId();
  }
  */
});

Template.course.events({
  'click .toggle-checked'()
  {
    // Update the checked property
    Meteor.call('courses.update', this._id, !this.checked);
  },
  'click .delete'()
  {
    Meteor.call('courses.remove', this._id);
  },
});