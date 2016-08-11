var fs = require('fs');
var moment = require('moment');
var xmldom = require('xmldom');

function cleanupHtml(htmlString)
{
  var cleanString = htmlString.replace(/&nbsp;/g,' ');
  //cleanString = cleanString.replace(/\<br\>/g,' ');
  //cleanString = cleanString.replace(/\<input.*\>/g,' ');
  return cleanString;
}

function parseFromData(cell)
{
  if (cell.childNodes !== null &&
      cell.childNodes.length > 0)
  {
    const dataCell = cell.childNodes[0];
    if (dataCell.data !== null &&
        dataCell.data !== undefined)
    {
      return dataCell.data.trim();
    }
  }
}

function parseFromChild(cell, recurseLevel)
{
  const firstData = parseFromData(cell);
  if (firstData !== undefined)
  {
    return firstData;
  }

  if (firstData === undefined && recurseLevel > 0)
  {
    if (cell.childNodes !== null &&
        cell.childNodes !== undefined &&
        cell.childNodes.length > 0)
    {
      return parseFromChild(cell.childNodes[0], recurseLevel - 1);
    }
  }
}

function makeParseFromChildFunction(recurseLevel)
{
  return function(cell) { return parseFromChild(cell, recurseLevel); };
}

const PARSER_MAP =
{
  start: 
  {
    required: true,
    column: [ 'Start time' ],
    parser: parseFromData,
  },
  course:
  {
    required: true,
    column: [ 'Classes' ],
    parser: makeParseFromChildFunction(1),
  },
  teacher:
  {
    required: true,
    column: [ 'Teacher', 'Yoga + Pilates Mat Teacher' ], 
    parser: makeParseFromChildFunction(2),
  },
  duration:
  {
    required: true,
    column: [ 'Duration' ],
    parser: parseFromData,
  },
  room:
  {
    required: false,
    column: [ 'Room' ],
    parser: parseFromData,
  },
  locale:
  {
    required: false,
    column: [ 'Location' ],
    parser: parseFromData,
  },
};

function propNameOfColumnHeader(col)
{
  for (var prop in PARSER_MAP)
  {
    const headers = PARSER_MAP[prop];
    if (PARSER_MAP[prop].column.indexOf(col) !== -1)
    {
      return prop;
    }
  }
  return '';
}

function makeColumnMap(headerRow)
{
  var map = {};

  for (var i = 0; i < headerRow.childNodes[0].childNodes.length; ++i)
  {
    var item = headerRow.childNodes[0].childNodes[i];
    if (item.childNodes !== null &&
        item.childNodes.length > 0)
    {
      var data = item.childNodes[0].data;
      var propName = propNameOfColumnHeader(data);
      if (propName !== undefined && propName !== "")
      {
        console.log('Mapping for "'+data+'",property "'+propName+'", index '+i);
        map[i] = propName;
      }
    }
  }

  return map;
}

function parseDateFromRow(row)
{
  const DATE_LOCATION = 2; // MAGIC NUMBER

  const firstCell = row.childNodes[0];
  if (firstCell.childNodes !== null &&
      firstCell.childNodes.length > 0)
  {
    // Pull out the date
    const firstData = firstCell.childNodes[0];
    if (firstData.childNodes !== null &&
        firstData.childNodes.length > DATE_LOCATION)
    {
      const dateElement = firstData.childNodes[DATE_LOCATION].data.trim();
      const parsedDate = moment(dateElement, 'DD MMM YYYY');
      if (parsedDate.isValid())
      {
        console.log('Current date: ' + parsedDate.format('DD MMM YYYY'));
      }
      else
      {
        console.log('Problem parsing date from data element in:"' + dateElement + '"');
      }
      return parsedDate;
    }
  }
}

function isCourseValid(course)
{
  for (var prop in PARSER_MAP)
  {
    if (PARSER_MAP[prop].required && course.hasOwnProperty(prop) === false)
    {
      return false;
    }
  }
  return true;
}

function parseCourseStart(webCourse, currentDate)
{
  var courseStart = moment(webCourse['start'], 'HH:mm');
  if (courseStart.isValid())
  {
    courseStart.year(currentDate.year());
    courseStart.month(currentDate.month());
    courseStart.date(currentDate.date());
  }
  else
  {
    console.log('Error parsing time from start time: ' + webCourse['start']);
  }
  return courseStart;
}

