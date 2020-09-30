/* global ac, app, ev */

class EmlakPosApp {
    constructor() {
        this.uploadedfiles = new Array();
        this.default_view = 'dashboard';
        this.view = null;
        this.last_views = new Array();


        this.lang = 'tr';
        this.render_params = {};
        this.template = '';

        this.ac = new EmlakPosApiClient();

        this.last_response = {};
        this.message = null;
        this.arrba = new Array();
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
            'recoverapplication',
            'login',
            //'registercustomer_attn',
            //'registercustomer_comp',
            //'registercustomer_docs',
            'registernewcustomer',
            'registernewcompany',
            'resetpassword',
            'error'
        ];
        this.pagesHistory = new Array();
        this.back_buttonDisplay = [
            'login',
            'dashboard',
        ]

        this.defines = {
            external_content: {
                tos: 'http://localhost/wtf/apps/static/apiclient/pages/static/tos.html'
            }
        };
        // document.addEventListener("backbutton", leavePage, false);
    }

    init() {
        if (this.getToken() !== null) {
            this.setToken(this.getToken());
            return this.run('cc_form');
        }
        return this.run('login');
    }

    run(view) {

        this.back_buttonDisplay.includes(view) ? $("#back_button").hide() : $("#back_button").show();
        this.pagesHistory.includes(view) ? null : this.pagesHistory.push(view)
        // this.pagesHistory.includes('dashboard') ? this.pagesHistory.splice(this.pagesHistory.indexOf('login'),1) : null
        // Giriş yaptıktan sonra bug düzenlenecek
        this.view = view;

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
                $(".footer").hide();
            } else {
                $(".footer").show();

            }
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
            this.run(this.last_response.header.redirect);
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
        $("#login_phone").val(this.getFromLocal('user_info_login_phone'));
    }

    actionLogin() {
        this.saveToLocal('user_info_login_phone', $("input#login_phone").val());
        this.clearApiParams();
        ac.setHeadParam('phone', $("input#login_phone").val());
        ac.setHeadParam('password', $("input#login_password").val());
        ac.setCallAction('accesstoken/gettoken');
        ac.callApi();
        return;
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
    }

    renderDashboard() {
        $("span#userinfo_name").html(
            this.getFromLocal('user_info_firstname')
            + " " + this.getFromLocal('user_info_lastname')
        );
        return;
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

    displayMessage(message) {
        $(window).scrollTop(0);
        console.log("error message " + message);
        this.loadTemplate('pages/errormessage', 'main_messages', 'renderMessage', message);
    }

    renderMessage(message) {
        $("div#error_container").append(message);
        $("div#main_messages").show();
    }

    viewnewpayment() {
        this.loadTemplate('pages/newpayment', 'main_body');
    }

    viewnewpayment_options() {
        this.loadTemplate('pages/newpayment_options', 'main_body');
    }

    viewregister() {
        if (this.getFromLocal('id_application') && this.getFromLocal('application_status') && this.getFromLocal('application_key')) {
            let message = 'Bu cihazla yapılmış bir başvurunuz var. Bu başvurunun durumunu sorgulamak için '
                + '<input type="number" id="recover_phone" placeholder="Cep telefonu numaranızı girin" class="form-control"/><br/>'
                + '<button class="form-green-button" onclick="app.actionGetApplicationStatus()"> buraya dokunun </button>. ';
            return this.displayWarning(message);
        }
        this.loadTemplate('pages/register', 'main_body');
    }
    /* START resigterCustomer "I'm a customer flow" */

    viewregistercustomer() {
        this.loadTemplate('pages/registercustomer', 'main_body');
    }

    actionRegisterCustomer() {
        $("div#main_messages").hide();
        if (!ev.email("input#customer_email"))
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
        if (data.header.result_code == 1 && data.data.id_application) {
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
        this.loadTemplate('pages/registercustomercompany', 'main_body', 'renderregistercompany');

    }

    renderregistercompany() {
        $.each(app.last_response.data.Firm.AddressList, function (key, value) {
            $('select#company_address')
                .append($("<option></option>")
                    .attr("value", value.AddressId)
                    .text(value.Location));
        });
        $.each(app.last_response.data.Firm.AccountList, function (key, value) {
            $('select#company_account')
                .append($("<option></option>")
                    .attr("value", value.AccountNumber)
                    .text(value.AccountName));
        });
    }

    actionAddCompany() {
        $("div#main_messages").hide();

        if (!$("select#company_account"))
            return this.displayMessage('Bağlı hesap seçiminizi kontrol ediniz.');
        if (!$("select#company_address").val())
            return this.displayMessage('Adres seçiminizi kontrol ediniz.');
        if (!$("select#customer_mcc").val())
            return this.displayMessage('Kategori seçiminizi kontrol ediniz.');

        // if ($("input#customer_company").val().length < 3)
        // return this.displayMessage('İşyeri ünvanınızı kontrol ediniz.');

        // if ($("select#customer_city").val().length < 3)
        // return this.displayMessage('Şehir bilgisini kontrol ediniz.');

        // if ($("select#customer_town").val().length < 3)
        // return this.displayMessage('İlçe bilgisini kontrol ediniz.');

        // if ($("select#customer_address").val() === null)
        // return this.displayMessage('Adresinizi kontrol ediniz.');

        // if ($("select#customer_iban").val() === null)
        // return this.displayMessage('Hesap numarasını kontrol ediniz.');

        // if ($("input#customer_tax_info_office").val().length < 3)
        // return this.displayMessage('Vergi dairesini kontrol ediniz.');

        // if ($("input#customer_tax_info_id").val().length !== 10)
        // return this.displayMessage('Vergi numarasını kontrol ediniz.');

        // if (!$("select#customer_mcc").val() === null)
        // return this.displayMessage('Kategori kodunuzu kontrol ediniz.');

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
        this.loadTemplate('pages/registercustomerfiles', 'main_body');
    }

    actionRegisterCustomerFiles() {
        if (!$("#checkbox_tos").prop("checked"))
            return this.displayMessage('Devam etmek için Kullanıcı sözleşmesini okuyup onaylamalısınız.');
        if (!$("#checkbox_pfc").prop("checked"))
            return this.displayMessage('Devam etmek için Çerçeve Sözleşmesini okuyup onaylamalısınız.');

        this.clearApiParams();
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
        if (file.size > 5 * 1000000) {
            return this.displayMessage(file_name + ' dosyası çok büyük.');
        }
        this.uploadedfiles[file_id] = {
            name: file_name,
            oname: file.name,
            type: file.type,
            size: file.size,
            file_context: context
        };
        $("#" + file_id + "_info").text(file.name);

    }

    viewregistercustomercontact() {
        this.loadTemplate('pages/registercustomercontact', 'main_body', 'rendercustomercontact');
    }

    rendercustomercontact() {
        $.each(app.last_response.data.person, function (key, value) {
            $('select#id_person')
                .append($("<option></option>")
                    .attr("value", key)
                    .text(value.NameAndSurname));
        });

    }

    viewregistercustomersms() {
        this.actionRegisterCustomerSmsRequest();
        this.loadTemplate('pages/registercustomersms', 'main_body', 'setsmscounter');
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
                let message = { header: "Tebrikler !", body: "Başvurunuz onaylandı. Giriş bilgileriniz size e-posta ve/veya sms yoluyla iletilmektedir." };
                return this.displaySuccess(message);
            }
            if (data.data.status === 'rejected') {
                let message = { header: "Üzgünüz !", body: "Başvurunuz onaylanmadı. Yeniden başvuru yapmak için yardım menüsünden destek ekibimize ulaşabilirsiniz." };
                return this.displayError(message);
            }
        }
        this.handleResponse(data);

    }

    /* START RegisterNewCustomer I want to be a customer*/
    viewregisternewcustomer() {
        this.loadTemplate('pages/registernewcustomer', 'main_body');
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
        this.loadTemplate('pages/registercustomersms', 'main_body');
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
        this.loadTemplate('pages/registernewcustomercomplete', 'main_body');
    }

    actionRegisterNewCustomerComplete() {
        this.clearApiParams();
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
        this.loadTemplate('pages/registernewcustomersuccess', 'main_body');
    }

    /* END RegisterNewCustomer I want to be a customer*/

    viewregisternewcompany() {
        this.loadTemplate('pages/registernewcompany', 'main_body');
    }

    //* TRANSACTION SERVICES *//
    viewcc_form() {
        this.loadTemplate('pages/cc_form', 'main_body');
    }

    actionPayCc() {
        $("div#main_messages").hide();
        if (!ev.amount("input#cc_amount"))
            return this.displayMessage('Tutarı kontrol ediniz.');
        if (!ev.cardholder("input#cc_name"))
            return this.displayMessage('Kart üzerindeki ismi kontrol ediniz.');
        if (!ev.number("input#cc_number"))
            return this.displayMessage('Kart numarasını kontrol ediniz.');
        if (!ev.number("input#cc_cvv"))
            return this.displayMessage('Kart güvenlik kodunu kontrol ediniz.');
        if (!ev.cardexpiredate("input#cc_expire"))
            return this.displayMessage('Kart son kullanım tarihini kontrol ediniz.');

        this.clearApiParams();
        ac.setRequestDataParam('amount', $("input#cc_amount").val());
        ac.setRequestDataParam('cc', {
            holder: $("input#cc_name").val(),
            number: $("input#cc_number").val(),
            cvv: $("input#cc_cvv").val(),
            expire: $("input#cc_expire").val()
        });
        ac.setCallAction('transaction/paycc');
        ac.callApi('handleRegisterCustomer');

    }

    viewsend_email() {
        this.loadTemplate('pages/send_email', 'main_body');
    }

    viewsend_sms() {
        this.loadTemplate('pages/send_sms', 'main_body');
    }

    viewqr_generate() {
        this.loadTemplate('pages/qr_generate', 'main_body');
    }

    actionGetTransactions() {
        this.clearApiParams();
        ac.setCallAction('transaction/list');
        ac.callApi('handleGetTransactions');
    }

    handleGetTransactions(data) {
        this.handleResponse(data);
    }

    viewlisttransactions() {
        this.loadTemplate('pages/listtransactions', 'main_body', 'renderListTransactions');
    }

    renderListTransactions() {
        $('div#transactionlist').html(" ");
        let total = 0.00;
        $.each(app.last_response.data, function (key, value) {

            $('div#transactionlist')
                .append($('<div class="row no-gutters">'
                    + '<div class="col-4"> ' + value.date + '</div>'
                    + '<div class="col-3">' + (app.transactionGetBadge(value.status)) + '</div>'
                    + '<div class="col-3">' + (value.amount) + '₺</div>'
                    + '<div class="col-2">'
                    + '<button onclick="app.actionTransactionDetails(' + value.id + ')" class="btn btn-info btn-sm" >Detay</button>'
                    + '</div></div>')
                );
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
        this.loadTemplate('pages/transactiondetail', 'main_body', 'rendertransactiondetails');
    }

    rendertransactiondetails() {
        let tr = app.last_response.data;
        $("td#transaction_amount").text(tr.amount + " TRY");
        $("td#transaction_id").text(tr.id);
        $("td#transaction_date").text(tr.date);
        $("td#transaction_status").html(this.transactionGetBadge(tr.status));
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
        if (status === 'created' || status === 'processing') {
            badge = '<span class="badge badge-info">Bekleniyor</span>';
        }
        return badge;
    }

    // Common
    loadTemplate(template, to = 'main', callback = false, data = false) {
        if (!callback) {
            return $("#" + to + "").load(template + '.html');
        } else {
            $("#" + to + "").load(template + '.html', function (response, status, xhr) {
                if (status === "error") {
                    console.log("something goes wrong ! " + template + callback + xhr.status + " " + xhr.statusText);
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

    formatterCurrency(price) {

        const currency_type = "₺"

        const currencyOutput = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
        });

        return currencyOutput.format(price).replace(currency_type, '')
    }


    ccInstallment(param) {
        if (param.value.length === 6) {
            $.ajax({
                url: `https://bin.sanalpospro.com/?cc=${param.value}&callback`,
                dataType: "jsonp",
                success: function (result) {
                    if (!$('tr')[1]) {
                        $.each(cards[result.family], function (index, value) {
                            if ((value !== undefined)) {
                                $('table tbody')[0].innerHTML += `
                                <tr class="test">
                                    <td>
                                        <label class="input-radio-button">${index === 1 ? "Tek Çekim" : index + " x Taksit"}
                                            <input ${"index===1 ? checked :"} type="radio" value="${" index"}" dataamount="${" value"}"
                                                name="cc_installment">
                                            <span class="checkmark"></span>
                                        </label>
                                    </td>
                                    <td>${index} x ${app.formatterCurrency(value / index * 100 / 100)}</td>
                                    <td id="deleteAtt">${value + 'TL'}</td>
                                </tr>`;
                            }
                        });
                        // console.log(cards[result.family])

                        $('#installment-table')[0].style.display = "block"
                    }
                }
            });
        } else if (param.value.length < 6) {
            $('#installment-table')[0].style.display = "none"
            while ($('tr')[1]) {
                $('tr')[1].remove();
            }
        }
    }


}
