import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import moment from 'moment';

import { getNewTimeFromInput,
  getDayFilterForShortcut,
  getDaysOfWeek,
  getDayShortcuts,
  getTimesOfDay,
  getStartForTimeOfDay,
  getEndForTimeOfDay,
  isDaynameToday } from './lib/dateutil.js';

import { EMPTY,
  getCourseResults,
  initCourseDict,
  initFilters,
  maxCoursesReached } from './lib/searchutil.js';

import './coursetable.js';
import './fixedheader.js';
import './howmodal.js';
import './specificmodal.js';

import './coursesearch.html';

// not needed, but helps sort out dependencies
// import '../api/coursescraper.js';
// import '../api/studios.js';

function resetAllCheckBoxes(checkboxes)
{
  // no "forEach" method exists on NodeList yet
  for (let i = 0; i < checkboxes.length; ++i)
  {
    checkboxes[i].checked = false;
  }
}

Template.coursesearch.onCreated(function () {
  let dict = new ReactiveDict();
  this.state = dict;
  initCourseDict(dict);
  initFilters(dict);
});

Template.coursesearch.helpers({
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
  daysofweek() {
    return getDaysOfWeek();
  },
  dayshortcuts() {
    return getDayShortcuts();
  },
  timesofday() {
    return getTimesOfDay();
  },
  names() {
    return Template.instance().state.get('names');
  },
  postcodes() {
    return Template.instance().state.get('postcodes');
  },
  studios() {
    return Template.instance().state.get('studios');
  },
  styles() {
    return Template.instance().state.get('styles');
  },
  teachers() {
    return Template.instance().state.get('teachers');
  },
  // For the titles
  selectedDays() {
    let dayString = '';
    const dayFilter = Template.instance().state.get('dayFilter');
    for (let dayName in dayFilter) {
      if (dayFilter[dayName] === true) {
        if (dayString === '') {
          dayString += ': ';
        } else {
          dayString += ', ';
        }
        dayString += dayName;
      }
    }
    return dayString;
  },
  selectedPostcodes() {
    let postcodes = Template.instance().state.get('postcodeFilter').slice(0);
    let postcodeString = postcodes.sort().join(', ');
    if (postcodeString !== '') {
      return ': ' + postcodeString;
    }
    return postcodeString;
  },
  selectedStyles() {
    let styles = Template.instance().state.get('styleFilter').slice(0);
    let styleString = styles.sort().join(', ');
    if (styleString !== '') {
      return ': ' + styleString;
    }
    return styleString;
  },
  selectedTime() {
    return ': ' + 
        moment(Template.instance().state.get('startFilter')).format('HH:mm') +
        ' to ' +
        moment(Template.instance().state.get('endFilter')).format('HH:mm');

  },
  starttime() {
    return moment(Template.instance().state.get('startFilter')).format('HH:mm');
  },
  endtime() {
    return moment(Template.instance().state.get('endFilter')).format('HH:mm');
  },
});

Template.daycheck.helpers({
  isDayChecked(dayname) {
    return isDaynameToday(dayname);
  },
});

Template.coursesearch.events({
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

  // helper clicks
  'click #filter_reset'(event, instance) {
    let styleFilters = document.getElementsByClassName("style_filter");
    resetAllCheckBoxes(styleFilters);
    let postcodeFilters = document.getElementsByClassName("postcode_filter");
    resetAllCheckBoxes(postcodeFilters);
    let dayFilters = document.getElementsByClassName("dayofweek_filter");
    // no forEach on nodeList yet
    for (let i = 0; i < dayFilters.length; ++i) {
      dayFilters[i].checked = isDaynameToday(dayFilters[i].value);
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
  'click .dayofweek_filter'(event, instance) {
    let dayFilter = instance.state.get('dayFilter');
    dayFilter[event.target.value] = event.target.checked;
    instance.state.set('dayFilter', dayFilter);
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
  'blur #starttime_filter'(event, instance) {
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter',
        getNewTimeFromInput(startDate, event.target.value));
  },
  'blur #endtime_filter'(event, instance) {
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewTimeFromInput(endDate, event.target.value));
  },
  'click .dayofweekshortcut_filter'(event, instance) {
    const days = getDayFilterForShortcut(event.target.value);
    let dayFilters = document.getElementsByClassName("dayofweek_filter");
    // no forEach on nodeList yet
    for (let i = 0; i < dayFilters.length; ++i) {
      dayFilters[i].checked = days[dayFilters[i].value];
    }
    instance.state.set('dayFilter', days);
  },
  'click .timeofday_filter'(event, instance) {
    const startTime = getStartForTimeOfDay(event.target.value);
    let startDate = instance.state.get('startFilter');
    instance.state.set(
        'startFilter',
        getNewTimeFromInput(startDate, startTime));
    const endTime = getEndForTimeOfDay(event.target.value);
    let endDate = instance.state.get('endFilter');
    instance.state.set(
        'endFilter',
        getNewTimeFromInput(endDate, endTime));
  },
  'click .how-btn'() {
    $('#howmodal').modal('show');
  },
  'click .specific-btn'() {
    $('#specificmodal').modal('show');
  },
});
