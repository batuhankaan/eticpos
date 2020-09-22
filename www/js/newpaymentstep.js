var input = document.getElementById('islem'),
    number = document.querySelectorAll('.numbers div'),
    result = document.getElementById('collectPaymentForm'),
    clear = document.getElementById('clearPaymentForm');

for (var i = 0; i < number.length; i++) {
    number[i].addEventListener("click", function (e) {
        input.innerHTML += e.target.innerHTML;

        var inputString = input.innerHTML;
        var numbers = inputString.split(/\+/g);

        var totalToplam = 0;
        numbers.forEach((element)=>totalToplam+=Number(element))
        document.getElementById('tutar').innerHTML = totalToplam;
    });
}

clear.addEventListener("click", function () {
    input.innerHTML = "";
    document.getElementById('tutar').innerHTML = '0'
})