'use strict';

const fs = require('fs');
const moment = require('moment-timezone');
const xmldom = require('xmldom');
//const logger = require('./logger');

const PARSER_FUNCTIONS = 
{
  "MBO": parseMBOPage,
};

function cleanupHtml(htmlString)
{
  return htmlString.replace(/(&nbsp;)|(\t)/g,' ');
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

function makeParseAllChildrenFunction(recurseLevel, verbose)
{
  return (cell)=>{ return parseAllChildren(cell,recurseLevel, verbose); };
}

function parseAllChildren(cell, recurseLevel, verbose)
{
  let parsedString = "";
  if (cell.data !== null &&
      cell.data !== undefined)
  {
    parsedString += cell.data.trim();
  }

  if (cell.childNodes === null ||
      cell.childNodes === undefined ||
      cell.childNodes.length === 0)
  {
    if (verbose)
    {
      logger.debug('Bad cell without children or data: [');
      logger.debug(cell);
      logger.debug(']');
    }
  }
  else
  {
    if (recurseLevel > 0)
    {
      for (let i = 0; i < cell.childNodes.length; ++i)
      {
        parsedString += parseAllChildren(cell.childNodes[i], recurseLevel - 1, verbose);
      }
    }
  }
  return parsedString;
}

function parseFirstChild(cell, recurseLevel, verbose)
{
  const firstData = parseFromData(cell);
  if (firstData !== undefined)
  {
    return firstData;
  }

  if (cell.childNodes === null ||
      cell.childNodes === undefined ||
      cell.childNodes.length === 0)
  {
    if (verbose)
    {
      logger.debug('Bad cell without children or data: [');
      logger.debug(cell);
      logger.debug(']');
    }
    return;
  }
  if (recurseLevel > 0)
  {
    return parseFirstChild(cell.childNodes[0], recurseLevel - 1, verbose);
  }
}

function makeParseFirstChildFunction(recurseLevel, verbose)
{
  return (cell)=>{ return parseFirstChild(cell, recurseLevel, verbose); };
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
    parser: makeParseAllChildrenFunction(5, false),
  },
  teacher:
  {
    required: true,
    column: [ 'Teacher', 'Yoga + Pilates Mat Teacher', 'Staff' ], 
    parser: makeParseFirstChildFunction(2, false),
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
    column: [ 'Location', 'Studio' ],
    parser: makeParseFirstChildFunction(2, false),
  },
};

function propNameOfColumnHeader(col)
{
  for (let prop in PARSER_MAP)
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
  let map = {};

  for (let i = 0; i < headerRow.childNodes[0].childNodes.length; ++i)
  {
    let item = headerRow.childNodes[0].childNodes[i];
    if (item.childNodes !== null &&
        item.childNodes.length > 0)
    {
      let data = item.childNodes[0].data;
      let propName = propNameOfColumnHeader(data);
      if (propName !== undefined && propName !== "")
      {
        //logger.log('Mapping for "'+data+'", property "'+propName+'", index '+i);
        map[i] = propName;
      }
    }
  }

  return map;
}

function parseDateFromRow(row, timezone)
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
      const parsedDate = moment.tz(dateElement, 'DD MMM YYYY', timezone);
      return parsedDate;
    }
  }
  // returns undefined otherwise
}

function isCourseValid(webCourse, studio)
{
  for (let prop in PARSER_MAP)
  {
    if (PARSER_MAP[prop].required)
    {
      if (webCourse.hasOwnProperty(prop) === false ||
          webCourse[prop] === undefined)
      {
        return false;
      }
    }
  }
  // Extra check on the locale info -- if a locale is specified, make sure it's
  // also included in studio info.
  if (webCourse['locale'] !== undefined)
  {
    if (studio.locales === undefined ||
        studio.locales[webCourse['locale']] === undefined)
    {
      return false;
    }
  }
  else if (studio.locale === undefined)
  {
    return false;
  }

  return true;
}

