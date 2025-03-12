import React, { useState } from "react";
import { Modal, Input, Button, message, Steps, Typography, Result } from "antd";

const { Step } = Steps;
const { Title, Text } = Typography;

const GcashPayment = ({ visible, onClose, onPaymentSuccess }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [mobileNumber, setMobileNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Function to generate a random 4-digit OTP
    const generateOtp = () => {
        return Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit OTP
    };

    // Handle sending OTP
    const handleSendOtp = () => {
        if (/^09\d{9}$/.test(mobileNumber)) {
            const newOtp = generateOtp();
            setGeneratedOtp(newOtp);
            message.success("OTP sent to your GCash number!");
            setTimeout(() => setCurrentStep(1), 500); // Move to the next step
        } else {
            message.error("Please enter a valid 11-digit GCash number (09XXXXXXXXX).");
        }
    };

    // Handle Payment Confirmation
    const handlePayNow = () => {
        if (otp === generatedOtp) { // Check if entered OTP matches the generated one
            setLoading(true);
            setTimeout(() => {
                setPaymentSuccess(true); // Show success message
                message.success("Payment successful!");
                onPaymentSuccess({ method: "GCash", mobileNumber });

                // Reset after showing success message
                setTimeout(() => {
                    handleReset();
                }, 2000);
            }, 1500);
        } else {
            message.error("Invalid OTP. Please try again.");
        }
    };

    // Reset Modal State
    const handleReset = () => {
        setCurrentStep(0);
        setMobileNumber("");
        setOtp("");
        setGeneratedOtp("");
        setLoading(false);
        setPaymentSuccess(false);
        onClose();
    };

    return (
        <Modal
            title="GCash Payment"
            open={visible}
            onCancel={handleReset}
            footer={null}
            centered
        >
            {/* Show payment success message */}
            {paymentSuccess ? (
                <Result
                    status="success"
                    title="Payment Successful!"
                    subTitle={`You have successfully paid using GCash with number ${mobileNumber}`}
                />
            ) : (
                <>
                    {/* Display OTP at the top */}
                    {generatedOtp && currentStep === 1 && (
                        <div style={{
                            background: "#f6ffed",
                            padding: "10px",
                            borderRadius: "5px",
                            border: "1px solid #b7eb8f",
                            textAlign: "center",
                            marginBottom: "15px"
                        }}>
                            <Text strong style={{ color: "#52c41a" }}>Your OTP: {generatedOtp}</Text>
                        </div>
                    )}

                    {/* Steps Navigation */}
                    <Steps current={currentStep} style={{ marginBottom: "20px" }}>
                        <Step title="Enter Number" />
                        <Step title="Confirm Payment" />
                    </Steps>

                    {/* Step 1: Enter Mobile Number */}
                    {currentStep === 0 && (
                        <div className="gcash-step">
                            <Title level={5}>Enter your GCash Mobile Number</Title>
                            <Input
                                placeholder="09XXXXXXXXX"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                maxLength={11}
                                style={{ marginBottom: "10px" }}
                            />
                            <Button type="primary" onClick={handleSendOtp} block>
                                Send OTP
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Confirm Payment */}
                    {currentStep === 1 && (
                        <div className="gcash-step">
                            <Title level={5}>Confirm Payment</Title>
                            <Text>OTP has been sent to <strong>{mobileNumber}</strong></Text>
                            <Input
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={4}
                                style={{ marginTop: "10px", marginBottom: "10px" }}
                            />
                            <Button type="primary" onClick={handlePayNow} loading={loading} block>
                                Pay Now
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

export default GcashPayment;
