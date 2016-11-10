import moment from 'moment';

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
