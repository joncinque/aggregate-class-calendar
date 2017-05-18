import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './scraper.html';

Template.scraper.events({
  'click .scrape-all-phantom'() {
    Meteor.call('coursescraper.getAllCoursesPhantom', (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
  'click .scrape-all-sync-phantom'() {
    Meteor.call('coursescraper.getAllCoursesSyncPhantom', (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
  'submit .scrape-mbo-page-phantom'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    const studioid = Number(event.target.studioid.value);
    if (studioid !== 0) {
      Meteor.call('coursescraper.getCoursesPhantom', studioid, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Finished single scrape');
        }
      });
    }
  },
  'submit .scrape-all-sync-chrome'() {
    Meteor.call('coursescraper.getAllCoursesChrome', (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Finished single scrape');
      }
    });
  },
  'submit .scrape-mbo-page-chrome'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    const studioid = Number(event.target.studioid.value);
    if (studioid !== 0) {
      Meteor.call('coursescraper.getCoursesChrome', studioid, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Finished single scrape');
        }
      });
    }
  },
  'submit .add-from-json'(event) {
    // Prevent default browser form submit
    event.preventDefault();
    const jsonfile = (event.target.jsonfile.value);
    if (jsonfile !== '') {
      Meteor.call('coursescraper.addCoursesFromFile', jsonfile, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Finished adding courses');
        }
      });
    }
  },
  'submit .get-log-file'(event) {
    event.preventDefault();
    const logfilename = event.target.logfilename.value;
    if (logfilename !== "") {
      Meteor.call('logfile.getlog', logfilename, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          event.target.logfilecontents.value = data;
        }
      });
    }
  },
});
