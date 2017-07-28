import './fixedheader.html';

import './aboutmodal.js';
import './feedbackmodal.js';

Template.fixedheader.events({
  'click .about-btn'() {
    $('#aboutmodal').modal('show');
  },
  'click .feedback-btn'() {
    $('#feedbackmodal').modal('show');
  },
});
