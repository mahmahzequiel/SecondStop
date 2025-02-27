import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";

const GcashPayment = ({ visible, onClose, onPaymentSuccess }) => {
    const [mobileNumber, setMobileNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = () => {
        if (mobileNumber.length === 11) {
            message.success("OTP sent to your mobile number!");
            setTimeout(() => setOtpSent(true), 300); // Delay OTP input slide-in by 0.3s
        } else {
            message.error("Please enter a valid 11-digit mobile number.");
        }
    };

    const handlePayNow = () => {
        if (otp === "1234") { // Mock OTP
            message.success("Payment successful!");
            onPaymentSuccess({ method: "GCash", mobileNumber });
            onClose();
            setOtpSent(false);
            setMobileNumber("");
            setOtp("");
        } else {
            message.error("Invalid OTP. Please try again.");
        }
    };

    return (
        <Modal 
            title="GCash Payment"
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
        >
            <div className="gcash-payment-container">
                <div className={`input-wrapper ${otpSent ? "otp-active" : ""}`}>
                    {/* Mobile Input Section */}
                    <div className="mobile-input">
                        <p>Enter your GCash mobile number:</p>
                        <Input 
                            placeholder="09XXXXXXXXX" 
                            value={mobileNumber} 
                            onChange={(e) => setMobileNumber(e.target.value)} 
                            maxLength={11}
                        />
                        <Button type="primary" onClick={handleSendOtp} block style={{ marginTop: "10px" }}>
                            Send OTP
                        </Button>
                    </div>
                    
                    {/* OTP Input Section */}
                    <div className="otp-input">
                        <p>OTP sent to: <strong>{mobileNumber}</strong></p>
                        <Input 
                            placeholder="Enter OTP" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            maxLength={4}
                        />
                        <Button type="primary" onClick={handlePayNow} block style={{ marginTop: "10px" }}>
                            Pay Now
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default GcashPayment;