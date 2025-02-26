import React, { useState } from "react";

const PaypalPayment = ({ onPaymentSuccess }) => {
    const [email, setEmail] = useState("");

    const handlePayNow = () => {
        // Simulate payment processing
        setTimeout(() => {
            onPaymentSuccess({ method: "Paypal", email });
        }, 2000); // Simulate a 2-second delay
    };

    return (
        <div className="payment-form">
            <h3>Paypal Payment</h3>
            <p>Enter your PayPal email to proceed:</p>
            <input
                type="email"
                placeholder="PayPal Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handlePayNow}>Pay Now</button>
        </div>
    );
};

export default PaypalPayment;