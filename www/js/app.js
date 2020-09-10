/* global ac, app */

class EmlakPosApp {
    constructor() {
        this.uploadedfiles = new Array();
        this.default_view = 'dashboard';
        this.view = null;
        this.last_view = null;

        this.lang = 'tr';
        this.render_params = {};
        this.template = '';

        this.isActive = true;
        this.smsValidate = true;

        this.ac = new EmlakPosApiClient();

        this.last_response = {};
        this.message = null;
        this.pagesHistory = new Array();
        this.formDataArr = new Array();
        this.public_pages = [
            'register',
            'registercustomer',
            'registercustomersms',
            'registercustomercontact',
            'registercustomercompany',
            'registercustomerfiles',
            'registernewcustomercomplete',
            'registernewcustomersuccess',
            'login',
            //            'registercustomer_attn',
            //            'registercustomer_comp',
            //            'registercustomer_docs',
            'registernewcustomer',
            'registernewcompany',
            'resetpassword',
            'error'
        ];
        this.back_buttonDisplay = [
            'login',
            'dashboard',
        ]
        this.defines = {
            external_content: {
                tos: 'http://localhost/wtf/apps/static/apiclient/pages/static/tos.html'
            }
        };
    }

    init() {
        if (this.getToken() !== null) {
            this.setToken(this.getToken());
            return this.loginControl()
        }
        return this.run('login');
    }

