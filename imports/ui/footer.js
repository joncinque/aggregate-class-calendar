import './footer.html';

Template.footer.events({
  'click .about-btn'() {
    $('#aboutmodal').modal('show');
  },
});
