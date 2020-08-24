/* global ac, app */

class EmlakPosApp {
    constructor() {
        this.default_view = 'dashboard';
        this.view = null;
        this.last_view = null;

        this.lang = 'tr';
        this.render_params = {};
        this.template = '';

        this.ac = new EmlakPosApiClient();

        this.last_response = {};
        this.message = null;
        this.arrba = new Array();
        this.public_pages = [
            'register',
            'registercustomer',
            'login',
//            'registercustomer_attn',
//            'registercustomer_comp',
//            'registercustomer_docs',
            'registernewcustomer',
            'resetpassword',
            'error'
        ];
        
        this.defines = {
            external_content:{
                tos:'http://localhost/wtf/apps/static/apiclient/pages/static/tos.html'
            }
        };
    }

    init() {
        if (this.getToken() !== null) {
            this.setToken(this.getToken());
            return this.run('dashboard');
       }
        return this.run('login');
    }

    run(view) {
        this.view = view;
        console.log("App::run(" + view + ")");
        $("div#main_messages").hide();

        
        if (!this.actionCheckAuth()) { // user logged in ?
            if (this.public_pages.indexOf(view) === -1) { // is the view public or requires to be logged 
                this.viewlogin();
                return  this.displayMessage(this.l('Lütfen giriş yapınız.'));

            }
        }
        
        let view_name = 'view' + view;
        if (typeof this[view_name] === "function") {
            console.log(view + " called");
            return this[view_name]();
        } else {
            console.log(view_name + " function not found");
            this.displayError('İşlem bulunamadı.');
            return;
        }
    }

    handleResponse(response) {
        console.log('handling response');
        this.last_response = response;
        if (this.last_response.header.auth_result === false) {
            this.displayMessage(this.l('Oturum isteği başarısız. Lütfen giriş yapınız.'));
            this.actionLogout();
        }
        // Refresh the token if set in response
        if (this.last_response.header.token) {
            this.setToken(this.last_response.header.token);
        }
        if (this.last_response.header.result_code != 1) {
            this.displayMessage(this.last_response.header.result_message);
        }
        // Redirect view if set in response
        if (this.last_response.header.redirect) {
            return this.run(this.last_response.header.redirect);
        }
        // 
    }
    

    actionCheckAuth() {
        let token = this.getToken();
        if (this.getToken() === null || this.getToken() === 'undefined')
        {
            return false;
        }
        return true;
    }

    actionLogout() {
        this.deleteLocal('token');
        return this.run('login');
    }

    viewlogin() {
        this.loadTemplate('pages/login', 'main_body', 'renderLogin');
    }
    
    renderLogin(){
        $("#login_phone").val(this.getFromLocal('user_info_login_phone'));
    }

    actionLogin() {
        this.saveToLocal('user_info_login_phone', $("input#login_phone").val());
        ac.clearAuthParams();
        ac.setAuthParam('phone', $("input#login_phone").val());
        ac.setAuthParam('password', $("input#login_password").val());
        ac.setCallAction('gettoken');
        ac.callApi();
        return;
    }

    getToken() {
        return this.getFromLocal('token');
    }

    setToken(token) {
        this.saveToLocal('token', token);
        return this.ac.setAuthParam('token', token);
    }
    
    renderAlertPage(data){
        if(data.header){
            $("#alert_view_header").html(data.header);
        }
        if(data.body ){
            $("#alert_view_body").html(data.body);
        }
    }


    viewdashboard() {
        this.loadTemplate('pages/dashboard', 'main_body', 'renderDashboard');
    }

    renderDashboard() {
        $("span#userinfo_name").html(
                this.getFromLocal('user_info_firstname')
                + " " + this.getFromLocal('user_info_lastname')
                );
    }

    viewregister() {
        this.loadTemplate('pages/register', 'main_body');
    }
    
    viewregistercustomer(){
        this.loadTemplate('pages/registercustomer', 'main_body');
    }
    
    handleRegisterCustomer(){
        // TODO //
        let phone = $("input#phone").val();
        let email = $("input#email").val();
        
        this.saveToLocal('registercustomerdata',
        {
            phone: phone,
            email: email
        });
        let data = {
            header : 'Özür Dileriz.',
            body : 'Şu an başvurunuzu kayıt edemiyoruz. <br/>Başvurunuz için lütfen daha sonra tekrar deneyiniz.'
        };
        this.loadTemplate('pages/warning', 'main_body', 'renderAlertPage', data);
                
    }
    
