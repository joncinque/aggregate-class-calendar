import { Meteor } from 'meteor/meteor';
import { BrowserPolicy } from 'meteor/browser-policy-common';

import '/imports/startup/both/accounts-config.js';

// Import ALL files with "Meteor.method" here otherwise it won't be found
import { Courses } from '../imports/api/courses.js';
import '/imports/api/coursescraper.js';
import '/imports/api/logfile.js';
import '/imports/api/studios.js';
import '/imports/api/cronmanager.js';

Meteor.startup(() => {
  // code to run on server at startup

  // ADD INDICES FOR DATABASE HERE
  Courses._ensureIndex({ "name" : 1 });
  Courses._ensureIndex({ "postcode" : 1 });
  Courses._ensureIndex({ "start" : 1 });
  Courses._ensureIndex({ "studio" : 1 });
  Courses._ensureIndex({ "style" : 1 });
  Courses._ensureIndex({ "teacher" : 1 });

  // Setup Browser Policy
  BrowserPolicy.content.disallowInlineScripts();
  BrowserPolicy.framing.disallow();
  BrowserPolicy.content.disallowEval();
  BrowserPolicy.content.allowImageOrigin("www.paypalobjects.com");
  BrowserPolicy.content.allowStyleOrigin("fonts.googleapis.com");
  BrowserPolicy.content.allowFontOrigin("fonts.gstatic.com");
  BrowserPolicy.content.allowFrameOrigin("www.facebook.com");
  BrowserPolicy.content.allowScriptOrigin("connect.facebook.net");
  BrowserPolicy.content.allowImageOrigin("www.facebook.com");
  BrowserPolicy.content.allowFrameOrigin("staticxx.facebook.com");
});
