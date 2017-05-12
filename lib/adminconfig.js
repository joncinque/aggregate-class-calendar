import { Courses } from '/imports/api/courses.js';

AdminConfig = { 
  name: 'Yogi\'s Choice',
  adminEmails: ['jon.cinque@gmail.com'], 
  nonAdminRedirectRoute: 'login',
  logoutRedirect: 'login',
  collections: 
  { 
    Courses: {
      collectionObject: Courses,
      icon: 'book',
      tableColumns: [
        { label: 'Class name', name: 'name' },
        { label: 'Start datetime', name: 'start' },
        { label: 'End datetime', name: 'end' },
        { label: 'Teacher', name: 'teacher' },
        { label: 'Studio', name: 'studio' },
        { label: 'Style', name: 'style' },
        { label: 'Postcode', name: 'postcode' },
        { label: 'Room', name: 'room' },
        { label: 'Studio URL', name: 'url' },
        { label: 'Booking URL', name: 'booking' },
      ],
    }, 
  } 
}

AdminDashboard.addSidebarItem(
    'Scraper',
    AdminDashboard.path('scraper'),
    { icon: 'external-link-square' }
    );

AdminDashboard.addSidebarItem(
    'Cronjobs',
    AdminDashboard.path('cronjobs'),
    { icon: 'external-link-square' }
    );