    handleRegisterNewCustomer(){
        
        //TODO //
        let data = {
            header : 'Teşekkürler!',
            body : 'Başvurunuz kayıt edilmiştir. <br/> Müşteri temsilcimiz en kısa sürede sizinle temasa geçecektir.\n\
            <br/> Başvurunuz ile ilgili gelişmeleri size SMS ve E-posta ile bildireceğiz.'
        };
        this.loadTemplate('pages/info', 'main_body', 'renderAlertPage', data);
        
    }
    
    viewmodalexternal(url, header = false, footer = false){
        $("#main_modal_body").load(url);
        if(header){
            $("#main_modal_header").html(header).show();
        }
        else{
            $("#main_modal_header").hide(); 
        }
        if(footer){
            $("#main_modal_footer").html(footer).show();
        }
        else{
            $("#main_modal_footer").hide(); 
        }
        $("#main_modal").modal();
    }
    
    viewmodal(content, header = false, footer = false){
        
    }
    
    displayError(message) {
        this.loadTemplate('pages/error', 'main_body', 'renderError', message);
    }

    renderError(message) {
        $("div#error_container").html(message);
    }

    displayMessage(message) {
        console.log("error message "+ message);
        this.loadTemplate('pages/errormessage', 'main_messages', 'renderMessage', message);
    }

    renderMessage(message) {
        $("div#error_container").append(message);
        $("div#main_messages").show();
    }

    viewcc_form() {
        this.loadTemplate('pages/cc_form', 'main_body');
    }

    viewsend_email() {
        this.loadTemplate('pages/send_email', 'main_body');
    }

    viewqr_generate() {
        this.loadTemplate('pages/qr_generate', 'main_body');
    }
    
    viewregisternewcustomer(){
        this.loadTemplate('pages/registernewcustomer', 'main_body');
    }

    loadTemplate(template, to = 'main', callback = false, data = false) {

        this.arrba.push(template)
        
        if (!callback) {
            $("#" + to + "").load(template + '.html');
        } else {
            $("#" + to + "").load(template + '.html', function () {
                if (typeof app[callback] === "function") {
                    app[callback](data);
                }
            });
        }
    }

    backButton(){
       this.loadTemplate(this.arrba[this.arrba.length-2],'main_body')
    }

// codes inside this function will be changed depending on the app platform
// currently it is saving to browser local storage
    saveToLocal(key, value) {
        return localStorage.setItem(key, value);
    }

// codes inside this function will be changed depending on the app platform
// currently it is deleting to browser local storage by key
    deleteLocal(key) {
        return localStorage.removeItem(key);
    }

// codes inside this function will be changed depending on the app platform
// currently it is saving to browser local storage
    getFromLocal(key) {
        return localStorage.getItem(key);
    }

// codes inside this function will be changed depending on the app platform
    redirect(action) {

        $("select#function").val(action);
        $("select#function").change();
    }

    // Language translate 
    // To-Do 
    l(text) {
        return text;
    }

    getFormPostData(form) {
        let jsonObject = {};
        let formData = new FormData(form);
        for (let field of formData) {
            jsonObject[field[0]] = field[1];
        }
        return jsonObject;
    }

}


$(document).ready(function () {
    return;
    $("form#call").submit(function (event) {
//ac.clearParams();
        event.preventDefault();
        let action = $("form#call").find("input.actionname").val()
        ac.setCallAction(action);
        // For not logged in so no  token call
        if (action === 'gettoken') {
            ac.clearAuthParams();
            ac.setAuthParam('phone', $('input#phone').val());
            ac.setAuthParam('password', $('input#password').val());
            ac.callApi();
            return;
        }
// Every other actions will go with the token
        else {
            ac.setRequestData(getFormPostData(document.getElementById('call')));
        }

        ac.callApi();
        if (ac.last_response.header.redirect) {
            redirect(ac.last_response.header.redirect);
        }
    });
    $("select#function").change(function () {
        let form_id = $(this).val();
        $("form#call").html($("fieldset#" + form_id).html());
        if (form_id == 'dashboard') {
            $("span#userinfo_name").html(getFromLocal('user_info_firstname') + ' ' + getFromLocal('user_info_lastname'));
        }
    });
    $("select#function").val('gettoken');
    $("select#function").change();
});