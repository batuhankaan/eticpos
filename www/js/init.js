var ac = new EmlakPosApiClient();
var ev = new EmValidator();
var app = new EmlakPosApp();
var cart = new PosCart();

$(document).ready(function () {
    app.init();
    $('a.sidemenuitem').on('click', function(){
        $('#sidenav').width(0);
    });
    //$("input[max][type=number]").onKey
//        $('.navbar-collapse a').click(function () {
//        $(".navbar-collapse").collapse('hide');
//    });
});
$(document).on('input', ':input[type="number"][maxlength]', function () {
    if (this.value.length > this.maxLength) {
        this.value = this.value.slice(0, this.maxLength); 
    }
});

 
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
   document.addEventListener("backbutton", onBackKeyDown, false);
} 

function onBackKeyDown() {
    app.backButton();
}

