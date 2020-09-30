class EmValidator {

    email(id)
    {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($(id).val()))
        {
            return (true)
        }
        return (false)
    }

    mobilephone(id) {
        if (/^(05)[0-9][0-9][1-9]([0-9]){6}$/.test($(id).val()))
        {
            return true;
        }
        return false;

    }

    amount(id) {
        if (/^\d+\.\d{0,2}$/.test($(id).val()))
        {
            return true;
        }
        return false;
    }

    number(id) {
        if (/^\d+$/.test($(id).val()))
        {
            return true;
        }
        return false;
    }

    cardexpiredate(id) {
        if (/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/.test($(id).val()))
        {
            return true;
        }
        return false;
    }

    cardholder(id) {
        if (/^((?:[A-Za-z]+ ?){1,3})$/.test($(id).val())) {
            return true;
        }
        return false;
    }

}