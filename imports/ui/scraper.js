import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './scraper.html';

Template.scraper.events({
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