const HIGH_PRIORITY = 1;
const MEDIUM_PRIORITY = 2;
const LOW_PRIORITY = 3;
const LOWEST_PRIORITY = 4;
const NO_PRIORITY = 5;
// We add in a "priorty" field because some classes contain multiple keywords
// This way, "Mysore-style Ashtanga" is tagged as "Mysore" and not "Ashtanga".
exports.STYLE_MAP =
{
  Anusara: { regex: /anusara/i,               priority: HIGH_PRIORITY },
  Ashtanga: { regex: /ashtanga|astanga/i,     priority: MEDIUM_PRIORITY },
  //Barre: { regex: /barre|ballet/i,            priority: HIGH_PRIORITY },
  Basic: { regex: /basic|beginner/i,          priority: LOWEST_PRIORITY },
  Community: { regex: /community/i,           priority: MEDIUM_PRIORITY },
  Dharma: { regex: /dharma|mittra/i,          priority: HIGH_PRIORITY },
  Flow: { regex: /flow/i,                     priority: NO_PRIORITY },
  Forrest: { regex: /forrest/i,               priority: HIGH_PRIORITY },
  Hatha: { regex: /hatha/i,                   priority: LOW_PRIORITY },
  Hot: { regex: /hot/i,                       priority: MEDIUM_PRIORITY },
  Iyengar: { regex: /iyengar/i,               priority: HIGH_PRIORITY },
  Jivamukti: { regex: /jivamukti|spiritual/i, priority: HIGH_PRIORITY },
  Kundalini: { regex: /kundalini/i,           priority: HIGH_PRIORITY },
  Meditation: { regex: /meditation|meditate|mindful/i,priority: LOW_PRIORITY },
  Mysore: { regex: /mysore/i,                 priority: HIGH_PRIORITY },
  Nidra: { regex: /nidra/i,                   priority: HIGH_PRIORITY },
  //Pilates: { regex: /pilates|apparatus/i,     priority: HIGH_PRIORITY },
  Power: { regex: /power|dynamic/i,           priority: LOW_PRIORITY },
  Pranayama: { regex: /pranayama/i,           priority: LOW_PRIORITY },
  Pregnancy: { regex: /pregnancy|natal/i,     priority: HIGH_PRIORITY },
  Restorative: { regex: /restorative|restore|recharge/i, priority: MEDIUM_PRIORITY },
  Rocket: { regex: /rocket/i,                 priority: HIGH_PRIORITY },
  Sivananda: { regex: /sivananda/i,           priority: HIGH_PRIORITY },
  Vinyasa: { regex: /vinyasa/i,               priority: LOWEST_PRIORITY },
  Yin: { regex: /yin/i,                       priority: HIGH_PRIORITY },
}

function styleOfName(courseName)
{
  let priority = undefined;
  let style = undefined;
  for (let prop in exports.STYLE_MAP)
  {
    if (courseName.match(exports.STYLE_MAP[prop].regex) !== null)
    {
      if (priority === undefined || exports.STYLE_MAP[prop].priority < priority)
      {
        priority = exports.STYLE_MAP[prop].priority;
        style = prop;
      }
    }
  }

  if (style !== undefined)
  {
    return style;
  }
  else
  {
    logger.debug("No match found for course name: " + courseName);
    return "Other";
  }
}

function parseCourseStart(webCourse, currentDate, timezone)
{
  let courseStart = moment.tz(webCourse['start'], 'HH:mm', timezone);
  if (courseStart.isValid())
  {
    courseStart.year(currentDate.year());
    courseStart.month(currentDate.month());
    courseStart.date(currentDate.date());
  }
  else
  {
    logger.error('Error parsing time from start time: ' + webCourse['start']);
  }
  return courseStart;
}

function parseCourseEnd(webCourse, courseStart)
{
  // SO MUCH MAGIC
  const NUMBER_LOCATION = 1;
  const TIME_TYPE_LOCATION = 2;
  const SECOND_NUMBER_LOCATION = 4; // needed for "1 hour & 15 minutes"
  const SECOND_TIME_TYPE_LOCATION = 5;
  const durationRegex = /(\d+) *([a-zA-Z]+)( & (\d+) *([a-zA-Z]+))?/;
  const match = webCourse.duration.match(durationRegex);

  let courseEnd = courseStart.clone().add(
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
    logger.error('Error parsing end time from duration: ' + webCourse['Duration']);
  }
  return courseEnd;
}

