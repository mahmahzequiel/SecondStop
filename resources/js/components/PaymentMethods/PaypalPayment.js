import React, { useState } from "react";
import { Modal, Input, Button, Steps, Typography, Result } from "antd";

const { Step } = Steps;
const { Title, Text } = Typography;

const PaypalPayment = ({ isVisible, onClose, onPaymentSuccess }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Handle Proceed to Payment
    const handleProceed = () => {
        if (email && email.includes("@")) {
            setCurrentStep(1);
        } else {
            setCurrentStep(0);
        }
    };

    // Handle Payment Process
    const handlePayNow = () => {
        setLoading(true);
        setTimeout(() => {
            setPaymentSuccess(true);
            onPaymentSuccess({ method: "PayPal", email });

            setTimeout(() => {
                handleReset();
            }, 2000);
        }, 1500);
    };

    // Reset Modal
    const handleReset = () => {
        setCurrentStep(0);
        setEmail("");
        setLoading(false);
        setPaymentSuccess(false);
        onClose();
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img 
                        src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                        alt="PayPal" 
                        style={{ height: "24px" }} 
                    />
                    <span>PayPal Payment</span>
                </div>
            }
            open={isVisible}
            onCancel={handleReset}
            footer={null}
            centered
        >
            {/* Show Payment Success Message */}
            {paymentSuccess ? (
                <Result
                    status="success"
                    title="Payment Successful!"
                    subTitle={`You have successfully paid using PayPal (${email}).`}
                />
            ) : (
                <>
                    {/* Steps Navigation */}
                    <Steps current={currentStep} style={{ marginBottom: "20px" }}>
                        <Step title="Enter Email" />
                        <Step title="Confirm Payment" />
                    </Steps>

                    {/* Step 1: Enter PayPal Email */}
                    {currentStep === 0 && (
                        <div className="paypal-step">
                            <Title level={5} style={{ color: "#003087" }}>
                                Enter your PayPal Email
                            </Title>
                            <Input
                                type="email"
                                placeholder="your-email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ marginBottom: "10px" }}
                            />
                            <Button
                                type="primary"
                                block
                                onClick={handleProceed}
                                style={{ backgroundColor: "#003087", borderColor: "#003087" }}
                            >
                                Proceed to Payment
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Confirm Payment */}
                    {currentStep === 1 && (
                        <div className="paypal-step">
                            <Title level={5} style={{ color: "#003087" }}>
                                Confirm Your Payment
                            </Title>
                            <Text>Paying with: <strong>{email}</strong></Text>
                            <Button
                                type="primary"
                                block
                                onClick={handlePayNow}
                                loading={loading}
                                style={{ 
                                    backgroundColor: "#FFC439", 
                                    borderColor: "#FFC439", 
                                    color: "#111" 
                                }}
                            >
                                Pay Now
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

export default PaypalPayment;