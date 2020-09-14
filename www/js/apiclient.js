
/* global axios, app */

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

var def_auth_type = 'token';
var def_user_level = 'pos';
var def_user_lang = 'tr';

class EmlakPosApiClient {
    constructor() {

        this.last_response = {};		
		this.call_action = '/';
        this.call_params = {
            head: {
                auth_type: def_auth_type,
                user_level: def_user_level, //(merchant/admin/gateway)
                user_lang: def_user_lang,
                token: null,
                phone: null,
                password: null,
                id_user: 1
            },
            data: {
               
            }
        };
        this.device_id = false;
        // this.api_base = 'http://localhost/wtf/apps/api/?/mobil/v2/';
       this.api_base = 'https://mobilapi.eticsoft.net/api/?/mobil/v2/';


        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
                    //  'x-requested-with': 'eticsoft-pfcs' 
        };
    }

    setHeadParam(name, value) {
        return this.call_params.head[name] = value;
    }

    setCallAction(value) {
        return this.call_action = value;
    }

    setRequestData(value) {
        return this.call_params.data = value;
    }

    setRequestDataParam(name, value) {
        return this.call_params.data[name] = value;
    }

    removeParam(name) {
        return delete this.call_params[name];
    }

    clearHeadParams() {
        this.call_params.head = {};
        this.call_params.head.auth_type = def_auth_type;
        this.call_params.head.user_level = def_user_level;
        this.call_params.head.user_lang = def_user_lang;
        this.call_params.head.token = null;
    }

    clearRequestParams() {
        this.call_params.data = {};
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

        //let end_url = this.api_base + this.call_action +'&' +(new Date().getTime()) + Math.random() + "";
        let end_url = this.api_base + this.call_action;
        document.getElementById("loader").style.display = "block";
        //    document.getElementById("request_viewer").innerHTML = end_url + '' + "\n" + JSON.stringify(this.call_params, null, 2);

        axios.post(end_url, this.call_params, {headers: this.headers})
                .then(function (response) {
                    //                document.getElementById("response_viewer").innerHTML = JSON.stringify(response.data, null, 2);
                    ac.last_response = response.data;

                    if (typeof app[callback] === "function") {
                        return app[callback](response.data);
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
