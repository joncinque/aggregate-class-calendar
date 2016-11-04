var fs = require('fs');
var phantomjs = require('phantomjs-prebuilt');
//var getcourse = require('./getcourse'); // used by phantom file
var parsecourse = require('./parsecourse');

function logCourse(course)
{
  console.log("{ name: '" + course.name + "'");
  console.log("  , style: '" + course.style + "'");
  console.log("  , start: " + course.start.format('DD-MM-YYYY HH:mm'));
  console.log("  , end: " + course.end.format('DD-MM-YYYY HH:mm'));
  console.log("  , room: '" + course.room + "'");
  console.log("  , studio: '" + course.studio + "'");
  console.log("  , teacher: '" + course.teacher + "'");
  console.log("  , url: '" + course.url + "'");
  console.log("  , locale: '" + course.locale + "'");
  console.log("  , postcode: '" + course.postcode + "'");
  console.log("}");
}

function makeDBCallback(studio)
{
  return function(courses)
  {
    console.log('Finished for studio: ' + studio.name);
    courses.forEach(logCourse);
  }
}

function makeArrayCallback(studio)
{
  return function(courses)
  {
    console.log('Finished for studio: ' + studio.name);
    courses.forEach(course => {
      course.start = course.start.toDate();
      course.end = course.end.toDate();
    });
    return courses;
  }
}

function transformToJS(courseArray)
{
  courseArray.forEach(course => {
    course.start = course.start.toDate();
    course.end = course.end.toDate();
  });
  return courseArray;
}

function getCoursesAsync(studio, callback)
{
  const htmlFile = Math.abs(studio.studioid) + '.html';
  return phantomjs.run('getcourse.js', 
      studio.provider,
      studio.studioid,
      studio.redirectPage)
    .then(program => {
      return parsecourse.parsePage(htmlFile, studio, callback);
    })
    .then(data => {
      return data;
    });
}

function getAllCourses(studioFile)
{
  fs.readFile(studioFile, 'utf8', function (error, data) {
    if (error)
    {
      throw error;
    }
    const studioInfo = JSON.parse(data);
    for (var index in studioInfo)
    {
      var studio = studioInfo[index];
      if (studio.provider === 'MBO')
      {
        getCoursesAsync(studio, makeDBCallback(studio));
      }
      else
      {
        console.log('Cannot process studio without provider: ' + studio);
      }
    }
  });
}

if (require.main === module)
{
  getAllCourses(process.argv[2]);
}
