import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import moment from 'moment';

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
    return moment(this.start).format("H:mm") + "-" + moment(this.end).format("H:mm");
  },
  day() { return moment(this.start).format("dddd D MMMM"); },
  hasRoom() { return this.room !== null && this.room !== undefined && this.room !== ""; },
  hasLocale() { return this.locale !== null && this.locale !== undefined && this.locale !== ""; }
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
