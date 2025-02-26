import React, { useState } from "react";

const GcashPayment = ({ onPaymentSuccess }) => {
    const [mobileNumber, setMobileNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOtp = () => {
        // Simulate sending OTP
        setOtpSent(true);
        alert("OTP sent to your mobile number!");
    };

    const handlePayNow = () => {
        // Simulate OTP verification
        if (otp === "1234") { // Mock OTP
            onPaymentSuccess({ method: "GCash", mobileNumber });
        } else {
            alert("Invalid OTP. Please try again.");
        }
    };

    return (
        <div className="payment-form">
            <h3>GCash Payment</h3>
            <p>Enter your GCash mobile number:</p>
            <input
                type="text"
                placeholder="GCash Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
            />
            {!otpSent ? (
                <button onClick={handleSendOtp}>Send OTP</button>
            ) : (
                <>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={handlePayNow}>Pay Now</button>
                </>
            )}
        </div>
    );
};

export default GcashPayment;