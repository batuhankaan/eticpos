
/* global axios, app */

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

var def_auth_type = 'token';
var def_user_type = 'merchant';
var def_user_lang = 'tr';

class EmlakPosApiClient {
    constructor() {

        this.last_response = {};
        this.call_params = {
            auth: {
                auth_type: def_auth_type,
                user_type: def_user_type, //(merchant/admin/gateway)
                user_lang: def_user_lang,
                token: null,
                phone: null,
                password: null,
                id_merchant: 1
            },
            request: {
                action: null,
                params: {

                }
            }
        };
        this.device_id = false;
        this.api_base = 'http://localhost/wtf/apps/api';


        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
                    //  'x-requested-with': 'eticsoft-pfcs' 
        };
    }

    setAuthParam(name, value) {
        return this.call_params.auth[name] = value;
    }

    setCallAction(value) {
        return this.call_params.request.action = value;
    }

    setRequestData(value) {
        return this.call_params.request.params = value;
    }

    setRequestDataParam(name, value) {
        return this.call_params.request.params[name] = value;
    }

    removeParam(name) {
        return delete this.call_params[name];
    }

    clearAuthParams() {
        this.call_params.auth = {};
        this.call_params.auth.auth_type = def_auth_type;
        this.call_params.auth.user_type = def_user_type;
        this.call_params.auth.user_lang = def_user_lang;
        this.call_params.auth.token = null;
    }

    clearRequestParams() {
        this.call_params.request.action = null;
        this.call_params.request.params = {};
    }

    clearAllParams() {
        for (let key in this.call_params) {
            this.removeParam(key);
        }
    }

    prevalidate() {
        return true;
    }

    callApi(callback = 'handleResponse') {
        
        // OFFLINE
        let response = JSON.parse('{"data":{"firstname":"Mahmut","lastname":"G\u00dcLERCE","phone":"05073591548","merchant":"Merchant","id_merchant":"1","last_login":"none"},"header":{"auth_result":true,"result_code":1,"result_message":"token generated","result_details":" Api::getToken","token":"Y1gxc3AvSVZ1UTh6alZ1ZGNQV3R1QT09","redirect":"dashboard"}}');
        ac.last_response = response;
        if (typeof app[callback] === "function") {
            app[callback](response);
        }
        app.handleResponse(response);

        return response;
        // OFFLINE

        let end_url = this.api_base + '/?' + (new Date().getTime()) + Math.random() + "";
        document.getElementById("loader").style.display = "block";
        //    document.getElementById("request_viewer").innerHTML = end_url + '' + "\n" + JSON.stringify(this.call_params, null, 2);

        axios.post(end_url, this.call_params, {headers: this.headers})
                .then(function (response) {
                    //                document.getElementById("response_viewer").innerHTML = JSON.stringify(response.data, null, 2);
                    ac.last_response = response.data;

                    if (typeof app[callback] === "function") {
                        app[callback](response.data);
                    }
                    app.handleResponse(response.data);

                    return response.data;
                })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function () {
                    document.getElementById("loader").style.display = "none";
                });
    }
}

//const ac = new EmlakPosApiClient();
//console.log("working");
//ac.callTest();
