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

}