function dbCourseOfWebCourse(webCourse, currentDate, studio)
{
  let dbCourse =
  {
    name: webCourse['course'],
    teacher: webCourse['teacher'],
    room: webCourse['room'],
  };

  dbCourse.style = styleOfName(dbCourse.name);

  dbCourse.start = parseCourseStart(webCourse, currentDate, studio.timezone);
  dbCourse.end = parseCourseEnd(webCourse, dbCourse.start);

  dbCourse.locale = webCourse['locale'];
  let localeInfo = {};
  if (dbCourse.locale !== undefined && 
      studio.locales !== undefined &&
      studio.locales[dbCourse.locale] !== undefined)
  {
    localeInfo = studio.locales[dbCourse.locale];
  }
  else
  {
    localeInfo = studio.locale;
  }
  dbCourse.studio = localeInfo.name;
  dbCourse.url = localeInfo.url;
  dbCourse.booking = localeInfo.booking;
  dbCourse.postcode = localeInfo.postcode;
  dbCourse.timezone = studio.timezone;

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

function checkAllLocalesPresent(courses, studio)
{
  if (studio.locales === undefined)
  {
    // Only one locale, so we're OK
    return true;
  }

  let localePresentMap = {};
  for (let locale in studio.locales)
  {
    localePresentMap[locale] = false;
  }

  for (let i = 0; i < courses.length; ++i)
  {
    let courseLocale = courses[i].locale;
    if (localePresentMap.hasOwnProperty(courseLocale))
    {
      localePresentMap[courseLocale] = true;
    }
    else
    {
      logger.error('Unknown locale found in course: [' + courseLocale + ']');
    }
  }

  let allPresent = true;
  for (let locale in localePresentMap)
  {
    if (localePresentMap[locale] === false)
    {
      allPresent = false;
      logger.error('Locale [' + locale + '] has no courses, double-check it');
    }
  }
  return allPresent;
}

function makeJSONCourses(columnMap, tableRows, studio)
{
  const FIRST_DATA_ROW_LOCATION = 1; // MAGIC NUMBER

  let courses = [];
  let currentDate = null;

  for (let i = FIRST_DATA_ROW_LOCATION; i < tableRows.length; ++i)
  {
    let row = tableRows[i];
    let nextDate = parseDateFromRow(row, studio.timezone);
    if (nextDate !== undefined && nextDate.isValid())
    {
      currentDate = nextDate;
    }
    else if (rowIsValid(row))
    {
      let webCourse = {};
      for (let j = 0; j < row.childNodes.length; ++j)
      {
        if (columnMap[j] !== undefined)
        {
          let cell = row.childNodes[j];
          let key = columnMap[j];
          webCourse[key] = PARSER_MAP[key].parser(cell);
        }
        else
        {
          //logger.debug('No mapping for column: ' + j);
        }
      }
      if (isCourseValid(webCourse, studio))
      {
        let dbCourse = dbCourseOfWebCourse(webCourse, currentDate, studio);
        courses.push(dbCourse);
      }
      else
      {
        logger.debug('No valid course found:');
        logger.debug(webCourse);
      }
    }
  }

  if (checkAllLocalesPresent(courses, studio) === false)
  {
    logger.error('Issue found with studio ['+studio.studioid+']');
  }
  return courses;
}

function parseMBOPage(htmlString, studio, callback)
{
  const cleanString = cleanupHtml(htmlString);
  if (cleanString === '')
  {
    logger.error('Empty string found, retry ['+studio.name+'] [' + studio.studioid + ']');
    if (callback !== undefined)
    {
      return callback([]);
    }
    else
    {
      return [];
    }
  }

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
  return courses;
}

exports.parsePage = (path, studio, callback) =>
{
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error)
      {
        reject(error);
      }
      else
      {
        resolve(PARSER_FUNCTIONS[studio.provider](data, studio, callback));
      }
    });
  });
}

exports.makeParsePageEventEmitter = (studio, callback) =>
{
  return (client, path) => {
    let htmlData = fs.readFileSync(path, 'utf8');
    let jsonData = PARSER_FUNCTIONS[studio.provider](htmlData, studio, callback);
    client._notifier.emit('finish-scraping', jsonData);
  }
}

if (require.main === module)
{
  // For testing
  let multiStudioInfo =
  {
    "name": "Triyoga",
    "provider": "MBO",
    "studioid": 1991,
    "redirectPage":  "",
    "locales": 
    {
      "Soho":
      {
        "name": "Triyoga Soho",
        "url": "http://www.triyoga.co.uk/",
        "postcode": "W"
      },
      "Camden":
      {
        "name": "Triyoga Camden",
        "url": "http://www.triyoga.co.uk/",
        "postcode": "NW"
      },
      "Covent Garden":
      {
        "name": "Triyoga Covent Garden",
        "url": "http://www.triyoga.co.uk/",
        "postcode": "WC"
      },
      "Chelsea":
      {
        "name": "Triyoga Chelsea",
        "url": "http://www.triyoga.co.uk/",
        "postcode": "SW"
      }
    }
  };
  let singleStudioInfo =
  {
    "name": "Blue Cow Yoga",
    "provider": "MBO",
    "studioid": 1991,
    "redirectPage":  "",
    "locale": 
    {
      "name": "Blue Cow Yoga",
      "url": "http://bluecowyoga.com/",
      "postcode": "EC"
    }
  };

  function loggerCallback(courses)
  {
    logger.info(courses);
  }

  exports.parsePage(process.argv[2], singleStudioInfo, loggerCallback);
}
