var ac = new EmlakPosApiClient();
var ev = new EmValidator();
var app = new EmlakPosApp();
var datas = new EmlakPosUserData();
$(document).ready(function () {
    app.init();
    $('.navbar-collapse a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
});
