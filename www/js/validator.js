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
        if (/^\d+\.\d{0,2}$/.test($(id).val().replace(/\s/g, '')))
        {
            return true;
        }
        return false;
    }

    number(id) {
        if (/^\d+$/.test($(id).val().replace(/\s/g, '')))
        {
            return true;
        }
        return false;
    }

    cardexpiredate(id) {
        if (/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/.test($(id).val().replace(/\s/g, '')))
        {
            return true;
        }
        return false;
    }

    cardholder(id) {
        if (/^((?:[A-Za-çşğüıöÇÖŞĞİÜ\ ]+ ?){1,3})$/.test($(id).val()) && $(id).val() && $(id).val() !== null) {
            return true;
        }
        return false;
    }

    name(id) {
        if (/^((?:[A-Za-çşğüıöÇÖŞĞİÜ\ ]+ ?){1,3})$/.test($(id).val()) && $(id).val() && $(id).val() !== null) {
            return true;
        }
        return false;
    }

       tckn(tcno) {
        let toplam = Number(tcno.substring(0, 1)) + Number(tcno.substring(1, 2)) +
                Number(tcno.substring(2, 3)) + Number(tcno.substring(3, 4)) +
                Number(tcno.substring(4, 5)) + Number(tcno.substring(5, 6)) +
                Number(tcno.substring(6, 7)) + Number(tcno.substring(7, 8)) +
                Number(tcno.substring(8, 9)) + Number(tcno.substring(9, 10));
        let strtoplam = String(toplam);
        let onunbirlerbas = strtoplam.substring(strtoplam.length, strtoplam.length - 1);

        if (onunbirlerbas === tcno.substring(10, 11)) {
            return true;
        } else {
            return false;
        }
    }

}