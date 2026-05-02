paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '15.00' // The amount to charge
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert('Transaction completed by ' + details.payer.name.given_name + '!');
        });
    },
    onError: function(err) {
        console.error('Payment Error:', err);
    }
}).render('#paypal-button-container');

// 2. Trigger PayPal when the Fanciful Button is clicked
const customBtn = document.getElementById('custom-donate-btn');

customBtn.addEventListener('click', function() {
    // We target the inner PayPal button created by the SDK
    const internalPaypalBtn = document.querySelector('#paypal-button-container .paypal-button');
    
    if (internalPaypalBtn) {
        internalPaypalBtn.click();
    } else {
        console.log("Loading PayPal...");
    }
});