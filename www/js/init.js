var ac = new EmlakPosApiClient();
var ev = new EmValidator();
var app = new EmlakPosApp();
$(document).ready(function () {
    app.init();
    $('.navbar-collapse a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
});