    run(view) {
        this.view = view;
        console.log("App::run(" + view + ")");
        $("div#main_messages").hide();

        this.back_buttonDisplay.includes(view) ? $("#back_button").hide() : $("#back_button").show();
        this.pagesHistory.includes(view) ? null : this.pagesHistory.push(view)

        if (!this.actionCheckAuth()) { // user logged in ?
            if (this.public_pages.indexOf(view) === -1) { // is the view public or requires to be logged 
                this.viewlogin();
                return this.displayMessage(this.l('Lütfen giriş yapınız.'));

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
        $("div#main_messages").hide();
        console.log('handling response');
        this.last_response = response;
        // Refresh the token if set in response
        if (this.last_response.header.token) {
            this.setToken(this.last_response.header.token);
        }

        if (this.last_response.header.result_code != 1) {
            this.displayMessage(this.last_response.header.result_message + " (" + this.last_response.header.result_code + ')');
        }
        // Redirect view if set in response
        if (this.last_response.header.redirect) {
            return this.loginControl();
            // console.log("Redirecting " + this.last_response.header.redirect)
            // this.run(this.last_response.header.redirect);
        }

    }

    actionCheckAuth() {
        let token = this.getToken();
        if (this.getToken() === null || this.getToken() === 'undefined') {
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

    renderLogin() {
        $("#login_phone").val(this.getFromLocal('user_info_login_phone'));
    }

    actionLogin() {
        this.saveToLocal('user_info_login_phone', $("input#login_phone").val());
        ac.clearHeadParams();
        ac.setHeadParam('phone', $("input#login_phone").val());
        ac.setHeadParam('password', $("input#login_password").val());
        ac.setCallAction('apitoken/gettoken');
        ac.callApi();
        return;
    }

    getToken() {
        return this.getFromLocal('token');
    }

    setToken(token) {
        this.saveToLocal('token', token);
        return this.ac.setHeadParam('token', token);
    }

    renderAlertPage(data) {
        if (data.header) {
            $("#alert_view_header").html(data.header);
        }
        if (data.body) {
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

    viewmodalexternal(url, header = false, footer = false) {
        $("#main_modal_body").load(url);
        if (header) {
            $("#main_modal_header").html(header).show();
        } else {
            $("#main_modal_header").hide();
        }
        if (footer) {
            $("#main_modal_footer").html(footer).show();
        } else {
            $("#main_modal_footer").hide();
        }
        $("#main_modal").modal();
    }

    viewmodal(content, header = false, footer = false) {
        $("#main_modal_body").html(content).show();
        if (header) {
            $("#main_modal_header").html(header).show();
        }
        else {
            $("#main_modal_header").hide();
        }
        if (footer) {
            $("#main_modal_footer").html(footer).show();
        }
        else {
            $("#main_modal_footer").hide();
        }
        $("#main_modal").modal();
    }

    displayError(message) {
        this.loadTemplate('pages/informationpages/error', 'main_body', 'renderError', message);
    }

    popupError(message, status) {
        document.getElementById("status_es").innerHTML = `
        <div style="background:${status ? "green" : "red"}; text-align:center;">
        <img src="img/icons/exclamation-diamond-fill.svg" class="bicon fullpage_alert_icon" id="fullpage_alert_icon">
        <h5 style="color: #fff;" id="alert_view_header">${message}</h5>
        </div>`
        setTimeout(() => {
            document.getElementById("status_es").innerHTML = ""
        }, 3000);
    }

    renderError(message) {
        $("div#error_container").html(message);
    }

    displayMessage(message) {
        console.log("error message " + message);
        this.loadTemplate('pages/informationpages/errormessage', 'main_messages', 'renderMessage', message);
    }

    renderMessage(message) {
        $("div#error_container").append(message);
        $("div#main_messages").show();
    }

    viewnewpayment() {
        this.loadTemplate('pages/dashboard/payment/newpayment', 'main_body');
    }

    viewnewpayment_options() {
        this.loadTemplate('pages/dashboard/payment/newpayment_options', 'main_body');
    }

    viewcc_form() {
        this.loadTemplate('pages/dashboard/payment/cc_form', 'main_body');
    }

    viewsend_email() {
        this.loadTemplate('pages/dashboard/payment/paymentoptions/send_email', 'main_body');
    }

    viewsend_sms() {
        this.loadTemplate('pages/dashboard/payment/paymentoptions/send_sms', 'main_body');
    }

    viewqr_generate() {
        this.loadTemplate('pages/dashboard/payment/paymentoptions/qr_generate', 'main_body');
    }

    viewregister() {
        this.loadTemplate('pages/register/register', 'main_body');
    }

    viewregistercustomer() {
        this.loadTemplate('pages/register/registercustomer', 'main_body');
    }

    viewregisternewcustomer() {
        this.loadTemplate('pages/register/registernewcustomer', 'main_body');
    }

    viewregisternewcustomerauth() {
        this.loadTemplate('pages/register/registernewcustomerauth', 'main_body');
    }

    viewregisternewcompany() {
        this.loadTemplate('pages/register/registernewcompany', 'main_body');
    }

    viewlisttransactions() {
        this.loadTemplate('pages/dashboard/listtransactions', 'main_body');
    }

    viewsmsvalidation() {
        this.loadTemplate('pages/smsvalidation', 'main_body');
    }

    viewcashupz() {
        this.loadTemplate('pages/dashboard/cashupz', 'main_body');
    }

    viewusermanagement() {
        this.loadTemplate('pages/dashboard/usermanagement', 'main_body');
    }

    viewresetpassword() {
        this.loadTemplate('pages/register/resetpassword', 'main_body');
    }

    loadTemplate(template, to = 'main', callback = false, data = false) {
        console.log(this.pagesHistory)
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



    backButton() {
        this.run(this.pagesHistory[this.pagesHistory.length - 2])
        this.pagesHistory.splice(this.pagesHistory.length - 1, 1)
    }

    formControl(id, page) {
        let elements = document.getElementById(id);
        let input = elements.getElementsByTagName("input");


        for (let index = 0; index < input.length; index++) {

            if (!input[index].value) {
                this.popupError("Lütfen girdiğiniz bilgileri kontrol ediniz.", false)
                return;
            }

            this.formDataArr[input[index].name] = input[index].value;
            this.run(page);
            console.log(this.formDataArr);
        }
    }

    smsValidation() {
        // It will be arranged to communicate with the api
        if ($("#sms_code").val() == 123456) {
            this.smsValidate = true;
            return this.init();
        }
    }

    loginControl() {
        if (!this.isActive) {
            return this.run('warning')
        } else if (!this.smsValidate) {
            return this.run('smsvalidation')
        } else {
            return this.run('dashboard');
        }
    }


    /* START resigterCustomer "I'm a customer flow" */

    actionRegisterCustomer() {
        if (!ev.email("input#customer_email"))
            return this.displayMessage('E-posta adresinizi kontrol ediniz.');
        if (!ev.mobilephone("input#customer_phone"))
            return this.displayMessage('Cep telefonunuzu kontrol ediniz.');
        if (!ev.mobilephone("input#customer_phone"))
            return this.displayMessage('Cep telefonunuzu kontrol ediniz.');
        if (!$("#checkbox_tos").prop("checked"))
            return this.displayMessage('Devam etmek için Kullanıcı sözleşmesini okuyup onaylamalısınız.');
        if (!$("#checkbox_kvkk").prop("checked"))
            return this.displayMessage('Devam etmek için KVKK Aydınlatma Metinini okuyup onaylamalısınız.');
        if (!$("#checkbox_kvkk2").prop("checked"))
            return this.displayMessage('Devam etmek için KVKK Açık Rıza Sözleşmesini okuyup onaylamalısınız.');
        if (!$("#checkbox_pfc").prop("checked"))
            return this.displayMessage('Devam etmek için Çerçeve Sözleşmesini okuyup onaylamalısınız.');

        $("div#main_messages").hide();

        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('phone', $("input#customer_phone").val());
        ac.setRequestDataParam('email', $("input#customer_email").val());
        ac.setRequestDataParam('cid', $("input#customer_cid").val());
        if (!$("#checkbox_pfc").prop("checked")) {
            ac.setRequestDataParam('subscribe', 1);
        }
        ac.setCallAction('application/prevalidatecustomer');
        ac.callApi('handleRegisterCustomer');
    }

    handleRegisterCustomer(data) {
        if (data.header.result_code == 1 && data.data.id_application) {
            this.saveToLocal('id_application', data.data.id_application);
            this.saveToLocal('application_status', data.data.application_status);
            this.saveToLocal('application_key', data.data.application_key);
        }
        return this.handleResponse(data);
    }

    actionAddContact() {
        $("div#main_messages").hide();
        if ($("input#customer_firstname").val().length < 3)
            return this.displayMessage('Adınızı kontrol ediniz.');
        if ($("input#customer_lastname").val().length < 3)
            return this.displayMessage('Soyadınızı kontrol ediniz.');
        if ($("input#customer_identification").val().length !== 11)
            return this.displayMessage('Kimlik numaranızı kontrol ediniz.');

        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('firstname', $("input#customer_firstname").val());
        ac.setRequestDataParam('lastname', $("input#customer_lastname").val());
        ac.setRequestDataParam('identification', $("input#customer_identification").val());
        ac.setRequestDataParam('birthday', $("input#customer_birthday").val());
        ac.setCallAction('application/addcontact');
        ac.callApi();

    }

    actionAddCompany() {
        $("div#main_messages").hide();
        if ($("input#customer_company").val().length < 3)
            return this.displayMessage('İşyeri ünvanınızı kontrol ediniz.');

        if ($("select#customer_city").val().length < 3)
            return this.displayMessage('Şehir bilgisini kontrol ediniz.');

        if ($("select#customer_town").val().length < 3)
            return this.displayMessage('İlçe bilgisini kontrol ediniz.');

        if ($("select#customer_address").val() === null)
            return this.displayMessage('Adresinizi kontrol ediniz.');

        if ($("select#customer_iban").val() === null)
            return this.displayMessage('Hesap numarasını kontrol ediniz.');

        if ($("input#customer_tax_info_office").val().length < 3)
            return this.displayMessage('Vergi dairesini kontrol ediniz.');

        if ($("input#customer_tax_info_id").val().length !== 10)
            return this.displayMessage('Vergi numarasını kontrol ediniz.');

        if (!$("select#customer_mcc").val() === null)
            return this.displayMessage('Kategori kodunuzu kontrol ediniz.');

        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));

        ac.setRequestDataParam('company', $("input#customer_company").val());
        ac.setRequestDataParam('city', $("select#customer_city").val());
        ac.setRequestDataParam('town', $("select#customer_town").val());
        ac.setRequestDataParam('address', $("select#customer_address").val());
        ac.setRequestDataParam('iban', $("select#customer_iban").val());
        ac.setRequestDataParam('tax_info_office', $("input#customer_tax_info_office").val());
        ac.setRequestDataParam('tax_info_id', $("input#customer_tax_info_id").val());
        ac.setRequestDataParam('mcc', $("select#customer_mcc").val());

        ac.setCallAction('application/addcompany');
        ac.callApi();

    }

    viewregistercustomerfiles() {
        this.loadTemplate('pages/register/registercustomerfiles', 'main_body');
    }

    actionRegisterCustomerFiles() {
        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));

        ac.setRequestDataParam('file_vergi', JSON.stringify(this.uploadedfiles.file_vergi));
        ac.setRequestDataParam('file_imza', JSON.stringify(this.uploadedfiles.file_imza));
        ac.setRequestDataParam('file_kimlik', JSON.stringify(this.uploadedfiles.file_kimlik));

        ac.setCallAction('application/addfiles');
        ac.callApi();

    }


    readfilecontent(file_id, file_name = "vergi") {
        $("div#main_messages").hide();
        console.log(file_id + " is reading !");
        let current_file = document.querySelector("#" + file_id).files[0];
        let reader = (new FileReader());

        reader.onload = function () {
            app.setFile(file_id, reader.result, file_name);
        };

        if (current_file) {
            reader.readAsDataURL(current_file);
        } else {
            return this.displayMessage(file_name + ' dosyasını kontrol ediniz.');
        }
    }

    setFile(file_id, context, file_name) {
        let file = document.querySelector("#" + file_id).files[0];
        if (!file) {
            return this.displayMessage(file_name + ' dosyası hatalı.');
        }
        if (file.size > 1000000) {
            return this.displayMessage(file_name + ' dosyası çok büyük.');
        }
        this.uploadedfiles[file_id] = {
            name: file.name,
            type: file.type,
            size: file.size,
            file_context: context
        };
        $("#" + file_id + "_info").text(file.name);

    }

    viewregistercustomercontact() {
        this.loadTemplate('pages/register/registercustomercontact', 'main_body');
    }

    viewregistercustomersms() {
        this.loadTemplate('pages/register/registercustomersms', 'main_body', 'setsmscounter');
    }

    setsmscounter() {
        $('#validatesms').attr("disabled", false);
        $('#validatesms').removeClass("disabled");

        $('#resendsms').attr("disabled", true);
        $('#resendsms').addClass("disabled");
        $("#countdown").countdown360({
            radius: 45,
            seconds: 180,
            fontColor: '#003b65',
            autostart: false,
            onComplete: function () {
                $('#validatesms').attr("disabled", true);
                $('#validatesms').addClass("disabled");

                $('#resendsms').attr("disabled", false);
                $('#resendsms').removeClass("disabled");
            }
        }).start()
    }

    /* START RegisterNewCustomer I want to be a customer  */

    actionRegisterNewCustomer() {
        if (!ev.mobilephone("input#registernewcustomer_phone"))
            return this.displayMessage('Lütfen cep telefonunuzu başında sıfır ile doğru girdiğinizden emin olunuz. ');
        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('phone', $("input#registernewcustomer_phone").val());
        ac.setCallAction('application/prevalidatenewcustomer');
        ac.callApi('handleRegisterNewCustomer');
    }

    handleRegisterNewCustomer(data) {
        if (data.header.result_code == 1 && data.data.id_application) {
            this.saveToLocal('id_application', data.data.id_application);
            this.saveToLocal('application_status', data.data.application_status);
            this.saveToLocal('application_key', data.data.application_key);
        }
        return this.handleResponse(data);
    }

    viewregisternewcustomersms() {
        this.loadTemplate('pages/register/registercustomersms', 'main_body');
    }

    actionRegisterCustomerSmsRequest() {
        $("div#main_messages").hide();
        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setCallAction('application/requestsms');
        ac.callApi('handleRegisterCustomerSmsRequest');
    }

    handleRegisterCustomerSmsRequest(data) {
        if (data.header.result_code == 1) {
            this.setsmscounter();
        }
        return this.handleResponse(data);
    }

    actionRegisterCustomerSmsValidate() {
        $("div#main_messages").hide();
        if ($("input#registercustomersmscode").val().length !== 6)
            return this.displayMessage('SMS doğrulama kodunu kontrol ediniz.');

        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('sms_code', $("input#registercustomersmscode").val());
        ac.setCallAction('application/validatesms');
        ac.callApi('handleRegisterCustomerSmsValidate');
    }

    handleRegisterCustomerSmsValidate(data) {
        if (data.header.result_code == 1 && data.data.application_status) {
            this.saveToLocal('application_status', data.data.application_status);
        }
        return this.handleResponse(data);
    }

    viewregisternewcustomercomplete() {
        this.loadTemplate('pages/register/registernewcustomercomplete', 'main_body');
    }

    actionRegisterNewCustomerComplete() {
        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('cid', $("input#registernewcustomer_cid").val());
        ac.setRequestDataParam('email', $("input#registernewcustomer_email").val());
        ac.setRequestDataParam('firstname', $("input#registernewcustomer_firstname").val());
        ac.setRequestDataParam('lastname', $("input#registernewcustomer_lastname").val());
        ac.setRequestDataParam('company', $("input#registernewcustomer_company").val());
        ac.setRequestDataParam('city', $("select#registernewcustomer_city").val());
        ac.setRequestDataParam('address', $("select#registernewcustomer_address").val());
        ac.setCallAction('application/completenewcustomer');
        ac.callApi();
    }

    viewregisternewcustomersuccess() {
        this.loadTemplate('pages/register/registernewcustomersuccess', 'main_body');
    }

    /* END RegisterNewCustomer I want to be a customer  */

    loadTemplate(template, to = 'main', callback = false, data = false) {
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
