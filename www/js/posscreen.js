
/* global app */

class PosCartItem {
    constructor(name, price, quantity = 1) {
        this.name = name;
        this.price = parseFloat(price).toFixed(2);
        this.quantity = parseInt(quantity);
    }
}

class PosCart {
    constructor() {
        this.total_amount = 0;
        this.items = [];
        this.tax_amount = 0.00;
        this.tax_rate = 0.00;
        this.fee_rate = 0.00;
        this.fee_amount = 0.00;
        this.installment = 1;
    }

    add(item) {
        let exists = false;
        // check if same item exists //
        this.items.some(function (old_item, index) {
            if (old_item.price === item.price && old_item.name === item.name) {
                item.quantity = (parseInt(item.quantity) + parseInt(old_item.quantity));
                this.items[index] = item;
                exists = true;
                return this.calculate();
            }
        }, this);

        if (exists) {
            return;
        }

        this.items.push(item);
        this.calculate();
    }

    remove(item_index) {

    }

    calculate() {
        this.total_amount = 0;
        this.items = this.items.filter(function (item, index, arr) {
            return item.name !== 'KDV' && item.name !== 'Islem Ucreti';
        });

        this.items.forEach(function (item, index) {
            this.total_amount = (parseFloat(this.total_amount) + item.quantity * parseFloat(item.price)).toFixed(2);
        }, this);
        
        if (this.tax_rate > 0) {
            this.tax_amount = (this.total_amount * this.tax_rate);
            this.total_amount = (parseFloat(this.total_amount) + parseFloat(this.tax_amount)).toFixed(2);
            this.items.push(new PosCartItem('KDV', this.tax_amount));
            $('#tax_button').addClass('tax_button_active');
            $('#tax_button').removeClass('tax_button');
        } else {
            $('#tax_button').addClass('tax_button');
            $('#tax_button').removeClass('tax_button_active');
        }
        
        if (this.fee_rate > 0) {
            this.fee_amount = (this.total_amount * this.fee_rate);
            this.total_amount = (parseFloat(this.total_amount) + parseFloat(this.fee_amount)).toFixed(2);
            this.items.push(new PosCartItem('Islem Ucreti', this.fee_amount));
            $('#fee_button').addClass('tax_button_active');
            $('#fee_button').removeClass('tax_button');
        } else {
            $('#fee_button').removeClass('tax_button_active');
            $('#fee_button').addClass('tax_button');
        }
    }

    clear() {
        this.total_amount = 0;
        this.items = [];
        this.tax_amount = 0;
        this.tax_rate = 0;
        this.installment = 0;
        this.fee_rate = 0;
    }

    setTaxRate(rate) {
        this.tax_rate = parseFloat(rate);
    }

    toggleTaxRate(rate) {
        if (this.tax_rate > 0) {
            this.tax_rate = 0.00;
        } else {
            this.setTaxRate(rate);
        }
        this.calculate();
        return app.refreshposscreen();
    }

    toggleFee() {
        let ins = parseInt($("#installmentselect").val());
        if(ins === 0){
            this.fee_rate = 0;
            this.installment = 1;
        }
        this.installment = ins;
        let fee_rate = 0;
        if (typeof app.installments.find(o => o.month === ins) !== 'undefined' && parseFloat((app.installments.find(o => o.month === ins)).customer_rate) > 0) {
            fee_rate = (app.installments.find(o => o.month === ins)).customer_rate;
        }
        this.fee_rate = parseFloat(fee_rate) / 100;
        this.calculate();
        return app.refreshposscreen();
    }

}

class Installment {
    constructor(month, seller_rate, customer_rate) {
        this.month = parseInt(month);
        this.seller_rate = parseFloat(seller_rate).toFixed(2);
        this.customer_rate = parseFloat(customer_rate).toFixed(2);
    }
}