function parseCourseEnd(webCourse, courseStart)
{
  const NUMBER_LOCATION = 1;
  const TIME_TYPE_LOCATION = 2;
  const SECOND_NUMBER_LOCATION = 4; // needed for "1 hour & 15 minutes"
  const SECOND_TIME_TYPE_LOCATION = 5;
  const durationRegex = /(\d+) *([a-zA-Z]+)( & (\d+) *([a-zA-Z]+))?/;
  const match = webCourse.duration.match(durationRegex);

  var courseEnd = courseStart.clone().add(
      Number(match[NUMBER_LOCATION]),
      match[TIME_TYPE_LOCATION]);
  if (match[SECOND_NUMBER_LOCATION] !== undefined &&
      match[SECOND_TIME_TYPE_LOCATION] !== undefined)
  {
    courseEnd = courseEnd.add(
        Number(match[SECOND_NUMBER_LOCATION]),
        match[SECOND_TIME_TYPE_LOCATION]);
  }
  if (courseEnd.isValid() === false)
  {
    console.log('Error parsing end time from duration: ' + webCourse['Duration']);
  }
  return courseEnd;
}

function dbCourseOfWebCourse(webCourse, currentDate, studio)
{
  var dbCourse = 
  {
    name: webCourse['course'],
    start: null,
    end: null,
    teacher: webCourse['teacher'],
    studio: studio.name,
    room: webCourse['room'],
    location: webCourse['location'],
    url: null,
  };

  dbCourse.start = parseCourseStart(webCourse, currentDate);
  dbCourse.end = parseCourseEnd(webCourse, dbCourse.start);

  return dbCourse;
}

function rowIsValid(row)
{
  const STRIKETHROUGH_TAG_LOCATION = 1;
  if (row.childNodes === undefined || 
      row.childNodes === null ||
      row.childNodes.length === 0)
  {
    return false;
  }
  const firstCell = row.childNodes[0];
  // test if strikethrough tag exists
  if (firstCell.childNodes !== null &&
      firstCell.childNodes.length > STRIKETHROUGH_TAG_LOCATION)
  {
    const tagCell = firstCell.childNodes[STRIKETHROUGH_TAG_LOCATION];
    if (tagCell.tagName === 's' || tagCell.nodeName === 's')
    {
      return false;
    }
  }
  return true;
}

function makeJSONCourses(columnMap, tableRows, studio)
{
  const FIRST_DATA_ROW_LOCATION = 1; // MAGIC NUMBER

  var courses = [];
  var currentDate = null;

  for (var i = FIRST_DATA_ROW_LOCATION; i < tableRows.length; ++i)
  {
    var row = tableRows[i];
    var nextDate = parseDateFromRow(row);
    if (nextDate !== undefined && nextDate.isValid())
    {
      currentDate = nextDate;
    }
    else if (rowIsValid(row))
    {
      var course = {};
      for (var j = 0; j < row.childNodes.length; ++j)
      {
        if (columnMap[j] !== undefined)
        {
          var cell = row.childNodes[j];
          var key = columnMap[j];
          course[key] = PARSER_MAP[key].parser(cell);
        }
        else
        {
          //console.log('No mapping for column: ' + j);
        }
      }
      if (isCourseValid(course))
      {
        var dbCourse = dbCourseOfWebCourse(course, currentDate, studio);
        courses.push(dbCourse);
      }
      else
      {
        console.log('No valid course found:');
        console.log(course);
      }
    }
  }
  return courses;
}

function processPage(htmlString, studio, callback)
{
  const cleanString = cleanupHtml(htmlString);
  const parser = new xmldom.DOMParser();
  const dom = parser.parseFromString(cleanString, 'text/html');

  const headerRow = dom.getElementsByTagName('thead');
  const columnMap = makeColumnMap(headerRow[0]);

  const tableRows = dom.getElementsByTagName('tr');
  const courses = makeJSONCourses(columnMap, tableRows, studio);
  if (callback !== undefined)
  {
    callback(courses);
  }
}

export function parsePage(path, studio, callback)
{
  fs.readFile(path, 'utf8', function(error, data) {
    if (error)
    {
      console.log(error);
    }
    else
    {
      processPage(data, studio, callback);
    }
  });
}

// For testing
var studioInfo =
{
  "name": "Blue Cow Yoga",
  "provider": "MBO",
  "studioid": 23194,
  "area": "Bank"
};

function loggerCallback(courses)
{
  console.log(courses);
}

//parsePage('test_teacher.html', studioInfo, loggerCallback);
