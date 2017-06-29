import './fixedheader.html';

import './aboutmodal.js';

Template.fixedheader.events({
  'click .about-btn'() {
    $('#aboutmodal').modal('show');
  },
});
