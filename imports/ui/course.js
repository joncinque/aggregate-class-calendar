import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import moment from 'moment-timezone';

import { Courses } from '../api/courses.js';

import './course.html';

// Add all functions on the "class" here
Template.course.helpers({
  startEnd() {
    const data = Template.currentData().courseData;
    return moment.tz(data.start, data.timezone).format("H:mm") + "-" + moment.tz(data.end, data.timezone).format("H:mm");
  },
  day() {
    const data = Template.currentData().courseData;
    return moment.tz(data.start, data.timezone).format("ddd");
  },
  name() { return Template.currentData().courseData.name; },
  teacher() { return Template.currentData().courseData.teacher; },
  studio() { return Template.currentData().courseData.studio; },
  style() { return Template.currentData().courseData.style; },
  postcode() { return Template.currentData().courseData.postcode; },
  courseData() { return Template.currentData().courseData; },
});

Template.course.events({
  'click .toggle-checked'()
  {
    // Update the checked property locally
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
