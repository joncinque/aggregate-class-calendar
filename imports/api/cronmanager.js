import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { SyncedCron } from 'meteor/percolate:synced-cron';

import './coursescraper.js';

const CRONJOB_NAME = "MBOScraper";

Meteor.methods({
  'cronmanager.pause'() {
    SyncedCron.pause();
  },
  'cronmanager.start'() {
    SyncedCron.start();
  },
  'cronmanager.name'() {
    return CRONJOB_NAME;
  },
  'cronmanager.nextScheduledAt'(jobname) {
    check(jobname, String);
    return SyncedCron.nextScheduledAtDate(jobName);
  },
  'cronmanager.startScrapeJob'() {
    logger.log('Starting job');
    SyncedCron.add({
        name: CRONJOB_NAME,
        schedule: function(parser) {
          // parser is a later.parse object
          return parser.text('every 2 hours');
        },
        job: function() {
          return Meteor.call('coursescraper.getAllCoursesSync');
        }
    });
  },
});
