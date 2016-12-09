import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import fs from 'fs';

Meteor.methods({
  'logfile.getlog'(filename)
  {
    check(filename, String);

    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }
});
