/* global ac, app, ev, cart */

class EmlakPosApp {
    constructor() {
        this.uploadedfiles = new Array();
        this.default_view = 'dashboard';
        this.view = null;
        this.last_views = new Array();
        this.min_amount = 5.00;

        this.lang = 'tr';
        this.render_params = {};
        this.template = '';

        this.ac = new EmlakPosApiClient();

        this.last_response = {};
        this.message_to_display = null;
        this.arrba = new Array();
        this.formDataArr = new Array();
        this.public_pages = [
            'register',
            'cancelregister',
            'registercustomer',
            'registercustomersms',
            'registercustomercontact',
            'registercustomercompany',
            'registercustomerfiles',
            'registernewcustomercomplete',
            'registernewcustomersuccess',
            'recoverapplication',
            'login',
            //'registercustomer_attn',
            //'registercustomer_comp',
            //'registercustomer_docs',
            'registernewcustomer',
            'registernewcompany',
            'error'
        ];
        this.pagesHistory = new Array();
        this.application_remaining_files = [
            {id: "61", name: "Kimlik Fotokopisi"},
            {id: "63", name: "İmza Sirküleri"},
            {id: "69", name: "Vergi Levhası"}
        ];
        this.back_buttonDisplay = [
            'login',
            'dashboard'
        ];

        this.cdn_url = 'https://mobilapi.eticsoft.net/static/cdn/';

        this.defines = {
            external_content: {
                pos: this.cdn_url + 'pos.html',
                kvkk: this.cdn_url + 'kvkk.html',
                kvkk2: this.cdn_url + 'kvkk2.html'
            }
        };
        this.quickPros = [];
        this.installments = [];
        // document.addEventListener("backbutton", leavePage, false);
    }

    init() {
        if (!this.getFromLocal('quick_products')) {
            this.createQuickProducts();
            this.saveToLocal('tax_rate', 0.18);
        }
        if (!this.getFromLocal('installments')) {
            this.createInstallments();
        }
        if (!this.getFromLocal('main_product_name')) {
            this.saveToLocal('main_product_name', 'Ürün');
        }
        this.quickPros = JSON.parse(this.getFromLocal('quick_products'));
        this.installments = JSON.parse(this.getFromLocal('installments'));

        if (this.getToken() !== null) {
            this.setToken(this.getToken());
            return this.run('dashboard');
        }
        return this.run('login');
    }

    createQuickProducts() {
        let quickPros = [];
        quickPros.push(new PosCartItem('Ürün A', 50));
        quickPros.push(new PosCartItem('Ürün B', 100));
        quickPros.push(new PosCartItem('Hizmet C', 200));
        quickPros.push(new PosCartItem('Hizmet D', 500));
        this.saveToLocal('quick_products', JSON.stringify(quickPros));
    }

    createInstallments() {
        let installments = [];
        let i;
        for (i = 2; i <= 12; i++) {
            installments.push(new Installment(i, i * 1.8, i * 2.0));
        }
        this.saveToLocal('installments', JSON.stringify(installments));

    }

    run(view) {
        this.view = view;
        $('body#eticsoft_body').removeClass();
        console.log("App::run(" + view + ")");
        $("div#main_messages").hide();


        if (!this.actionCheckAuth()) { // user logged in ?
            if (this.public_pages.indexOf(view) === -1) { // is the view public or requires to be logged 
                this.viewlogin();
                return this.displayMessage(this.l('Lütfen giriş yapınız.'));
            }
        }
        let view_name = 'view' + view;
        if (typeof this[view_name] === "function") {
            console.log(view + " called");
            if (this.public_pages.indexOf(view) !== -1) { // is the view public or requires to be logged 
                $('#login_logo').show();
                $('#login_logo').css('height', '150px');
                $(".footer, .login_menu").hide();
                $('body').css('margin-bottom', "0");
                $('#main_cover').css('padding-top', "0");
            } else {
                $(".footer, .login_menu").show();
                $('#login_logo').hide();
                $('#main_cover').css('padding-bottom', "70px");
                $('#main_cover').css('padding-top', "50px");
            }

            if (this.message_to_display !== null) {
                this.displayMessage(this.message_to_display.message, this.message_to_display.type);
                this.message_to_display = null;
            }
            $('body#eticsoft_body').addClass(view_name);
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

        if (this.last_response.header.result_code !== 1) {
            console.log("header.result_message");
            this.message_to_display = {message: this.last_response.header.result_message + " (" + this.last_response.header.result_code + ')', type: 'danger'};
        }
        if (typeof this.last_response.header.display_message !== 'undefined' && $.isEmptyObject((this.last_response.header.display_message)) !== true) {
            console.log("header.display_message");
            this.message_to_display = {message: this.last_response.header.display_message.message, type: this.last_response.header.display_message.type};
        }

        // this.displayMessage(this.last_response.header.result_message + " (" + this.last_response.header.result_code + ')');

        // Redirect action if set in response
        if (this.last_response.header.redirect_action) {
            let action = this.last_response.header.redirect_action;
            if (typeof this[action] === "function") {
                console.log("Redirect Action " + this.last_response.header.redirect_action);
                return this[action]();
            }
        }
        // Redirect view if set in response
        if (this.last_response.header.redirect) {
            console.log("Redirecting " + this.last_response.header.redirect);
            return this.run(this.last_response.header.redirect);
        }
        if (this.message_to_display !== null) {
            this.displayMessage(this.message_to_display.message, this.message_to_display.type);
            this.message_to_display = null;
        }
    }

    clearApiParams() {
        ac.clearHeadParams();
        ac.clearRequestParams();
        ac.setHeadParam('token', this.getFromLocal('token'));
        ac.setHeadParam('phone', this.getFromLocal('user_info_login_phone'));
        return;
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
        if (this.getFromLocal('user_info_firstname')) {
            $("#login_phone").val(this.getFromLocal('user_info_login_phone'));
            $("#logged_before_company").html(this.getFromLocal('user_info_firstname') + this.getFromLocal('user_info_lastname')).fadeIn(500);
        }
        $("#login_logo").animate({height: 250}, 500);
    }

    actionLogin() {
        $("#login_logo").animate({height: 150}, 200);
        this.saveToLocal('user_info_login_phone', $("input#login_phone").val());
        this.clearApiParams();
        ac.setHeadParam('phone', $("input#login_phone").val());
        ac.setHeadParam('password', $("input#login_password").val());
        ac.setCallAction('accesstoken/gettoken');
        ac.callApi('actionHandleLogin');
        return;
    }

    actionHandleLogin(data) {
        if (typeof data.data.user_info !== 'undefined') {
            this.saveToLocal('user_info_firstname', data.data.user_info.firstname);
            this.saveToLocal('user_info_lastname', data.data.user_info.lastname);
            this.saveToLocal('profile_level', data.data.user_info.profile_level);
        }
        return this.handleResponse(data);
    }

    getToken() {
        return this.getFromLocal('token');
    }

    setToken(token) {
        this.saveToLocal('token', token);
        return ac.setHeadParam('token', token);
    }

    renderAlertPage(message) {
        console.log(message);
        if (typeof message.header !== 'undefined') {
            $("h2#alert_view_header").html(message.header);
            $("div#alert_view_body").html(message.body);
        } else {
            $("div#alert_view_body").html(message);
        }

    }

    viewdashboard() {
        this.loadTemplate('pages/dashboard', 'main_body', 'renderDashboard');
        if (this.getFromLocal('daily_total_noft') === null || this.getFromLocal('daily_stats_update') === null
                || parseInt(this.getFromLocal('daily_stats_update')) + (1000 * 30) < Date.now()) {
            this.actiongetsummary();
        }
    }

    renderDashboard() {
        $("span#userinfo_name").html(
                this.getFromLocal('user_info_firstname')
                + " " + this.getFromLocal('user_info_lastname')
                );

        $("#daily_total_noft").text(this.getFromLocal('daily_total_noft'));

        $("#daily_total_noft").prop('Counter', 0).animate({
            Counter: this.getFromLocal('daily_total_noft')
        }, {
            duration: 1000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
        $("#daily_total_amount").prop('Counter', 0.00).animate({
            Counter: parseFloat((this.getFromLocal('daily_total_amount')).replace(/[^0-9]./g, ''))
        }, {
            duration: 1000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now).toFixed(2));
            },
            complete: function () {
                $("#daily_total_amount").html(app.getFromLocal('daily_total_amount') + ' ₺');
            }
        });
        return;
    }

