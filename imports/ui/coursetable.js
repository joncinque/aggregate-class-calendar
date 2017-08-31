import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import moment from 'moment-timezone';

import './course.js';

import './coursetable.html';

Template.coursetable.helpers({
  setCourseFunc() {
    return course => { 
      Session.set('activeCourse', course);
      $('#coursemodal').modal('show');
    }
  },
  courses() {
    return Template.currentData().courses;
  },
  activeCourse() {
    return Session.get('activeCourse');
  },
});

Template.coursemodal.helpers({
  startEnd() {
    return moment.tz(this.start, this.timezone).format("H:mm") + "-" + moment.tz(this.end, this.timezone).format("H:mm");
  },
  day() { return moment.tz(this.start, this.timezone).format("dddd D MMMM"); },
  hasRoom() { return this.room !== null && this.room !== undefined && this.room !== "" && this.room !== "undefined"; },
  hasLocale() { return this.locale !== null && this.locale !== undefined && this.locale !== "" && this.locale !== "undefined"; }
});

Template.coursemodal.events({
  'click .share-btn'() {
    FB.ui({
      method: 'share',
      display: 'popup',
      href: 'http://yogischoice.net',
      quote: 'Check out this class found on Yogi\'s Choice!'
    }, response=>{});
  }
});
