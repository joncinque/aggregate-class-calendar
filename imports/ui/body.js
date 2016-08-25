import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import moment from 'moment';

import { Courses } from '../api/courses.js';

import './course.js';
import './body.html';

// not needed, but helps sort out dependencies
// import '../api/coursescraper.js';

const EMPTY = '';

function makeRegex(searchString)
{
  return new RegExp('^'+searchString, 'i');
}

function getSearchArgs(instance)
{
    let argList = [];

    // apply date/time filter
    argList.push({ start: { $gte: moment(instance.state.get('startFilter')) } });
    argList.push({ start: { $lte: moment(instance.state.get('endFilter')) } });

    // apply style filter
    let styleFilter = instance.state.get('styleFilter');
    if (styleFilter !== EMPTY)
    {
      console.log('Style filter: ' + styleFilter);
      argList.push({ name: makeRegex(styleFilter) });
    }

    // apply teacher filter
    let teacherFilter = instance.state.get('teacherFilter');
    if (teacherFilter !== EMPTY)
    {
      console.log('Teacher filter: ' + teacherFilter);
      argList.push({ teacher: makeRegex(teacherFilter) });
    }

    // apply studio filter
    let studioFilter = instance.state.get('studioFilter');
    if (studioFilter !== EMPTY)
    {
      console.log('Studio filter: ' + studioFilter);
      argList.push({ studio: makeRegex(studioFilter) });
    }

    //argList.push({ sort: { start: -1 } });
    // make the search with an 'and' clause
    return { $and: argList };
}

function getNowDatetime()
{
    return moment().toDate();
}

function getLaterDatetime()
{
    return moment().add(4, 'hour').toDate();
}

function getNewDateFromInput(initialDate, inputDate)
{
    let initialMoment = moment(initialDate);
    initialMoment.set('year', inputDate.getFullYear());
    initialMoment.set('month', inputDate.getMonth());
    initialMoment.set('date', inputDate.getDate());
    return initialMoment.toDate();
}

function getNewTimeFromInput(initialDate, inputTime)
{
    let initialMoment = moment(initialDate);
    let inputMoment = moment(inputTime, 'HH:mm');
    initialMoment.set('hour', inputMoment.hour());
    initialMoment.set('minute', inputMoment.minute());
    return initialMoment.toDate();
}

function addToDb(courseObj)
{
  Meteor.call('courses.insert', courseObj);
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

  dict.set('startFilter', getNowDatetime());
  dict.set('endFilter', getLaterDatetime());
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
  startdate() {
    return moment(Template.instance().state.get('startFilter')).format('YYYY-MM-DD');
  },
  starttime() {
    return moment(Template.instance().state.get('startFilter')).format('HH:mm');
  },
  enddate() {
    return moment(Template.instance().state.get('endFilter')).format('YYYY-MM-DD');
  },
  endtime() {
    return moment(Template.instance().state.get('endFilter')).format('HH:mm');
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
  'click .scrape-all'() {
    Meteor.call('coursescraper.getAllCourses', function(err, data) {
      if (err)
      {
        console.log(err);
      }
      else
      {
        data.forEach(courses => {
          courses.forEach(addToDb);
        });
      }
    });
  },

  'submit .scrape-mbo-page'(event, template) {
    event.preventDefault();
    const studioid = Number(event.target.studioid.value);
    Meteor.call('coursescraper.getCourses', studioid, function(err, data) {
      if (err)
      {
        console.log(err);
      }
      else
      {
        data.forEach(addToDb);
      }
    });
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
  'blur #startdate-filter'(event, instance) {
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter', 
        getNewDateFromInput(startDate, event.target.valueAsDate));
  },
  'blur #starttime-filter'(event, instance) {
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter',
        getNewTimeFromInput(startDate, event.target.value));
  },
  'blur #enddate-filter'(event, instance) {
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewDateFromInput(endDate, event.target.valueAsDate));
  },
  'blur #endtime-filter'(event, instance) {
    instance.state.set('endFilter', event.target.value);
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewTimeFromInput(endDate, event.target.value));
  },
});