    actiongetsummary() {
        this.clearApiParams();
        ac.setCallAction('store/dailysummary');
        ac.callApi('handleDailySummary');
    }

    handleDailySummary(data) {
        if (data.header.result_code === 1) {
            this.saveToLocal('daily_total_noft', data.data.total_noft);
            this.saveToLocal('daily_total_amount', data.data.total_amount);
            this.saveToLocal('daily_stats_update', Date.now());
            this.renderDashboard();
        }
        return this.handleResponse(data);

    }

    viewrenewpassword() {
        this.loadTemplate('pages/user/renewpassword', 'main_body', 'renderusermenu');

    }

    viewusermenu() {
        this.loadTemplate('pages/user/user_menu', 'main_body', 'renderusermenu');
    }

    renderusermenu() {

    }

    actionuserlist() {
        if (this.getFromLocal('profile_level') !== 'master')
            return this.displayMessage('Bu işlemi yapmaya yetkiniz yok.');

        this.clearApiParams();
        ac.setCallAction('user/list');
        ac.callApi();

    }

    viewuserlist() {
        this.loadTemplate('pages/user/userlist', 'main_body', 'renderuserlist');
    }

    renderuserlist() {
        $('div#userlist').html(" ");
        $.each(app.last_response.data, function (key, user) {
            let row = '<div class="row no-gutters">'
                    + '<div class="col-3">' + user.user_level + ' #' + (user.rel_object_id) + '</div>'
                    + '<div class="col-7"> ' + user.firstname + ' ' + user.lastname + '</div>'
                    + '<div class="col-2">'
                    + '<button onclick="app.actionUserDetails(\'' + user.id + '\')" class="btn btn-info btn-sm" >Detay</button>'
                    + '</div></div>';
            $('div#userlist').append(row);
        }, this);

    }

    getUserBadge(level) {
        if (level === 'pos') {
            return 'Pos Kullanıcısı';
        }
    }

    actionUserDetails(id) {
        this.clearApiParams();
        ac.setRequestDataParam('hash', id);
        ac.setCallAction('user/getuser');
        ac.callApi();
    }

    viewuserprofile() {
        this.loadTemplate('pages/user/profile', 'main_body', 'renderuserprofile');
    }

    renderuserprofile() {
        $('#userdetails').html(" ");
        let user = app.last_response.data;
        $('#block_title').html(user.firstname + ' ' + user.lastname);
        $('#title').html(app.getUserBadge(user.rel_object));
        $('#userdetails').append('<tr><td>Telefon</td><td>' + user.phone + '</td></tr>');
        $('#userdetails').append('<tr><td>Email</td><td>' + user.email + '</td></tr>');
        $('#userdetails').append('<tr><td>Oluşturma</td><td>' + user.date_create + '</td></tr>');
        if (app.getFromLocal('user_info_login_phone') === user.phone) {
            $('#updateuserprofilebutton').attr('disabled', '1');
        } else {
            $('#updateuserprofilebutton').removeAttr('disabled');
        }
    }

    viewupdateuserprofile() {
        this.loadTemplate('pages/user/userprofileupdate', 'main_body', 'renderupdateuserprofile');
    }

    renderupdateuserprofile() {
        $('#userdetails').html(" ");
        if( typeof app.last_response.data === 'undefined' ){
            return this.displayError('Kullanıcı işleminde bir hata oldu. Lütfen tekrar deneyiniz.');
        }
        let user = app.last_response.data;
        $('#firstname').val(user.firstname);
        $('#lastname').val(user.lastname);
        $('#mobile').val(user.phone);
        $('#email').val(user.email);
        $('#userprofile_id').val(user.id);
    }

    actionUserProfileUpdate() {
        let user = app.last_response.data;

        if (!ev.name('#firstname'))
            return this.displayMessage('Lütfen kullanıcının adını doğru girdiğinizden emin olunuz. ');
        if (!ev.name('#lastname'))
            return this.displayMessage('Lütfen kullanıcının soyadını doğru girdiğinizden emin olunuz. ');
        if (!ev.mobilephone('#mobile'))
            return this.displayMessage('Telefon numarasını doğru girdiğinizden emin olunuz. ');
        if (!ev.email('#email'))
            return this.displayMessage('Lütfen e-posta adresinizi doğru girdiğinizden emin olunuz. ');
        if ($('#new_password').val() !== "") {
            if (($('#new_password').val()).length !== 6)
                return this.displayMessage('Şifreyi doğru girdiğinizden emin olunuz. ');
        }

        ac.setRequestDataParam('firstname', $('#firstname').val());
        ac.setRequestDataParam('lastname', $('#lastname').val());
        ac.setRequestDataParam('mobile', $('#mobile').val());
        ac.setRequestDataParam('email', $('#email').val());
        ac.setRequestDataParam('id', $('#userprofile_id').val());
        ac.setRequestDataParam('password', $('#new_password').val());
        ac.setCallAction('user/updatesubuser');
        ac.callApi();


    }

    viewuserprofileCreate() {
        this.loadTemplate('pages/user/userprofilecreate', 'main_body');
    }

