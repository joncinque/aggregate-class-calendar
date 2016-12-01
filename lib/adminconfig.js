import { Courses } from '/imports/api/courses.js';

AdminConfig = { 
  name: 'Yogi\'s Choice',
  adminEmails: ['jon.cinque@gmail.com'], 
  collections: 
  { 
    Courses: {
      collectionObject: Courses
    }, 
  } 
}
