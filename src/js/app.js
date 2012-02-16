// import ["jquery", "bootstrap"]
$(function() {
  var $win = $(window)
  , $nav = $('.navbar')
  , navTop = $('.navbar').length && $('.navbar').offset().top - 40
  , isFixed = 0

  processScroll();

  $(window).on('scroll', processScroll);

  function processScroll() {
    var i, scrollTop = $win.scrollTop()
    if (scrollTop >= navTop && !isFixed) {
      isFixed = 1;
      $nav.addClass('navbar-fixed-top');
    } else if (scrollTop <= navTop && isFixed) {
      isFixed = 0;
      $nav.removeClass('navbar-fixed-top');
    }
  }
})