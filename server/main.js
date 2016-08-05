import { Meteor } from 'meteor/meteor';

import moment from 'moment';

import { Courses } from '../imports/api/courses.js';

Meteor.startup(() => {
  // code to run on server at startup
  /*
  const now = moment();
  const courseData = [
  {
    name: 'Rocket',
    start: now.clone(),
    end  : now.clone().add(1, 'hour'),
    studio: 'Frame Shoreditch',
    teacher: 'Marcus Veda',
    url: 'https://moveyourframe.com/timetable',
  },
  {
    name: 'Vinyasa',
    start: now.clone().add(1, 'hour'),
    end  : now.clone().add(2, 'hour'),
    studio: 'Indaba',
    teacher: 'Stewart Gilchrist',
    url  : 'http://indabayoga.com/booking/',
  },
  {
    name: 'Kundalini',
    start: now.clone().add(2, 'hour'),
    end  : now.clone().add(3, 'hour'),
    studio: 'I Am Yoga',
    teacher: 'Madschri',
    url  : 'http://iamyogalondon.com/',
  },
  {
    name: 'Flex',
    start: now.clone().add(3, 'hour'),
    end  : now.clone().add(4, 'hour'),
    studio: 'Chiswell',
    teacher: 'Issy',
    url  : 'http://www.flexlondon.com/',
  },
  ];
  courseData.forEach((course) => {
    Courses.insert(course);
  });
  */
});
