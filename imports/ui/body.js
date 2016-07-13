import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Courses } from '../api/courses.js';

import './course.js';
import './body.html';

const EMPTY = "--";

Template.body.onCreated(function bodyOnCreated() {
  let dict = new ReactiveDict();
  this.state = dict;
  // get whatever is in the 'courses' channel from the server
  Meteor.subscribe('courses');
  Meteor.call('courses.names', function (err,data) {
    dict.set('names', data);
  });
  Meteor.call('courses.teachers', function (err,data) {
    dict.set('teachers', data);
  });
  Meteor.call('courses.studios', function (err,data) {
    dict.set('studios', data);
  });

  // init filters
  dict.set('styleFilter', EMPTY);
  dict.set('teacherFilter', EMPTY);
  dict.set('studioFilter', EMPTY);
});

Template.body.helpers({
  courses() {
    let argList = [];
    const instance = Template.instance();
    if (instance.state.get('hideCompleted'))
    {
      // if hide completed is checked on the reactive dict, then filter
      return Courses.find({ checked: { $ne: true } }, { sort: { start: -1 } });
    }

    // apply style filter
    let styleFilter = instance.state.get('styleFilter');
    if (styleFilter !== EMPTY)
    {
      console.log("non empty style filter: " + styleFilter);
      argList.push({ name: styleFilter });
    }

    // apply teacher filter
    let teacherFilter = instance.state.get('teacherFilter');
    if (teacherFilter !== EMPTY)
    {
      console.log("non empty teacher filter: " + teacherFilter);
      argList.push({ teacher: teacherFilter });
    }

    // apply studio filter
    let studioFilter = instance.state.get('studioFilter');
    if (studioFilter !== EMPTY)
    {
      console.log("non empty studio filter: " + studioFilter);
      argList.push({ studio: studioFilter });
    }

    // make the search with and "and" clause if necessary
    let searchArgs = {};
    if (argList.length > 1)
    {
      searchArgs = { $and: argList };
    }
    else if (argList.length === 1)
    {
      searchArgs = argList[0];
    }
    //argList.push({ sort: { start: -1 } });
    return Courses.find(searchArgs);
  },
  incompleteCount() {
    return Courses.find({ checked: { $ne: true } }).count();
  },
  names() {
    let names = [ EMPTY ];
    let dbNames = Template.instance().state.get('names');
    if (dbNames)
    {
      dbNames.forEach((item)=>names.push(item));
    }
    return names;
  },
  teachers() {
    let teachers = [ EMPTY ];
    let dbNames = Template.instance().state.get('teachers');
    if (dbNames)
    {
      dbNames.forEach((item)=>teachers.push(item));
    }
    return teachers;
  },
  studios() {
    let studios = [ EMPTY ];
    let dbNames = Template.instance().state.get('studios');
    if (dbNames)
    {
      dbNames.forEach((item)=>studios.push(item));
    }
    return studios;
  },
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

  // set filters
  'change #style-filter'(event, instance) {
    instance.state.set('styleFilter', event.target.value);
  },
  'change #teacher-filter'(event, instance) {
    instance.state.set('teacherFilter', event.target.value);
  },
  'change #studio-filter'(event, instance) {
    instance.state.set('studioFilter', event.target.value);
  },
});
