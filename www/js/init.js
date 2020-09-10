var ac = new EmlakPosApiClient();
var ev = new EmValidator();
var app = new EmlakPosApp();
$(document).ready(function () {
    document.addEventListener("backbutton", onBackKeyDown, false);

    function onBackKeyDown() {
        alert("back button")
        app.backButton();
    }
    app.init();
    $('.navbar-collapse a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
});
