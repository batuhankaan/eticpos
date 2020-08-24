var ac = new EmlakPosApiClient();
var app = new EmlakPosApp();
$(document).ready(function () {
    app.init();
    $('.navbar-collapse a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
});
