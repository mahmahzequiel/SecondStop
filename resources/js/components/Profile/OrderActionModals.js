import React, { useState } from "react";
import { Modal, Button, Radio, Input, Rate, message, Upload } from "antd";
import { StarOutlined, UploadOutlined } from "@ant-design/icons";
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
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  // Reset states when modal closes
  const handleClose = () => {
    setCancelReason(null);
    setRefundReason(null);
    setCancelNotes("");
    setRefundNotes("");
    setReviewText("");
    setReviewRating(5);
    setSelectedProductId(null);
    setFileList([]);
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
    if (!reviewText.trim()) {
      message.error("Please provide review text");
      return;
    }

    if (reviewText.trim().length < 10) {
      message.error("Review text must be at least 10 characters long");
      return;
    }

    // For multi-product orders, ensure a product is selected
    if (order?.order_items?.length > 1 && !selectedProductId) {
      message.error("Please select a product to review");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("userToken");
      
      // Create FormData properly
      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('rating', reviewRating);
      formData.append('review_text', reviewText);
      
      if (selectedProductId) {
        formData.append('product_id', selectedProductId);
      }
      
      // Properly handle file upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('review_image', fileList[0].originFileObj, fileList[0].name);
      }

      // Debug: Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/api/store-reviews`,
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      message.success("Review submitted successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Submission error:", error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        message.error(
          <div>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {Object.entries(errors).map(([field, messages]) => (
                messages.map((msg, i) => <li key={`${field}-${i}`}>{msg}</li>)
              ))}
            </ul>
          </div>,
          10
        );
      } else {
        message.error(error.response?.data?.message || "Failed to submit review.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Image upload handler functions
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const handlePreviewCancel = () => setPreviewVisible(false);

  const uploadProps = {
    onRemove: file => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: file => {
      // Check file type
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      
      // Check file size (2MB max)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      
      // Add file to state
      setFileList([{
        uid: file.uid,
        name: file.name,
        status: 'done',
        originFileObj: file
      }]);
      return false; // Prevent auto upload
    },
    fileList,
    accept: 'image/*',
    multiple: false,
    maxCount: 1
  };

  // Helper function to get base64 from file
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Render Cancel Order Modal
  const renderCancelOrderModal = () => (
    <Modal
      title={<div style={{ textAlign: 'center', color: '#333' }}>Request Order Cancellation</div>}
      open={visible && modalType === "cancel"}
      onCancel={handleClose}
      footer={[
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
      bodyStyle={{ padding: '20px' }}
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <div style={{ marginBottom: '30px', fontSize:'15px' }}>
        <p>SELECT A REASON FOR CANCELLATION:</p>
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
      bodyStyle={{ padding: '20px' }}
      style={{ borderRadius: '8px', overflow: 'hidden' }}
    >
      <div style={{ marginBottom: '30px', fontSize: '15px' }}>
      <p>SELECT A REASON FOR REFUND:</p>
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
      title={<div style={{ textAlign: 'center' }}>Rate Product</div>}
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
      bodyStyle={{ padding: '20px' }}
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

      {/* Add Image Upload Section */}
      <div style={{ marginTop: '16px' }}>
        <p style={{ marginBottom: '8px' }}>Add a photo of the product (optional):</p>
        <Upload
          {...uploadProps}
          listType="picture-card"
          onPreview={handlePreview}
        >
          {fileList.length < 1 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
        <p style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
          Share a photo of the product (JPEG, PNG or GIF up to 2MB)
        </p>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title="Image Preview"
        footer={null}
        onCancel={handlePreviewCancel}
      >
        <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
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