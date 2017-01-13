import moment from 'moment';

export const getDaysOfWeek = () =>
{
  const days = [ 1, 2, 3, 4, 5, 6, 7 ];
  return days.map(x=>moment().weekday(x).format('ddd'));
}

export const getNewDateFromInput = (initialDate, inputDate) =>
{
  return moment(initialDate).set({
        'year': inputDate.getFullYear(),
        'month': inputDate.getMonth(),
        'date': inputDate.getDate()
      }).toDate();
}

export const getNewTimeFromInput = (initialDate, inputTime) =>
{
  let inputMoment = moment(inputTime, 'HH:mm');
  return moment(initialDate).set({
        'hour': inputMoment.hour(),
        'minute': inputMoment.minute()
      }).toDate();
}

export const getNowDatetime = ()=>
{
  return moment().toDate();
}

export const getLaterDatetime = ()=>
{
  return moment().set({
    'hour': 23,
    'minute': 59,
    'second': 0,
    'millisecond': 0}).toDate();
}

export const initDayFilter = ()=>
{
  const days = getDaysOfWeek();
  let dayFilter = {};
  days.forEach(day=>dayFilter[day] = 0);
  dayFilter[moment().format('ddd')] = true;
  return dayFilter;
}

export const makeDatetime = (day, timeObj)=>
{
  let madeDatetime = moment(day, 'ddd').set({
    'hour': timeObj.getHours(),
    'minute': timeObj.getMinutes(),
    'second': 0,
    'millisecond': 0});
  madeDatetime.add(7, 'day'); // advance a week by hand for some reason
  return madeDatetime;
}

/*Deprecated*/
export const getStartOfDay = (day)=>
{
  let startOfDay = moment(day, 'ddd').set({
    'hour': 0,
    'minute': 0,
    'second': 0,
    'millisecond': 0});
  if (startOfDay.weekday() === 0) {
    startOfDay.day(7);
  }
  return startOfDay;
}

/*Deprecated*/
export const getEndOfDay = (day)=>
{
  let endOfDay = moment(day, 'ddd').set({
    'hour': 23,
    'minute': 59,
    'second': 0,
    'millisecond': 0});
  if (endOfDay.weekday() === 0) {
    endOfDay.day(7);
  }
  return endOfDay;
}
