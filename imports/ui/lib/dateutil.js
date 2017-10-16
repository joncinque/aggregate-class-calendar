import moment from 'moment-timezone';

export const getDaysOfWeek = () =>
{
  const days = [ 1, 2, 3, 4, 5, 6, 7 ];
  return days.map(x=>moment().weekday(x).format('ddd'));
}

const getWeekdayDays = () =>
{
  const days = [ 1, 2, 3, 4, 5 ];
  return days.map(x=>moment().weekday(x).format('ddd'));
}

const getWeekendDays = () =>
{
  const days = [ 6, 7 ];
  return days.map(x=>moment().weekday(x).format('ddd'));
}

export const isDaynameActive = (dayname) =>
{
  const SUNDAY = 7;
  switch (dayname)
  {
    case 'Tomorrow':
      return moment().isoWeekday() !== SUNDAY;
    default:
      return true;
  }
}

export const getDayShortcuts = () =>
{
  return ['All week', 'Today', 'Tomorrow', 'Weekdays', 'Weekend'];
}

export const getDayFilterForShortcut = (shortcutDay) =>
{
  let dayFilter = createDayFilter();
  switch (shortcutDay)
  {
    case 'All week':
      getDaysOfWeek().forEach(dayname=>dayFilter[dayname] = true);
      break;
    case 'Today':
      dayFilter[moment().format('ddd')] = true;
      break;
    case 'Tomorrow':
      dayFilter[moment().add(1, 'days').format('ddd')] = true;
      break;
    case 'Weekdays':
      getWeekdayDays().forEach(dayname=>dayFilter[dayname] = true);
      break;
    case 'Weekend':
      getWeekendDays().forEach(dayname=>dayFilter[dayname] = true);
      break;
  }
  return dayFilter;
}

export const getTimesOfDay = ()=>
{
  return ['All day', 'Morning', 'Midday', 'Evening'];
}

export const getStartForTimeOfDay = (tod)=>
{
  switch (tod)
  {
    case 'All day': return '00:00';
    case 'Morning': return '00:00';
    case 'Midday': return '10:00';
    case 'Evening': return '16:00';
  }
}

export const getEndForTimeOfDay = (tod)=>
{
  switch (tod)
  {
    case 'Morning': return '10:00';
    case 'Midday': return '16:00';
    case 'Evening': return '23:59';
    case 'All day': return '23:59';
  }
}

export const getNewTimeFromInput = (initialDate, inputTime, timezone) =>
{
  const inputMoment = moment.tz(inputTime, 'HH:mm', timezone);
  return moment.tz(initialDate, timezone).set({
        'hour': inputMoment.hour(),
        'minute': inputMoment.minute()
      }).toDate();
}

export const getDisplayTime = (jsDate, timezone) =>
{
  return moment.tz(jsDate, timezone).format('HH:mm');
}

export const getNowDatetime = (timezone)=>
{
  return moment.tz(moment.tz.guess()).toDate();
}

export const getLaterDatetime = (timezone)=>
{
  return moment.tz(timezone).set({
    'hour': 23,
    'minute': 59,
    'second': 0,
    'millisecond': 0}).toDate();
}

const createDayFilter = () =>
{
  const days = getDaysOfWeek();
  let dayFilter = {};
  days.forEach(day=>dayFilter[day] = 0);
  return dayFilter;
}

export const initDayFilter = ()=>
{
  let dayFilter = createDayFilter();
  dayFilter[moment().format('ddd')] = true;
  return dayFilter;
}

export const makeSearchDatetime = (day, timeObj, timezone)=>
{
  const localTime = moment.tz(timeObj, timezone);
  const madeDatetime = moment.tz(timezone).set({
    'isoWeekday': moment(day, 'ddd').isoWeekday(), // tricky...
    'hour': localTime.hour(),
    'minute': localTime.minute(),
    'second': 0,
    'millisecond': 0});
  return madeDatetime;
}

export const isDaynameToday = (dayname) =>
{
  return dayname === moment().format('ddd');
}
