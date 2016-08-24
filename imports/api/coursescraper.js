import { Meteor } from 'meteor/meteor';

import phantomjs from 'phantomjs-prebuilt';

import { parsePage } from './parsecourse.js';

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

function makeFinishedCallback(classArray, studio)
{
  return function(courses)
  {
    console.log('Finished for studio: ' + studio.name);
    courses.forEach(classArray.push);
  }
}

function getCourses(classArray, studio)
{
  let htmlFile = studio.studioid + '.html';
  let program = phantomjs.exec(Assets.absoluteFilePath('getcourse.js'), studio.provider, studio.studioid);
  //program.stdout.pipe(process.stdout)
  //program.stderr.pipe(process.stderr)
  program.on('exit', code => {
    parsePage(htmlFile, studio, makeFinishedCallback(classArray, studio));
  })
}

Meteor.methods({
  'coursescraper.getAllCourses'()
  {
    let allClasses = [];
    if (Meteor.isServer)
    {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.provider === 'MBO')
        {
          getCourses(allClasses, studio);
        }
        else
        {
          console.log('Cannot process studio without provider: ' + studio);
        }
      }
    }
    return allClasses;
  },
  'coursescraper.getCourses'(studioId)
  {
    check(studioId, Number);
    let classes = [];
    if (Meteor.isServer)
    {
      let studioInfo = JSON.parse(Assets.getText('studios.json'));
      for (let index in studioInfo)
      {
        let studio = studioInfo[index];
        if (studio.studioId === studioId)
        {
          getCourses(classes, studio);
        }
        else
        {
          console.log('Cannot process studio without provider: ' + studio);
        }
      }
    }
    return classes;
  },
});
