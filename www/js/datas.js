class EmlakPosUserData {
    constructor() {
        // this.dashboard = 
        this.pastTransactions = {}
        this.statistics = {}
        this.userList = {}

    }



    pastTransaction() {
        // this.saveToLocal('user_info_login_phone', $("input#login_phone").val());
        ac.clearHeadParams();
        ac.clearRequestParams()
        // ac.setHeadParam('phone', $("input#login_phone").val());
        // ac.setHeadParam('password', $("input#login_password").val());
        ac.setCallAction('merchant/get/1');
        ac.callApi();
        // console.log(this)
        // return;
        // return tes
    }

}