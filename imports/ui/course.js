import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import moment from 'moment';

import { Courses } from '../api/courses.js';

import './course.html';

// Add all functions on the "class" here
Template.course.helpers({
  startEnd() {
    let data = Template.currentData().courseData;
    return moment(data.start).format("H:mm") + "-" + moment(data.end).format("H:mm");
  },
  day() {
    return moment(Template.currentData().courseData.start).format("ddd MMM D");
  },
  name() { return Template.currentData().courseData.name; },
  teacher() { return Template.currentData().courseData.teacher; },
  studio() { return Template.currentData().courseData.studio; },
  style() { return Template.currentData().courseData.style; },
  postcode() { return Template.currentData().courseData.postcode; },
  courseData() { return Template.currentData().courseData; },
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
    //Meteor.call('courses.update', this._id, !this.checked);
  },
  'click .delete'()
  {
    Meteor.call('courses.remove', this._id);
  },
  'click .course-row'(event, instance) {
    let data = Template.currentData().courseData;
    Template.currentData().setCourseFunc(data);
  }
});
