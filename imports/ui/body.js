import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Courses } from '../api/courses.js';

import './course.js';
import './body.html';

const EMPTY = '';

function makeRegex(searchString)
{
  return new RegExp('^'+searchString, 'i');
}

function getSearchArgs(instance)
{
    let argList = [];

    // apply style filter
    let styleFilter = instance.state.get('styleFilter');
    if (styleFilter !== EMPTY)
    {
      console.log("non empty style filter: " + styleFilter);
      argList.push({ name: makeRegex(styleFilter) });
    }

    // apply teacher filter
    let teacherFilter = instance.state.get('teacherFilter');
    if (teacherFilter !== EMPTY)
    {
      console.log("non empty teacher filter: " + teacherFilter);
      argList.push({ teacher: makeRegex(teacherFilter) });
    }

    // apply studio filter
    let studioFilter = instance.state.get('studioFilter');
    if (studioFilter !== EMPTY)
    {
      console.log("non empty studio filter: " + studioFilter);
      argList.push({ studio: makeRegex(studioFilter) });
    }

    //argList.push({ sort: { start: -1 } });
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
    return searchArgs;
}

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
    const instance = Template.instance();
    if (instance.state.get('hideCompleted'))
    {
      // if hide completed is checked on the reactive dict, then filter
      return Courses.find({ checked: { $ne: true } }, { sort: { start: -1 } });
    }

    //argList.push({ sort: { start: -1 } });
    return Courses.find(getSearchArgs(instance));
  },
  availableCount() {
    const instance = Template.instance();
    return Courses.find(getSearchArgs(instance)).count();
  },
  // drop-downs for filter
  names() {
    return Template.instance().state.get('names');
  },
  teachers() {
    return Template.instance().state.get('teachers');;
  },
  studios() {
    return Template.instance().state.get('studios');;
  },
  // defaults for date entries
  nowdate() {
    return Date.now();
  },
  nowtime() {
    return Date.now();
  },
  latertime() {
    return Date.now();
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
  'blur #style-filter'(event, instance) {
    instance.state.set('styleFilter', event.target.value);
  },
  'blur #teacher-filter'(event, instance) {
    instance.state.set('teacherFilter', event.target.value);
  },
  'blur #studio-filter'(event, instance) {
    instance.state.set('studioFilter', event.target.value);
  },
});
