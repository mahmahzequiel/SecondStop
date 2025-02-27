import React, { useState } from "react";
import { Modal, Input, Button } from "antd";

const PaypalPayment = ({ isVisible, onClose, onPaymentSuccess }) => {
    const [email, setEmail] = useState("");
    const [emailEntered, setEmailEntered] = useState(false);

    const handleProceed = () => {
        setEmailEntered(true);
    };

    const handlePayNow = () => {
        setTimeout(() => {
            onPaymentSuccess({ method: "PayPal", email });
            onClose();
        }, 2000); // Simulate a 2-second delay
    };

    return (
        <Modal title="PayPal Payment" open={isVisible} onCancel={onClose} footer={null}>
            <div className="paypal-payment-container">
                <div className={`input-wrapper ${emailEntered ? "pay-active" : ""}`}>
                    {/* Email Input */}
                    <div className="email-input">
                        <p>Enter your PayPal email to proceed:</p>
                        <Input
                            type="email"
                            placeholder="PayPal Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button type="primary" block onClick={handleProceed}>
                            Proceed
                        </Button>
                    </div>

                    {/* Pay Now Button */}
                    <div className="pay-button">
                        <p>Proceeding with PayPal email: <strong>{email}</strong></p>
                        <Button type="primary" block onClick={handlePayNow}>
                            Pay Now
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PaypalPayment;
