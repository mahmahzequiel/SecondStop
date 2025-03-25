// ForgotPassword.js
import React, { useState } from "react";
import { Modal, Input, Button, Steps, Typography, Result, message } from "antd";
import axios from "axios";

const { Step } = Steps;
const { Title, Text } = Typography;

export default function ForgotPassword({ visible, onClose, onResetSuccess }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Step 0: Request OTP
  const handleSendOtp = async () => {
    if (!email.endsWith("@gmail.com")) {
      message.error("Please enter a valid Gmail address.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/forgot-password", { email });
      if (response.data.status) {
        setGeneratedOtp(response.data.otp);
        message.success("OTP generated successfully.");
        // Proceed to OTP verification step
        setTimeout(() => setCurrentStep(1), 500);
      } else {
        message.error(response.data.message || "Error generating OTP.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Error processing request.");
    }
    setLoading(false);
  };

  // Step 1: Verify OTP
  const handleVerifyOtp = () => {
    if (otp === generatedOtp.toString()) {
      message.success("OTP verified. Please enter your new password.");
      // Proceed to reset password step
      setCurrentStep(2);
    } else {
      message.error("Invalid OTP. Please try again.");
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      message.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      message.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      // Send request to update password (you need to implement this endpoint)
      const response = await axios.post("http://127.0.0.1:8000/api/reset-password", {
        email,
        new_password: newPassword,
        otp  // Optional: include the OTP for extra verification if needed
      });
      if (response.data.status) {
        setResetSuccess(true);
        message.success("Password reset successfully.");
        onResetSuccess && onResetSuccess(email);
        setTimeout(() => handleReset(), 2000);
      } else {
        message.error(response.data.message || "Error resetting password.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Error processing request.");
    }
    setLoading(false);
  };

  // Reset modal state
  const handleReset = () => {
    setCurrentStep(0);
    setEmail("");
    setOtp("");
    setGeneratedOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setLoading(false);
    setResetSuccess(false);
    onClose && onClose();
  };

  return (
    <Modal
      title="Forgot Password"
      visible={visible}
      onCancel={handleReset}
      footer={null}
      centered
    >
      {resetSuccess ? (
        <Result
          status="success"
          title="Password Reset!"
          subTitle="Your password has been updated successfully."
        />
      ) : (
        <>
          <Steps current={currentStep} style={{ marginBottom: "20px" }}>
            <Step title="Enter Email" />
            <Step title="Verify OTP" />
            <Step title="Reset Password" />
          </Steps>
          {currentStep === 0 && (
            <div className="forgot-step">
              <Title level={5}>Enter your Gmail Address</Title>
              <Input
                type="email"
                placeholder="your-email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: "10px" }}
              />
              <Button type="primary" onClick={handleSendOtp} loading={loading} block>
                Send OTP
              </Button>
            </div>
          )}
          {currentStep === 1 && (
            <div className="forgot-step">
              {generatedOtp && (
                <div
                  style={{
                    background: "#f6ffed",
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #b7eb8f",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}
                >
                  <Text strong style={{ color: "#52c41a" }}>Your OTP: {generatedOtp}</Text>
                </div>
              )}
              <Title level={5}>Enter the OTP</Title>
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
                style={{ marginBottom: "10px" }}
              />
              <Button type="primary" onClick={handleVerifyOtp} block>
                Verify OTP
              </Button>
            </div>
          )}
          {currentStep === 2 && (
            <div className="forgot-step">
              <Title level={5}>Reset Your Password</Title>
              <Input.Password
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ marginBottom: "10px" }}
              />
              <Input.Password
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                style={{ marginBottom: "10px" }}
              />
              <Button type="primary" onClick={handleResetPassword} loading={loading} block>
                Reset Password
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