    actionUserProfileCreate() {
        if (!ev.name('#firstname'))
            return this.displayMessage('Lütfen kullanıcının adını doğru girdiğinizden emin olunuz. ');
        if (!ev.name('#lastname'))
            return this.displayMessage('Lütfen kullanıcının soyadını doğru girdiğinizden emin olunuz. ');
        if (!ev.mobilephone('#mobile'))
            return this.displayMessage('Telefon numarasını doğru girdiğinizden emin olunuz. ');
        if (!ev.email('#email'))
            return this.displayMessage('Lütfen e-posta adresinizi doğru girdiğinizden emin olunuz. ');
        if (($('#password').val()).length !== 6)
            return this.displayMessage('Geçici şifrenizi doğru girdiğinizden emin olunuz. ');

        ac.setRequestDataParam('firstname', $('#firstname').val());
        ac.setRequestDataParam('lastname', $('#lastname').val());
        ac.setRequestDataParam('mobile', $('#mobile').val());
        ac.setRequestDataParam('email', $('#email').val());
        ac.setRequestDataParam('password', $('#password').val());
        ac.setCallAction('user/addsubuser');
        ac.callApi();


    }

    viewresetpassword() {
        this.loadTemplate('pages/user/resetpassword', 'main_body', 'renderusermenu');
    }

    forceresetpassword() {
        this.loadTemplate('pages/user/resetpassword', 'main_body');
        $("footer").hide();
        $(".header_menu").hide();
        this.displayMessage('Güvenliğiniz için şifrenizi yenilemeniz gerekmektedir. Lütfen yeni bir şifre belirleyiniz.', 'info');
    }

    forceloginotp() {
        this.loadTemplate('pages/user/smsotp', 'main_body', 'setsmscounter');
        $("footer").hide();
        $(".header_menu").hide();
        this.displayMessage('Güvenliğiniz cep telefonunuza gönderilen tek kullanımlık giriş kodunu giriniz.', 'info');
    }

    actionLoginOtp() {

    }

    actionRequestOtp() {

    }

    actionresetpassword() {
        if (!$('#current_password').val() || ($('#current_password').val()).length !== 6)
            return this.displayMessage('Mevcut şifrenizi kontrol ediniz');
        if (!$('#new_password').val() || ($('#new_password').val()).length !== 6)
            return this.displayMessage('Yeni şifrenizi kontrol ediniz');
        if ($('#new_password').val() !== $('#new_password_again').val())
            return this.displayMessage('Yeni şifreler uyuşmuyor.');
        if ($('#new_password').val() === $('#current_password').val())
            return this.displayMessage('Yeni şifre ile eski şifre aynı olamaz.');

        this.clearApiParams();
        ac.setRequestDataParam('current_password', $('input#current_password').val());
        ac.setRequestDataParam('new_password', $("input#new_password").val());
        ac.setCallAction('user/resetpassword');
        ac.callApi('handleResetPassword');
    }

    handleResetPassword(data) {
        if (data.header.result_code === 1) {
            $("footer").show();
            $(".header_menu").show();
            this.actionLogout();
            return this.displayMessage('Şifreniz başarıyla değiştirildi', 'info');
        }
        return this.handleResponse(data);
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

    displayError(message) {
        $(window).scrollTop(0);
        this.loadTemplate('pages/error', 'main_body', 'renderAlertPage', message);
    }
    displayWarning(message) {
        $(window).scrollTop(0);
        this.loadTemplate('pages/warning', 'main_body', 'renderAlertPage', message);
    }
    displaySuccess(message) {
        $(window).scrollTop(0);
        $('body#eticsoft_body').removeClass();
        $('body#eticsoft_body').addClass('fullpage_alert fullpage_alert_success');

        this.loadTemplate('pages/success', 'main_body', 'renderAlertPage', message);
    }
    displayInfo(message) {
        $(window).scrollTop(0);
        this.loadTemplate('pages/info', 'main_body', 'renderAlertPage', message);
    }

    renderError(message) {
        if (message.header !== 'undefined') {
            $("h2#alert_view_header").html(message.header);
            $("div#alert_view_body").html(message.body);
        }
        $("div#alert_view_body").html(message);
    }

    displayMessage(message, type = 'danger') {
        $(window).scrollTop(0);
        console.log("message " + message);

        let icon = 'x-octagon-fill';
        if (type === 'warning') {
            let icon = 'exclamation-diamond-fill';
        } else if (type === 'info') {
            icon = 'info-square-fill';
        } else if (type === 'success') {
            icon = 'check2-square';
        }

        let alertdiv = '<div class="alert alert-' + type + '">'
                + '<img src="img/icons/' + icon + '.svg" class="bicon">'
                + '<div id="alert_context">' + message + '</div>'
                + '</div>';
        $("div#main_messages").html(alertdiv);
        $("div#main_messages").show();
    }

    viewregister() {
        if (this.getFromLocal('id_application') && this.getFromLocal('application_status') && this.getFromLocal('application_key')) {
            let message = 'Bu cihazla yapılmış bir başvurunuz var. Bu başvurunun durumunu sorgulamak için '
                    + '<input type="number" id="recover_phone" maxlength="11" placeholder="Cep telefonu numaranızı girin" class="form-control"/><br/>'
                    + '<button class="form-green-button" onclick="app.actionGetApplicationStatus()"> buraya dokunun </button>'
                    + ' <hr/><br/><a onclick="app.actionDeleteApplication()"  >Başvurumu Sil</a>';
            return this.displayWarning(message);
        }
        this.loadTemplate('pages/application/register', 'main_body');
    }

    viewcancelregister() {
        this.viewmodal('Başvurunuzu silmek ve başvuru arayüzünden çıkmak istediğinize emin misiniz ? ', 'Başvuru iptal edilsin mi ?',
                '<a onclick="app.actionDeleteApplication()" data-dismiss="modal" class="btn btn-warning"  >Başvurumu Sil ve Çık</a></hr><br/>'
                + ' <div class="text-center mt-5"><a data-dismiss="modal" aria-label="Close">Başvuruya Devam Et</a></div>');
    }

    /* START resigterCustomer "I'm a customer flow" */

    viewregistercustomer() {
        this.loadTemplate('pages/application/registercustomer', 'main_body');
    }

    actionRegisterCustomer() {
        $("div#main_messages").hide();
        if (!ev.email("input#customer_email") || $("input#customer_email").val().length < 10)
            return this.displayMessage('E-posta adresinizi kontrol ediniz.');
        if (!ev.mobilephone("input#customer_phone"))
            return this.displayMessage('Cep telefonunuzu kontrol ediniz.');
        if (!ev.mobilephone("input#customer_phone"))
            return this.displayMessage('Cep telefonunuzu kontrol ediniz.');
        if (!$("#checkbox_kvkk").prop("checked"))
            return this.displayMessage('Devam etmek için KVKK Aydınlatma Metinini okuyup onaylamalısınız.');
        if (!$("#checkbox_kvkk2").prop("checked"))
            return this.displayMessage('Devam etmek için KVKK Açık Rıza Sözleşmesini okuyup onaylamalısınız.');


        this.clearApiParams();
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
        if (data.data.id_application && data.header.result_code === 1) {
            this.saveToLocal('id_application', data.data.id_application);
            this.saveToLocal('application_status', data.data.application_status);
            this.saveToLocal('application_key', data.data.application_key);
        }
        return this.handleResponse(data);
    }

    actionAddContact() {
        $("div#main_messages").hide();
        if (!$("select#id_person").val())
            return this.displayMessage('Adınızı kontrol ediniz.');

        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('id_person', $("select#id_person").val());
        ac.setCallAction('application/addcontact');
        ac.callApi();

    }

    viewregistercustomercompany() {
        this.loadTemplate('pages/application/registercustomercompany', 'main_body', 'renderregistercompany');

    }

    renderregistercompany() {
        $.each(app.last_response.data.firm.AddressList, function (key, value) {
            $('select#company_address')
                    .append($("<option></option>")
                            .attr("value", value.AddressId)
                            .text(value.Location));
        });
        $.each(app.last_response.data.firm.AccountList, function (key, value) {
            $('select#company_account')
                    .append($("<option></option>")
                            .attr("value", value.AccountNumber + "-" + value.AccountSuffix)
                            .text(value.AccountName));
        });
        $.each(app.last_response.data.MCC, function (key, value) {
            $('select#customer_mcc')
                    .append($("<option></option>")
                            .attr("value", value.Code)
                            .text(value.Name));
        });
    }

    actionAddCompany() {
        $("div#main_messages").hide();

        if (!$("select#company_account"))
            return this.displayMessage('Bağlı hesap seçiminizi kontrol ediniz.');
        if (!$("select#company_address").val())
            return this.displayMessage('Adres seçiminizi kontrol ediniz.');
        if (!$("select#customer_mcc").val() || $("select#customer_mcc").val() === "0")
            return this.displayMessage('Kategori seçiminizi kontrol ediniz.');

        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));

