import './footer.html';

import './aboutmodal.js';

Template.footer.events({
  'click .about-btn'() {
    $('#aboutmodal').modal('show');
  },
});
