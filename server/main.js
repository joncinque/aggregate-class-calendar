import { Meteor } from 'meteor/meteor';

// Import ALL files with "Meteor.method" here otherwise it won't be found
import { Courses } from '../imports/api/courses.js';
import '../imports/api/coursescraper.js';

Meteor.startup(() => {
  // code to run on server at startup

  // ADD INDICES FOR DATABASE HERE
});
