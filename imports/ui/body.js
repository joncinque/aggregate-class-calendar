import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import moment from 'moment';

import { getNewDateFromInput, getNewTimeFromInput, } from './lib/dateutil.js';

import { EMPTY,
  getCourseResults,
  initCourseDict,
  initFilters,
  maxCoursesReached } from './lib/searchutil.js';

import './coursetable.js';

import './body.html';

// not needed, but helps sort out dependencies
// import '../api/coursescraper.js';
// import '../api/studios.js';

function setDateFilters(instance, startMoment, endMoment)
{
  let startdateFilter = document.getElementById("startdate_filter");
  let enddateFilter = document.getElementById("enddate_filter");
  let starttimeFilter = document.getElementById("starttime_filter");
  let endtimeFilter = document.getElementById("endtime_filter");

  startdateFilter.value = startMoment.format('YYYY-MM-DD');
  enddateFilter.value = endMoment.format('YYYY-MM-DD');

  starttimeFilter = startMoment.format('HH:mm');
  endtimeFilter = endMoment.format('HH:mm');

  instance.state.set('startFilter', startMoment.toDate());
  instance.state.set('endFilter', endMoment.toDate());
}

Template.body.onCreated(function bodyOnCreated() {
  let dict = new ReactiveDict();
  this.state = dict;
  initCourseDict(dict);
});

Template.body.helpers({
  state() {
    return Template.instance().state;
  },
  availableCount() {
    const instance = Template.instance();
    let count = instance.state.get('availableCount');
    if (maxCoursesReached(instance.state))
    {
      return String(count) + "+";
    }
    return String(count);
  },
  courses() {
    return getCourseResults(Template.instance().state);
  },
  showAlert() {
    const instance = Template.instance();
    return maxCoursesReached(instance.state);
  },
  // drop-downs for filter
  names() {
    return Template.instance().state.get('names');
  },
  postcodes() {
    return Template.instance().state.get('postcodes');
  },
  studios() {
    return Template.instance().state.get('studios');;
  },
  styles() {
    return Template.instance().state.get('styles');;
  },
  teachers() {
    return Template.instance().state.get('teachers');;
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
  'change .show-starred input'(event, instance) {
    instance.state.set('showStarred', event.target.checked);
  },
  'click .scrape-all'() {
    Meteor.call('coursescraper.getAllCourses', (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
  'submit .scrape-mbo-page'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    const studioid = Number(event.target.studioid.value);
    if (studioid !== 0) {
      Meteor.call('coursescraper.getCourses', studioid, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          data.forEach(course=>{
            Meteor.call('courses.insert', courseObj);
          });
        }
      });
    }
  },

  // helper clicks
  'click #filter_now'(event, instance) {
    let todayStart = moment().set({ 'second': 0,
      'millisecond': 0});
    let todayEnd = moment().set({'hour': 23,
      'minute': 59,
      'second': 0,
      'millisecond': 0});
    setDateFilters(instance, todayStart, todayEnd);
  },
  'click #filter_today'(event, instance) {
    let todayStart = moment().set({'hour': 0,
      'minute': 0,
      'second': 0,
      'millisecond': 0});
    let todayEnd = moment().set({'hour': 23,
      'minute': 59,
      'second': 0,
      'millisecond': 0});
    setDateFilters(instance, todayStart, todayEnd);
  },
  'click #filter_tomorrow'(event, instance) {
    let tomorrowStart = moment().set({'hour': 0,
      'minute': 0,
      'second': 0,
      'millisecond': 0});
    tomorrowStart.add(1, 'days');
    let tomorrowEnd = moment().set({'hour': 23,
      'minute': 59,
      'second': 0,
      'millisecond': 0});
    tomorrowEnd.add(1, 'days');
    setDateFilters(instance, tomorrowStart, tomorrowEnd);
  },
  'click #filter_week'(event, instance) {
    let weekStart = moment().set({'weekday': 0,
      'hour': 0,
      'minute': 0,
      'second': 0,
      'millisecond': 0});
    let weekEnd = moment().set({'weekday': 6,
      'hour': 23,
      'minute': 59,
      'second': 0,
      'millisecond': 0});
    setDateFilters(instance, weekStart, weekEnd);
  },

  'click #filter_reset'(event, instance) {
    let styleFilters = document.getElementsByClassName("style_filter");
    let postcodeFilters = document.getElementsByClassName("postcode_filter");
    // no "forEach" method exists on NodeList yet
    for (let i = 0; i < styleFilters.length; ++i)
    {
      styleFilters[i].checked = false;
    }
    for (let i = 0; i < postcodeFilters.length; ++i)
    {
      postcodeFilters[i].checked = false;
    }

    let classFilter = document.getElementById("class_filter");
    let teacherFilter = document.getElementById("teacher_filter");
    let studioFilter = document.getElementById("studio_filter");

    classFilter.value = EMPTY;
    teacherFilter.value = EMPTY;
    studioFilter.value = EMPTY;

    initFilters(instance.state);
  },

  // set filters
  'click .style_filter'(event, instance) {
    let styleFilter = instance.state.get('styleFilter');
    let index = styleFilter.indexOf(event.target.value);
    if (event.target.checked) {
      // Add the element
      if (index < 0) {
        styleFilter.push(event.target.value);
      }
    } else {
      // Remove the element if unchecked
      if (index > -1) {
        styleFilter.splice(index, 1);
      }
    }
    instance.state.set('styleFilter', styleFilter);
  },
  'click .postcode_filter'(event, instance) {
    let postcodeFilter = instance.state.get('postcodeFilter');
    let index = postcodeFilter.indexOf(event.target.value);
    if (event.target.checked) {
      // Add the element
      if (index < 0) {
        postcodeFilter.push(event.target.value);
      }
    } else {
      // Remove the element if unchecked
      if (index > -1) {
        postcodeFilter.splice(index, 1);
      }
    }
    instance.state.set('postcodeFilter', postcodeFilter);
  },
  'blur #class_filter'(event, instance) {
    instance.state.set('classFilter', event.target.value);
  },
  'blur #teacher_filter'(event, instance) {
    instance.state.set('teacherFilter', event.target.value);
  },
  'blur #studio_filter'(event, instance) {
    instance.state.set('studioFilter', event.target.value);
  },
  'keypress #class_filter'(event, instance) {
    if (event.which === 13) {
      instance.state.set('classFilter', event.target.value);
    }
  },
  'keypress #teacher_filter'(event, instance) {
    if (event.which === 13) {
      instance.state.set('teacherFilter', event.target.value);
    }
  },
  'keypress #studio_filter'(event, instance) {
    if (event.which === 13) {
      instance.state.set('studioFilter', event.target.value);
    }
  },
  'blur #startdate_filter'(event, instance) {
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter', 
        getNewDateFromInput(startDate, event.target.valueAsDate));
  },
  'blur #starttime_filter'(event, instance) {
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter',
        getNewTimeFromInput(startDate, event.target.value));
  },
  'blur #enddate_filter'(event, instance) {
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewDateFromInput(endDate, event.target.valueAsDate));
  },
  'blur #endtime_filter'(event, instance) {
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewTimeFromInput(endDate, event.target.value));
  },
});
