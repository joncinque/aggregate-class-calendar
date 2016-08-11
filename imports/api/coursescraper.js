import { Meteor } from 'meteor/meteor';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage } from './parsecourse.js';

const STUDIO_INFO =
[
  {
    "name": "Blue Cow Yoga",
    "provider": "MBO",
    "studioid": 23194,
    "area": "Bank"
  },
  {
    "name": "Power Yoga Company",
    "provider": "MBO",
    "studioid": 4706,
    "area": "West London"
  },
  {
    "name": "Yoga Rise",
    "provider": "MBO",
    "studioid": 138949,
    "area": "South London"
  },
  {
    "name": "I Am Yoga",
    "provider": "MBO",
    "studioid": 217848,
    "area": "Central London"
  },
  {
    "name": "Yotopia",
    "provider": "MBO",
    "studioid": 16311,
    "area": "Central London"
  },
  {
    "name": "Triyoga",
    "provider": "MBO",
    "studioid": 1991,
    "area": "Central London"
  }
];

function logCourse(course)
{
  console.log("{ name: '" + course.name + "'");
  console.log("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  console.log("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  console.log("  , room: '" + course.room + "'");
  console.log("  , studio: '" + course.studio + "'");
  console.log("  , teacher: '" + course.teacher + "'");
  console.log("  , url: '" + course.url + "'");
  console.log("}");
}

function makeFinishedCallback(studio)
{
  return function (courses)
  {
    console.log('Finished for studio: ' + studio.name);
    courses.forEach(logCourse);
  }
}

function getCourses(studio)
{
  let htmlFile = studio.studioid + '.html';
  let program = phantomjs.exec(Assets.absoluteFilePath('getcourse.js'), studio.studioid);
  //program.stdout.pipe(process.stdout)
  //program.stderr.pipe(process.stderr)
  program.on('exit', code => {
    parsePage(htmlFile, studio, makeFinishedCallback(studio));
  })
}

Meteor.methods({
  'coursescraper.getAllCourses'()
  {
    if (Meteor.isServer)
    {
      var studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.provider === 'MBO')
        {
          getCourses(studio);
        }
        else
        {
          console.log('Cannot process studio without provider: ' + studio);
        }
      }
    }
  },
  'coursescraper.getCourses'(studioId)
  {
    check(studioId, Number);
    if (Meteor.isServer)
    {
      var studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.studioId === studioId)
        {
          getCourses(studio);
        }
        else
        {
          console.log('Cannot process studio without provider: ' + studio);
        }
      }
    }
  },
});
