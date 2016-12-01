import { Meteor } from 'meteor/meteor';

// Import ALL files with "Meteor.method" here otherwise it won't be found
import { Courses } from '../imports/api/courses.js';
import '../imports/api/coursescraper.js';
import '../imports/api/studios.js';

Meteor.startup(() => {
  // code to run on server at startup

  // ADD INDICES FOR DATABASE HERE
  Courses._ensureIndex({ "name" : 1 });
  Courses._ensureIndex({ "postcode" : 1 });
  Courses._ensureIndex({ "start" : 1 });
  Courses._ensureIndex({ "studio" : 1 });
  Courses._ensureIndex({ "style" : 1 });
  Courses._ensureIndex({ "teacher" : 1 });

  // Add admin user
  //let id = Accounts.createUser({
  //  email: "***.******@*****.***",
  //  password: "********",
  //  profile: { name: "***" }
  //});

  //Roles.addUsersToRoles(id, ['admin'], 'default-group');
});
