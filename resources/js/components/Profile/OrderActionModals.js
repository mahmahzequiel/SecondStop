import React, { useState } from "react";
import { Modal, Button, Radio, Input, Rate, message } from "antd";
import { StarOutlined } from "@ant-design/icons";
import axios from "axios";

const { TextArea } = Input;

const OrderActionModals = ({
  visible,
  modalType,
  onClose,
  order,
  onSuccess,
  actionLoading,
  setActionLoading,
}) => {
  // State for each modal type
  const [cancelReason, setCancelReason] = useState(null);
  const [refundReason, setRefundReason] = useState(null);
  const [cancelNotes, setCancelNotes] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Reset states when modal closes
  const handleClose = () => {
    setCancelReason(null);
    setRefundReason(null);
    setCancelNotes("");
    setRefundNotes("");
    setReviewText("");
    setReviewRating(5);
    setSelectedProductId(null);
    onClose();
  };

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      message.error("Please select a reason for cancellation");
      return;
    }

    // If "Others" is selected, check if the user has provided additional details
    if (cancelReason === "Others" && !cancelNotes.trim()) {
      message.error("Please provide details for 'Others' reason");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      
      // Format the reason with notes for the API
      let requestNotes = cancelReason;
      if (cancelReason === "Others") {
        requestNotes = `Others: ${cancelNotes}`;
      } else if (cancelNotes.trim()) {
        requestNotes = `${cancelReason} - Additional notes: ${cancelNotes}`;
      }
      
      // Use the requestCancellation endpoint
      const response = await axios.post(
        `http://127.0.0.1:8000/api/orders/${order.id}/request-cancellation`,
        { 
          request_notes: requestNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      message.success("Cancellation requested successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to request cancellation:", error);
      message.error("Failed to request cancellation. Please try again later.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!refundReason) {
      message.error("Please select a reason for refund");
      return;
    }

    // If "Others" is selected, check if the user has provided additional details
    if (refundReason === "Others" && !refundNotes.trim()) {
      message.error("Please provide details for 'Others' reason");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      
      // Format the reason with notes for the API
      let requestNotes = refundReason;
      if (refundReason === "Others") {
        requestNotes = `Others: ${refundNotes}`;
      } else if (refundNotes.trim()) {
        requestNotes = `${refundReason} - Additional notes: ${refundNotes}`;
      }
      
      // Use the requestRefund endpoint
      const response = await axios.post(
        `http://127.0.0.1:8000/api/orders/${order.id}/request-refund`,
        { 
          request_notes: requestNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      message.success("Refund requested successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to request refund:", error);
      // Display the actual error message from the server
      const errorMessage = error.response?.data?.error || "Failed to request refund. Please try again later.";
      message.error(errorMessage);
      
      // If the error is related to order status, give better guidance
      if (errorMessage.includes("must be 'shipped' or 'delivered'")) {
        message.info("You can only request refunds for shipped or delivered orders.");
      }
    } finally {
      setActionLoading(false);
    }
};

  const handleSubmitReview = async () => {
    if (!selectedProductId) {
      message.error("Please select a product to review");
      return;
    }

    if (!reviewText.trim()) {
      message.error("Please provide review text");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      
      const response = await axios.post(
        `http://127.0.0.1:8000/api/reviews`,
        { 
          product_id: selectedProductId,
          order_id: order.id,
          rating: reviewRating,
          review_text: reviewText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      message.success("Review submitted successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to submit review:", error);
      message.error("Failed to submit review. Please try again later.");
    } finally {
      setActionLoading(false);
    }
  };

  // Render Cancel Order Modal
  const renderCancelOrderModal = () => (
    <Modal
      title={<div style={{ textAlign: 'center', color: '#333' }}>Request Order Cancellation</div>}
      open={visible && modalType === "cancel"}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} style={{ borderRadius: '4px' }}>
          Back
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={actionLoading}
          onClick={handleCancelOrder}
          style={{ 
            backgroundColor: '#e05d44', 
            borderColor: '#e05d44',
            borderRadius: '4px',
            width: '100%'
          }}
        >
          SUBMIT REQUEST
        </Button>,
      ]}
      bodyStyle={{ padding: '20px', backgroundColor: '#f9d0c4' }}
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <p>Select a reason for cancellation:</p>
      </div>
      
      <Radio.Group 
        onChange={(e) => setCancelReason(e.target.value)} 
        value={cancelReason}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Radio value="Need to change delivery address">Need to change delivery address.</Radio>
        <Radio value="Seller is unresponsive">Seller is unresponsive.</Radio>
        <Radio value="I want to change my order">I want to change my order.</Radio>
        <Radio value="Others">Others.</Radio>
      </Radio.Group>
      
      <div style={{ marginTop: '16px' }}>
        <p>Additional details: {cancelReason === "Others" && <span style={{ color: 'red' }}>*</span>}</p>
        <TextArea
          placeholder={cancelReason === "Others" ? "* Please specify the reason" : "Add any additional information (optional)"}
          value={cancelNotes}
          onChange={(e) => setCancelNotes(e.target.value)}
          style={{ borderRadius: '4px' }}
          rows={3}
        />
      </div>
      
      <div style={{ marginTop: '16px', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Note:</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
          Your cancellation request will be reviewed by our team. You will receive a notification once your request has been processed.
        </p>
      </div>
    </Modal>
  );

  // Render Refund Order Modal
  const renderRefundOrderModal = () => (
    <Modal
      title={<div style={{ textAlign: 'center', color: '#333' }}>Request Return/Refund</div>}
      open={visible && modalType === "refund"}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} style={{ borderRadius: '4px' }}>
          Back
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={actionLoading}
          onClick={handleRefundOrder}
          style={{ 
            backgroundColor: '#e05d44', 
            borderColor: '#e05d44',
            borderRadius: '4px',
            width: '100%'
          }}
        >
          SUBMIT REQUEST
        </Button>,
      ]}
      bodyStyle={{ padding: '20px', backgroundColor: '#f9d0c4' }}
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <p>Select a reason for return/refund:</p>
      </div>
      
      <Radio.Group 
        onChange={(e) => setRefundReason(e.target.value)} 
        value={refundReason}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Radio value="Seller gave the wrong items">Seller gave the wrong items.</Radio>
        <Radio value="Order is incomplete">Order is incomplete.</Radio>
        <Radio value="Damaged Item/s">Damaged Item/s.</Radio>
        <Radio value="Others">Others.</Radio>
      </Radio.Group>
      
      <div style={{ marginTop: '16px' }}>
        <p>Additional details: {refundReason === "Others" && <span style={{ color: 'red' }}>*</span>}</p>
        <TextArea
          placeholder={refundReason === "Others" ? "* Please specify the reason" : "Add any additional information (optional)"}
          value={refundNotes}
          onChange={(e) => setRefundNotes(e.target.value)}
          style={{ borderRadius: '4px' }}
          rows={3}
        />
      </div>
      
      <div style={{ marginTop: '16px', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Note:</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
          Your refund request will be reviewed by our team. You will receive a notification once your request has been processed.
        </p>
      </div>
    </Modal>
  );

  // Render Review Order Modal
  const renderReviewOrderModal = () => (
    <Modal
      title={<div style={{ textAlign: 'center', color: '#333' }}>Rate Product</div>}
      open={visible && modalType === "review"}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} style={{ 
          borderRadius: '4px',
          margin: '0 8px'
        }}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={actionLoading}
          onClick={handleSubmitReview}
          style={{ 
            backgroundColor: '#e05d44', 
            borderColor: '#e05d44',
            borderRadius: '4px',
            margin: '0 8px'
          }}
        >
          Submit
        </Button>,
      ]}
      bodyStyle={{ padding: '20px', backgroundColor: '#f9d0c4' }}
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      {/* Product selector if multiple products in order */}
      {order?.order_items?.length > 1 && (
        <div style={{ marginBottom: '16px' }}>
          <p>Select product to review:</p>
          <Radio.Group 
            onChange={(e) => setSelectedProductId(e.target.value)} 
            value={selectedProductId}
          >
            {order.order_items.map(item => (
              <Radio key={item.product.id} value={item.product.id}>
                {item.product.product_name}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      )}
      
      {/* If only one product, auto-select it */}
      {order?.order_items?.length === 1 && (
        <>
          {!selectedProductId && setSelectedProductId(order.order_items[0].product.id)}
          <p>Reviewing: {order.order_items[0].product.product_name}</p>
        </>
      )}
      
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <Rate 
          onChange={setReviewRating} 
          value={reviewRating} 
          character={<StarOutlined />}
          style={{ fontSize: '32px', color: '#e05d44' }}
        />
      </div>
      
      <TextArea
        placeholder="Tell us how you feel."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        style={{ 
          borderRadius: '16px', 
          padding: '12px',
          minHeight: '120px'
        }}
        rows={4}
      />
    </Modal>
  );

  // Show order status info for modals
  const renderStatusInfo = () => {
    if (!order) return null;
    
    return (
      <div style={{ marginBottom: '16px', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
        <p style={{ margin: 0 }}>
          <strong>Order:</strong> {order.order_number} | <strong>Status:</strong> {order.status}
        </p>
      </div>
    );
  };

  return (
    <>
      {renderCancelOrderModal()}
      {renderRefundOrderModal()}
      {renderReviewOrderModal()}
    </>
  );
};

export default OrderActionModals;