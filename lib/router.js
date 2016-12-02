Router.route('/', {
  template: 'coursesearch'
});

Router.route('/login', {
  template: 'login'
});

Router.route('scraper',{
  path: AdminDashboard.path('scraper'),
  controller: 'AdminController',
  onAfterAction: function () {
    Session.set('admin_title', 'Scraper');
  }
});
