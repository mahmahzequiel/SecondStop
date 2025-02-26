import React from "react";

const CODPayment = ({ onPaymentSuccess }) => {
    const handleConfirmOrder = () => {
        onPaymentSuccess({ method: "COD" });
    };

    return (
        <div className="payment-form">
            <h3>Cash On Delivery</h3>
            <p>Pay when your order arrives.</p>
            <button onClick={handleConfirmOrder}>Confirm Order</button>
        </div>
    );
};

export default CODPayment;