        ac.setRequestDataParam('id_address', $("select#company_address").val());
        ac.setRequestDataParam('id_account', $("select#company_account").val());
        ac.setRequestDataParam('mcc', $("select#customer_mcc").val());

        ac.setCallAction('application/addcompany');
        ac.callApi();

    }

    viewregistercustomerfiles() {
        this.loadTemplate('pages/application/registercustomerfiles', 'main_body', 'renderregistercustomerfiles');
    }

    renderregistercustomerfiles() {

        console.log("renderregistercustomerfiles");
        $('div#files_div').html(null);
        this.application_remaining_files = [];
        if (typeof app.last_response.data.documents !== 'undefined' && Object.keys(app.last_response.data.documents).length > 0) {
            $.each(app.last_response.data.documents, function (key, value) {
                let file_input_row = '<div class="file-field">\n\
<div class="sm-5 float-left">\n\
    <label for="file_' + value.id + '">' + value.name + '</label></div>\n\
    <div class="sm-5  float-right"><small id="file_' + value.id + '_info"></small></div>\n\
        <div class="sm-2 float-right"><label for="file_' + value.id + '"><img src="img/icons/cloud-arrow-up-fill.svg" style="height: 36px" class="bicon-dark"></label>\n\
<input type="file" class="fileupload" id="file_' + value.id + '" hidden onchange="app.readfilecontent(\'' + value.id + '\', \'' + value.name + '\')" />\n\</div>\n\</div><div class="clearfix"></div><hr/>';
                $('div#files_div').append(file_input_row);
                app.application_remaining_files.push(value);
            });
        }
    }

    actionRegisterCustomerFiles() {
        if (!$("#checkbox_tos").prop("checked"))
            return this.displayMessage('Devam etmek için Kullanıcı sözleşmesini okuyup onaylamalısınız.');
        if (!$("#checkbox_pfc").prop("checked"))
            return this.displayMessage('Devam etmek için Çerçeve Sözleşmesini okuyup onaylamalısınız.');
        let missed_files = false;
        app.application_remaining_files.map(function (file, index) {
            if (typeof app.uploadedfiles[file.id] === 'undefined') {
                missed_files = true;
                return app.displayMessage('Lütfen geçerli bir ' + file.name + " dosyası yükleyiniz.");
            }
        });
        if (missed_files) {
            console.log("blocked");
            return;
        }
        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        this.uploadedfiles.forEach(function (file, index) {
            ac.setRequestDataParam(file.code, JSON.stringify(file));
        });

        ac.setCallAction('application/addfiles');
        ac.callApi();

    }

    readfilecontent(file_id, file_name = "vergi") {
        $("div#main_messages").hide();

        console.log(file_id + " is reading !");
        let current_file = document.querySelector("#file_" + file_id).files[0];
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
        let file = document.querySelector("#file_" + file_id).files[0];
        if (!file) {
            return this.displayMessage(file_name + ' dosyası hatalı.');
        }
        if (file.size > 5 * 1000000) {
            return this.displayMessage(file_name + ' dosyası çok büyük.');
        }
        if (file.type !== 'image/jpeg' && file.type !== 'application/pdf' && file.type !== 'image/png') {
            return this.displayMessage(file_name + ' dosya türü uygun değil Sadece PDF, JPG be PNG uzantılı dosyaları yükleyiniz.');
        }
        this.uploadedfiles[file_id] = {
            name: file_name,
            oname: file.name,
            code: file_id,
            type: file.type,
            size: file.size,
            file_context: context
        };
        $("#file_" + file_id + "_info").text(file.name);

    }

    viewregistercustomercontact() {
        this.loadTemplate('pages/application/registercustomercontact', 'main_body', 'rendercustomercontact');
    }

    rendercustomercontact() {
        $.each(app.last_response.data.person, function (key, value) {
            $('select#id_person')
                    .append($("<option></option>")
                            .attr("value", key)
                            .text(value.NameAndSurname));
        });
        $('select#id_person').change();

    }

    displaycustomercontactdetails() {
        let selected = $('select#id_person').val();
        let person = app.last_response.data.person[selected];
        $("#selected_contact").html('<table class="table" >\n\
            <tr>\n\
            <td>Ad Soyad<td>\n\
            <td>' + person.NameAndSurname + '<td>\n\
            </tr>\n\
            <tr>\n\
            <td>Telefon<td>\n\
            <td>0' + person.MobilPhone + '<td>\n\
            </tr>\n\
            <tr>\n\
            <td>Vergi/TCKN<td>\n\
            <td>' + person.TaxNumber + '<td>\n\
            </tr>\n\
        ');
    }

    viewregistercustomersms() {
        this.actionRegisterCustomerSmsRequest();
        this.loadTemplate('pages/application/registercustomersms', 'main_body', 'setsmscounter');
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
                $('#resendsms').attr("disabled", false);
                $('#resendsms').removeClass("disabled");
            }
        }).start()
    }

    actionGetApplicationStatus() {
        $("div#main_messages").hide();
        if (!ev.mobilephone("input#recover_phone"))
            return this.displayMessage('Lütfen cep telefonunuzu başında sıfır ile doğru girdiğinizden emin olunuz. ');
        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('phone', $('input#recover_phone').val());
        ac.setCallAction('application/getApplicationStatus');
        ac.callApi('handleApplicationStatus');
    }

    handleApplicationStatus(data) {

        if (data.header.result_code == 1 && data.data.id) {
            if (data.data.status === null || data.data.status === 'undefined') {
                return this.displayError('Başvurunun durum bilgisi alınamadı');
            }
            this.saveToLocal('application_status', data.data.status);
            if (data.data.status === 'processing') {
                return this.displayInfo('Başvurunuz şu an onay aşamasında. Sizi en kısa zamanda haberdar edeceğiz.');
            }
            if (data.data.status === 'pending' || data.data.status === 'prevalidation') {
                let message = 'Bu başvuru henüz tamamlanmamış. Tamamlamak için '
                        + '<button class="form-green-button" onclick="app.actionGetApplicationStatus()"> buraya dokunun </button>. ';
                return this.run('registercustomersms');
            }
            if (data.data.status === 'approved') {
                let message = {header: "Tebrikler !", body: "Başvurunuz onaylandı. Giriş bilgileriniz size e-posta ve/veya sms yoluyla iletilmektedir."};
                return this.displaySuccess(message);
            }
            if (data.data.status === 'rejected') {
                let message = {header: "Üzgünüz !", body: "Başvurunuz onaylanmadı. Yeniden başvuru yapmak için yardım menüsünden destek ekibimize ulaşabilirsiniz."};
                return this.displayError(message);
            }
        }
        this.handleResponse(data);

    }

    actionDeleteApplication() {

        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('sms_code', $("input#registercustomersmscode").val());
        ac.setCallAction('application/deleteapplication');
        ac.callApi('handleDeleteApplication');

    }

    handleDeleteApplication(data) {
        if (data.header.result_code === 1 || data.header.result_code <= 530) {
            this.deleteLocal('id_application');
            this.deleteLocal('application_key');
            this.deleteLocal('application_status');
        }
        return this.handleResponse(data);
    }

    actionforcedeleteapplication() {
        this.deleteLocal('id_application');
        this.deleteLocal('application_key');
        this.deleteLocal('application_status');
        this.run('register');
        return this.displayMessage('Başvurunuz silindi ');
    }

    /* START RegisterNewCustomer I want to be a customer*/
    viewregisternewcustomer() {
        this.loadTemplate('pages/application/registernewcustomer', 'main_body');
    }

    actionRegisterNewCustomer() {
        if (!ev.mobilephone("input#registernewcustomer_phone"))
            return this.displayMessage('Lütfen cep telefonunuzu başında sıfır ile doğru girdiğinizden emin olunuz. ');
        this.clearApiParams();
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
        this.loadTemplate('pages/application/registercustomersms', 'main_body');
    }

    actionRegisterCustomerSmsRequest() {
        console.log("SMS requesting");
        $("div#main_messages").hide();
        this.clearApiParams();
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

        this.clearApiParams();
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
        this.loadTemplate('pages/application/registernewcustomercomplete', 'main_body', 'rendernewcustomercomplete');
    }

    rendernewcustomercomplete() {
        let data = this.last_response.data;
        $.each(data.cities, function (key, value) {
            $('select#registernewcustomer_city')
                    .append($("<option></option>")
                            .attr("value", value.Code)
                            .text(value.Name));
        });
    }

    actionassignCounties() {
        let MainCode = $('select#registernewcustomer_city').val();
        let counties = app.last_response.data.counties;
        $('select#registernewcustomer_county').html("<option>İlçe Seçiniz</option>");
        $.each(counties, function (ckey, cvalue) {
            if (cvalue.MainCode === MainCode) {
                $('select#registernewcustomer_county')
                        .append($("<option></option>")
                                .attr("value", cvalue.Code)
                                .text(cvalue.Name));
            }
        });
    }

    actionRegisterNewCustomerComplete() {
        if (!ev.name('#registernewcustomer_firstname'))
            return this.displayMessage('Lütfen adınızı doğru girdiğinizden emin olunuz. ');
        if (!ev.name('#registernewcustomer_lastname'))
            return this.displayMessage('Lütfen soyadınızı doğru girdiğinizden emin olunuz. ');
        if (!ev.name('#registernewcustomer_company'))
            return this.displayMessage('Lütfen firma adınızı doğru girdiğinizden emin olunuz. ');
        if (!ev.number('#registernewcustomer_cid') || $('#registernewcustomer_cid').val().length < 10)
            return this.displayMessage('Kimlik/Vergi numaranızın doğru girdiğinizden emin olunuz. ');
        if (!ev.mobilephone('#registernewcustomer_phone'))
            return this.displayMessage('Telefon numaranızın doğru girdiğinizden emin olunuz. ');
        if (!ev.email('#registernewcustomer_email') || $("input#registernewcustomer_email").val().length < 10)
            return this.displayMessage('Lütfen e-posta adresinizi doğru girdiğinizden emin olunuz. ');
        if (isNaN($('#registernewcustomer_city').val()) || parseInt($('#registernewcustomer_city').val()) <= 0)
            return this.displayMessage('Lütfen şehir seçiminizi kontrol ediniz. ');
        if (isNaN($('#registernewcustomer_county').val()) || parseInt($('#registernewcustomer_county').val()) <= 0)
            return this.displayMessage('Lütfen ilçe seçiminizi kontrol ediniz. ');
        if (($('#registernewcustomer_cid').val()).length === 11 && !ev.tckn($('#registernewcustomer_cid').val()))
            return this.displayMessage('Kimlik numaranızı doğru girdiğinizden emin olunuz. ');

        this.clearApiParams();
        ac.setRequestDataParam('id_application', this.getFromLocal('id_application'));
        ac.setRequestDataParam('application_key', this.getFromLocal('application_key'));
        ac.setRequestDataParam('cid', $("input#registernewcustomer_cid").val());
        ac.setRequestDataParam('email', $("input#registernewcustomer_email").val());
        ac.setRequestDataParam('firstname', $("input#registernewcustomer_firstname").val());
        ac.setRequestDataParam('lastname', $("input#registernewcustomer_lastname").val());
        ac.setRequestDataParam('company', $("input#registernewcustomer_company").val());
        ac.setRequestDataParam('citycode', $("select#registernewcustomer_city").val());
        ac.setRequestDataParam('countycode', $("select#registernewcustomer_county").val());
        ac.setRequestDataParam('city', $("select#registernewcustomer_city option:selected").text());
        ac.setRequestDataParam('address', $("select#registernewcustomer_county option:selected").text());
        ac.setCallAction('application/completenewcustomer');
        ac.callApi();
    }

    viewregisternewcustomersuccess() {
        this.loadTemplate('pages/application/registernewcustomersuccess', 'main_body');
    }

    /* END RegisterNewCustomer I want to be a customer*/

    viewregisternewcompany() {
        this.loadTemplate('pages/application/registernewcompany', 'main_body');
    }

    //* TRANSACTION SERVICES *//
    viewposscreen() {
        // $("#main_logo_container").hide(300);
        this.loadTemplate('pages/transaction/posscreen', 'main_body', 'renderposscreen');
    }

    renderposscreen() {
        app.refreshposscreen();

        $("#qp1").text(app.quickPros[0].name);
        $("#qp2").text(app.quickPros[1].name);
        $("#qp3").text(app.quickPros[2].name);
        $("#qp4").text(app.quickPros[3].name);
        $('#new_item_name').text(this.getFromLocal('main_product_name'));

        this.installments.forEach(function (ins, index) {
            $("#installmentselect").append($("<option></option>")
                    .attr("value", ins.month)
                    .text(ins.month + " Taksit"));
        });
        $('#installmentselect > option[value="' + cart.installment + '"]').attr('selected', 'selected');

        $("#clearPaymentForm").click();

        $(".number").on('click', function () {
            console.log("rakam");
            $("#new_item_price").text($("#new_item_price").text() + $(this).text());
        });

        $("#collectPaymentForm").on('click', function () {
            console.log("topla");
            let  item_amount = parseFloat($("#new_item_price").text());
            if (typeof item_amount === 'undefined' || item_amount <= 0 || isNaN(item_amount)) {
                console.log("sıfır");
                return;
            }

            let  item_name = $("#new_item_name").text();
            let  item_quantity = parseInt($("#new_item_quantity").text());
            let item = new PosCartItem(item_name, item_amount, item_quantity);

            cart.add(item);
            app.refreshposscreen();

        });

        $("#clearPaymentForm").on('click', function () {
            cart.clear();
            $("#items_list").html(null);
            $("#new_item_price").text(null);
            $("#total").text(0);
        });


    }

    refreshposscreen() {

        cart.calculate();
        $("#items_list").html(null);
        cart.items.forEach(function (it, index) {
            $("#items_list").append("<tr><td>" + it.quantity + "</td><td> " + it.name + " </td><td> " + (it.price * it.quantity).toFixed(2) + " </td></tr>");
        });

        $('#installmentselect > option[value="' + cart.installment + '"]').attr('selected', 'selected');

        if (cart.installment > 1) {
            $("#installmentbutton").text(cart.installment + ' Taksit');
        } else {
            $("#installmentbutton").text('Taksitsiz');
        }

        $("#new_item_price").text(null);
        $("#total").text(cart.total_amount);

    }

    actionaddqp(id) {
        if (this.quickPros[id]) {
            let item = new PosCartItem(this.quickPros[id].name, this.quickPros[id].price);
            cart.add(item);
            return this.refreshposscreen();
        }
    }

    viewpossettings() {
        this.loadTemplate('pages/setting/possettings', 'main_body', 'renderpossettings');
    }

    renderpossettings() {
        this.quickPros.forEach(function (qp, index) {
            $("#quickprossettingtable").append('\
            <tr><td><input id="qp_' + index + '_name" value="' + qp.name + '" maxlength="10"></td>\n\
            <td><input  id="qp_' + index + '_price" value="' + parseFloat(qp.price).toFixed(2) + '" type="number" step="0.01" maxlength="9" /></td>\n\
            </tr>');
        });
        this.installments.forEach(function (ins, index) {
            $("#installmentsettingtable").append('\
            <tr>\n\
            <td>' + ins.month + ' taksit</td>\n\
            <td>\n\
            \n\<div class="input-group"><div class="input-group-prepend">\n\
            <span class="input-group-text">&percnt;</span>\n\
            </div>\n\
            <input class="form-control bg-white"  id="installment_' + index + '_rate" value="' + parseFloat(ins.customer_rate).toFixed(2) + '" type="number" step="0.01" maxlength="99"/>\n\
            </div></td>\n\
            </tr>');
        });
        $('#possetting_tax').val((parseFloat(this.getFromLocal('tax_rate')) * 100).toFixed(0));
        $('#possetting_main_product_name').val(this.getFromLocal('main_product_name'));

    }

    actionsavepossettings() {
        cart.clear();
        $("#items_list").html(null);
        $("#new_item_price").text(null);
        $("#total").text(0);
        this.quickPros.forEach(function (qp, index) {
            if ($('#qp_' + index + '_name').val()) {
                app.quickPros[index].name = $('#qp_' + index + '_name').val();
                app.quickPros[index].price = parseFloat($('#qp_' + index + '_price').val()).toFixed(2);
            }
        });
        this.saveToLocal('quick_products', JSON.stringify(this.quickPros));

        this.installments.forEach(function (qp, index) {
            if ($('#installment_' + index + '_rate').val()) {
                app.installments[index].customer_rate = parseFloat($('#installment_' + index + '_rate').val()).toFixed(2);
            }
        });
        this.saveToLocal('installments', JSON.stringify(this.installments));
        this.saveToLocal('tax_rate', (parseFloat($('#possetting_tax').val()) / 100).toFixed(2));
        this.saveToLocal('main_product_name', $('#possetting_main_product_name').val());

        return this.run('posscreen');
    }

    viewnewpayment() {
        this.loadTemplate('pages/transaction/newpayment', 'main_body');
    }

    viewnewpayment_options() {
        this.loadTemplate('pages/transaction/newpayment_options', 'main_body', 'rendernewpaymentoptions');
    }

    rendernewpaymentoptions() {
        if (cart.total_amount <= 0) {
            return this.displayError('Toplam Tutar Hatalı');
        }
        $("div#total_to_pay").text(cart.total_amount + ' ₺');
    }

    viewcc_form() {
        this.loadTemplate('pages/transaction/cc_form', 'main_body', 'rendercc_form');
    }

    rendercc_form() {
        if (cart.total_amount <= 0) {
            cart.clear();
            cart.add(new PosCartItem('Ürün-Hizmet', 100, 1));
            cart.calculate();
        }

        if (cart.total_amount > 0) {
            $('#cc_amount').val(cart.total_amount);
        }

        $("#installmentselect").html('<option value="0">Taksitsiz </option>');
        this.installments.forEach(function (ins, index) {
            $("#installmentselect").append($("<option></option>")
                    .attr("value", ins.month)
                    .text(ins.month + " Taksit"));
        });
        $('#installmentselect > option[value="' + cart.installment + '"]').attr('selected', 'selected');

        if (cart.installment > 1) {
            $("#installmentbutton").text(cart.installment + ' Taksit');
        } else {
            $("#installmentbutton").text('Taksitsiz');
        }
        $("input#cc_expire").payment('formatCardExpiry');

    }

    actionPayCc() {
        $("div#main_messages").hide();

        // $('.cc-brand').text(cardType);

//        $('.validation').removeClass('text-danger text-success');
//        $('.validation').addClass($('.has-error').length ? 'text-danger' : 'text-success');
        let  cardType = $.payment.cardType($("input#cc_number").val());
        console.log(cardType);


        if (!ev.amount("input#cc_amount"))
            return this.displayMessage('Tutarı kontrol ediniz.');
        if (!ev.cardholder("input#cc_name"))
            return this.displayMessage('Kart üzerindeki ismi kontrol ediniz.');
        if (!$.payment.validateCardNumber($("input#cc_number").val()))
            return this.displayMessage('Kart numarasını kontrol ediniz.');
        if (!ev.number("input#cc_cvv"))
            return this.displayMessage('Kart güvenlik kodunu kontrol ediniz.');

        if (!$("input#cc_expire").val()) {
            return this.displayMessage('Kart son kullanım tarihini kontrol ediniz.');
        } else {
            let parsed_expire = ($("input#cc_expire").val()).split(" / ");
            // Auto complete bug
            if ((parsed_expire[1]).length === 4) {
                parsed_expire[1] = (parsed_expire[1]).substr(2);
            }
            if (!$.payment.validateCardExpiry(parsed_expire[0], parsed_expire[1]))
                return this.displayMessage('Kart son kullanım tarihini kontrol ediniz.');
        }

        let parsed_expire = ($("input#cc_expire").val()).split(" / ");
        let cc_no = $("input#cc_number").val();
        cc_no = cc_no.replace(/[^0-9]/g, '');
        let cc_expire = parsed_expire[0] + "" + "" + parsed_expire[1];

        this.clearApiParams();
        ac.setRequestDataParam('cart', cart);
        ac.setRequestDataParam('amount', $("input#cc_amount").val());
        ac.setRequestDataParam('installment', cart.installment);
        ac.setRequestDataParam('cc', {
            holder: $("input#cc_name").val(),
            number: cc_no,
            cvv: $("input#cc_cvv").val(),
            expire: cc_expire
        });
        ac.setCallAction('transaction/paycc');
        ac.callApi('handlePayCc');

    }

    handlePayCc(data) {
        if (typeof data.data.tds_url !== 'undefined') {
            console.log("frame: " + data.data.tds_url);
            app.displayMessage('İşlem yönlendiriliyor. Lütfen bekleyiniz.', 'info');
            $("#main_body").html('<iframe src="' + data.data.tds_url + '" frameborder="none" width="100%" height="450px" id="tds_frame" style="margin-top: -20px;"></iframe>');
            $("#loader").show();
            $('#tds_frame').on('load', function () {
                $("#loader").hide();
            });
            return;
        }
        return this.handleResponse(data);
    }

    actionRegisterTransaction(callback = 'createqr') {
        if (cart.total_amount <= this.min_amount)
            return this.displayMessage('Tutarı kontrol ediniz. Minimum tutar ' + this.min_amount + '₺ olmalıdır.');
        if (callback === 'sendemail' && (!$('#targetemail').val() || !ev.email('#targetemail')))
            return this.displayMessage('Alıcı e-posta adresini kontrol ediniz.');
        if (callback === 'sendsms' && !ev.mobilephone('#targetphone'))
            return this.displayMessage('Alıcı cep telefonunu kontrol ediniz.');

        this.clearApiParams();
        ac.setRequestDataParam('cart', cart);
        ac.setRequestDataParam('callback', callback);

        if (callback === 'sendemail')
            ac.setRequestDataParam('email', $('#targetemail').val());
        if (callback === 'sendsms')
            ac.setRequestDataParam('phone', $('#targetphone').val());

        ac.setCallAction('transaction/registerTransaction');
        ac.callApi('handleRegisterTransaction');
    }

    handleRegisterTransaction(data) {
        if (data.header.result_code === 1) {
            cart.clear();
        }
        return this.handleResponse(data);
    }

    viewtransactionregistersuccess() {
        this.deleteLocal('daily_stats_uptodate');
        let message = {
            header: "İşlem Başarılı !", body: 'Ödeme Gönderildi\n\
                <hr/><br/><button class="btn btn-info" onclick="app.actionGetTransactions()">İşlemler listesi</button><hr/><br/>'};
        return this.displaySuccess(message);
    }

    viewtransactionsuccess() {
        this.deleteLocal('daily_stats_uptodate');
        let message = {
            header: "İşlem Başarılı !", body: 'Ödeme Alındı\n\
                <hr/><br/><button class="btn btn-info" onclick="app.actionGetTransactions()">İşlemler listesi</button><hr/><br/>'};
        return this.displaySuccess(message);
    }

    viewsend_email() {
        this.loadTemplate('pages/transaction/send_email', 'main_body', 'renderSendEmail');
    }

    renderSendEmail() {
        $("#total_to_pay").text(cart.total_amount + ' ₺');
    }

    viewsend_sms() {
        this.loadTemplate('pages/transaction/send_sms', 'main_body', 'rendersendSMS');
    }

    rendersendSMS() {
        $("#total_to_pay").text(cart.total_amount + ' ₺');
    }

    viewqr_generate() {
        this.loadTemplate('pages/transaction/qr_generate', 'main_body', 'rendergenerateqr');
    }

    rendergenerateqr() {
        let tr = app.last_response.data;
        if (!tr || typeof tr.link === 'undefined') {
            app.displayError('Bir hata oluştu. Lütfen tekrar deneyin');
        }
        $("#qr_container_div").html('Bağlantıyı <a href="' + tr.link + '"> buraya tıklayarak</a> veya aşağıdaki QR kodunu okutarak açabilirsiniz. <hr/>\n\
            <img src="https://chart.googleapis.com/chart?chs=280x280&cht=qr&chl=' + tr.link + '&choe=UTF-8"/>');

    }

    actionGetTransactions() {
        this.clearApiParams();
        ac.setCallAction('transaction/list');
        ac.callApi('handleGetTransactions');
    }

    handleGetTransactions(data) {
        this.run('listtransactions');
        this.handleResponse(data);
    }

    viewlisttransactions() {
        this.loadTemplate('pages/transaction/listtransactions', 'main_body', 'renderListTransactions');
    }

    renderListTransactions() {
        this.renderLastTransactions();
        this.renderAllTransactions();
    }

    renderLastTransactions() {
        $('div#lasttransactionlist').html(" ");
        let i = 0;
        $.each(app.last_response.data, function (key, value) {
            let row = '<div class="row no-gutters">'
                    + '<div class="col-4"> ' + value.date + '</div>'
                    + '<div class="col-3">' + (app.transactionGetBadge(value.status)) + '</div>'
                    + '<div class="col-3">' + (value.amount) + '₺</div>'
                    + '<div class="col-2">'
                    + '<button onclick="app.actionTransactionDetails(' + value.id + ')" class="btn btn-info btn-sm" >Detay</button>'
                    + '</div></div>';
            i++;
            if (i < 30) {
                $('div#lasttransactionlist').append($(row));
            } else {
                return;
            }
        });
    }

    renderAllTransactions() {
        $('div#alltransactionlist').html(" ");
        $.each(app.last_response.data, function (key, value) {
            let row = '<div class="row no-gutters">'
                    + '<div class="col-4"> ' + value.date + '</div>'
                    + '<div class="col-3">' + (app.transactionGetBadge(value.status)) + '</div>'
                    + '<div class="col-3">' + (value.amount) + '₺</div>'
                    + '<div class="col-2">'
                    + '<button onclick="app.actionTransactionDetails(' + value.id + ')" class="btn btn-info btn-sm" >Detay</button>'
                    + '</div></div>';
            $('div#alltransactionlist').append($(row));
        });
    }

    actionTransactionDetails(id) {
        this.clearApiParams();
        ac.setRequestDataParam('id', id);
        ac.setCallAction('transaction/gettransaction');
        ac.callApi();
    }
    //
    //    handleTransactionDetails(data) {
    //        $("div#main_messages").hide();
    //    }

    viewtransactiondetail() {
        this.loadTemplate('pages/transaction/transactiondetail', 'main_body', 'rendertransactiondetails');
    }

    rendertransactiondetails() {
        let tr = app.last_response.data;
        $("#cancel_button_container").hide();
        $("#refund_button_container").hide();

        $(".transaction_amount").text(tr.amount + " TRY");
        $(".transaction_id").text(tr.id);
        $("#id_transaction").val(tr.id);
        $(".transaction_date").text(tr.date_full);
        $(".transaction_status").html(this.transactionGetBadge(tr.status));

        if (tr.cancelable && tr.status === 'completed') {
            $("#cancel_button_container").show();
        }
        if (tr.status === 'created' && tr.link) {
            $("#payment_link_container").html('Bağlantıyı <a href="' + tr.link + '"> buraya tıklayarak</a> veya aşağıdaki QR kodunu okutarak açabilirsiniz. <br/>\n\
            <img src="https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' + tr.link + '&choe=UTF-8"/>');
        }

        if (!tr.cancelable && tr.status === 'completed') {
            if (this.getFromLocal('profile_level') === 'master') {
                $("#refund_button_container").show();
            } else {
                $('#payment_info_container').html('Not: İade işlemlerini sadece ana kullanıcı yapabilir.');
            }
        }

    }

    transactionGetBadge(status) {
        let badge = '';
        if (status === 'refused') {
            badge = '<span class="badge badge-warning">Ret</span>';
        }
        if (status === 'failed') {
            badge = '<span class="badge badge-danger">Başarısız</span>';
        }
        if (status === 'completed') {
            badge = '<span class="badge badge-success">Başarılı</span>';
        }
        if (status === 'canceled') {
            badge = '<span class="badge badge-secondary">İptal</span>';
        }
        if (status === 'refunded') {
            badge = '<span class="badge badge-secondary">İade</span>';
        }
        if (status === 'created' || status === 'processing') {
            badge = '<span class="badge badge-info">Bekleniyor</span>';
        }
        return badge;
    }

    filterTransactionList() {
        $("#special_date_filters_div").hide();
        if (!$("#transactionlist_filter_select").val()) {
            return this.displayError('Seçilen filtre geçerli değil');
        }
        if ($("#transactionlist_filter_select").val() === 'select_date') {
            $("#special_date_filters_div").show();
            return;
        }

        this.clearApiParams();
        ac.setRequestDataParam('filter_date', $("#transactionlist_filter_select").val());
        ac.setCallAction('transaction/list');
        ac.callApi('handlefilterTransactionList');
    }

    handlefilterTransactionList(data) {
        this.handleResponse(data);
        this.renderAllTransactions();
    }

    // Cancel 
    actionCancelTransaction(id) {
        $('#cancel_modal').modal('hide');
        if (id !== $("#id_transaction").val()) {
            return this.displayError('İşlem numaraları eşleşmedi. Lütfen tekrar deneyiniz.');
        }
        this.deleteLocal('daily_stats_uptodate');
        this.clearApiParams();
        ac.setRequestDataParam('id', id);
        ac.setCallAction('transaction/canceltransaction');
        ac.callApi();
    }

    viewtransactioncancelsuccess() {
        this.deleteLocal('daily_stats_uptodate');
        let message = {
            header: "İşlem Başarılı !", body: 'Ödeme iptal edildi\n\
                <hr/><br/><button class="btn btn-info" onclick="app.actionGetTransactions()">İşlemler listesi</button><hr/><br/>'};
        return this.displaySuccess(message);
    }

    // Refund 
    actionRefundTransaction(id) {
        $('#refund_modal').modal('hide');
        if (id !== $("#id_transaction").val()) {
            return this.displayError('İşlem numaraları eşleşmedi. Lütfen tekrar deneyiniz.');
        }
        this.deleteLocal('daily_stats_uptodate');
        this.clearApiParams();
        ac.setRequestDataParam('id', id);
        ac.setCallAction('transaction/refundtransaction');
        ac.callApi();
    }

    viewtransactionrefundsuccess() {
        this.deleteLocal('daily_stats_uptodate');
        let message = {
            header: "İşlem Başarılı !", body: 'Ödeme iade edildi\n\
                <hr/><br/><button class="btn btn-info" onclick="app.actionGetTransactions()">İşlemler listesi</button><hr/><br/>'};
        return this.displaySuccess(message);
    }

    // Common
    loadTemplate(template, to = 'main', callback = false, data = false) {
        if (!callback) {
            return $("#" + to + "").load(template + '.html');
        } else {
            $("#" + to + "").load(template + '.html', function (response, status, xhr) {
                if (status === "error") {
                    console.log("something goes wrong ! " + template + " " + callback + xhr.status + " " + xhr.statusText);
                }
                if (typeof app[callback] === "function") {
                    return app[callback](data);
                } else {
                    console.log(callback + " is not a function");
                    return false;
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
    isNumber(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    ccFormatExpiry(e) {
        var inputChar = String.fromCharCode(event.keyCode);
        var code = event.keyCode;
        var allowedKeys = [8];
        if (allowedKeys.indexOf(code) !== -1) {
            return;
        }

        event.target.value = event.target.value.replace(
                /^([1-9]\/|[2-9])$/g, '0$1/'
                ).replace(
                /^(0[1-9]|1[0-2])$/g, '$1/'
                ).replace(
                /^([0-1])([3-9])$/g, '0$1/$2'
                ).replace(
                /^(0?[1-9]|1[0-2])([0-9]{2})$/g, '$1/$2'
                ).replace(
                /^([0]+)\/|[0]+$/g, '0'
                ).replace(
                /[^\d\/]|^[\/]*$/g, ''
                ).replace(
                /\/\//g, '/'
                );
    }
    backButton() {
        // this.loadTemplate(this.pagesHistory[this.pagesHistory.length - 2], 'main_body')
        this.run(this.pagesHistory[this.pagesHistory.length - 2])
        this.pagesHistory.splice(this.pagesHistory.length - 1, 1)
    }

    formControl(id, page = null) {
        let elements = document.getElementById(id);
        let input = elements.getElementsByTagName("input");


        for (let index = 0; index < input.length; index++) {
            if (!input[index].value) {
                this.displayMessage("Lütfen girdiğiniz bilgileri kontrol ediniz.")
                // console.log("eksik bilgiler var")
                return;
            }

            this.formDataArr[input[index].name] = input[index].value;
            this.run(page);
            console.log(this.formDataArr);
    }
    }

    viewcashupz() {
        this.loadTemplate('pages/cashupz', 'main_body');
    }

    viewusermanagement() {
        this.loadTemplate('pages/usermanagement', 'main_body');
    }

}
