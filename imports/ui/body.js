import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Courses } from '../api/courses.js';

import './course.js';
import './body.html';

Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  // get whatever is in the 'courses' channel from the server
  Meteor.subscribe('courses');
});

Template.body.helpers({
  courses() {
    const instance = Template.instance();
    if (instance.state.get('hideCompleted'))
    {
      // if hide completed is checked on the reactive dict, then filter
      return Courses.find({ checked: { $ne: true } }, { sort: { start: -1 } });
    }

    // otherwise, show them all
    return Courses.find({}, { sort: { start: -1 } });
  },
  incompleteCount() {
    return Courses.find({ checked: { $ne: true } }).count();
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
    // TODO add the right call when adding new courses
    //Meteor.call('courses.insert', text);

    // Clear
    target.text.value = '';
  },
  'change .hide-completed input'(event, instance) {
    instance.state.set('hideCompleted', event.target.checked);
  },
});
