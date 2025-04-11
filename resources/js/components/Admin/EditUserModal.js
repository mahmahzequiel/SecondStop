import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Row, Col, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const PROFILE_UPDATE_API = "http://127.0.0.1:8000/api/profile/update";

const EditProfileModal = ({ visible, onCancel, onSave, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fileList, setFileList] = useState([]);

  // Reset form and populate with user data when modal opens or user changes
  useEffect(() => {
    if (visible && user && user.profile) {
      // Set all form fields (include user_id so that admin updates send the correct target id)
      form.setFieldsValue({
        user_id: user.id, // hidden field for identifying the customer
        first_name: user.profile.first_name || '',
        middle_name: user.profile.middle_name || '',
        last_name: user.profile.last_name || '',
        username: user.profile.username || '',
        email: user.profile.email || '',
        phone_number: user.profile.phone_number || '',
        sex: user.profile.sex || 'Male',
        role_id: user.role_id || 1,
      });
      
      if (user.profile.profile_image && user.profile.profile_image !== 'default.jpg') {
        setImageUrl(`/storage/${user.profile.profile_image}`);
      } else {
        setImageUrl('');
      }
      setFileList([]);
    }
  }, [visible, user, form]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    return false; // Prevent automatic upload
  };

  const handleChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        setLoading(true);
        
        // Create FormData and include all fields
        const formData = new FormData();
        formData.append('first_name', values.first_name);
        formData.append('middle_name', values.middle_name || '');
        formData.append('last_name', values.last_name);
        formData.append('username', values.username);
        formData.append('email', values.email);
        formData.append('phone_number', values.phone_number);
        formData.append('sex', values.sex);
        formData.append('role_id', values.role_id);
        
        // Append user_id if present (for admin editing a customer)
        if (values.user_id) {
          formData.append('user_id', values.user_id);
        }

        // Only append file if a new one is selected
        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append('profile_image', fileList[0].originFileObj);
        }

        // Make API request to update profile
        axios.post(PROFILE_UPDATE_API, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true // Include cookies for authentication
        })
          .then(response => {
            if (response.data?.status) {
              message.success(response.data.message || 'Profile updated successfully');
              
              // Call onSave with the updated profile
              if (onSave && response.data.profile) {
                onSave(response.data.profile);
              }
            } else {
              message.error(response.data.message || 'Failed to update profile');
            }
          })
          .catch(error => {
            console.error('Error updating profile:', error);
            
            // Handle validation errors from the backend
            if (error.response?.data?.errors) {
              const backendErrors = error.response.data.errors;
              
              form.setFields(
                Object.keys(backendErrors).map(name => ({
                  name,
                  errors: [backendErrors[name][0]],
                }))
              );
            } else {
              message.error(error.response?.data?.message || 'An error occurred while updating the profile');
            }
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title="Edit Profile"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          style={{ backgroundColor: "#A63F3F" }}
        >
          Save Changes
        </Button>,
      ]}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sex: 'Male', // Default value
        }}
        preserve={false} // Don't preserve form data when unmounted
      >
        {/* Hidden field for user_id */}
        <Form.Item name="user_id" hidden>
          <Input />
        </Form.Item>
        <Row gutter={16}>
          {/* First Row */}
          <Col span={4.8}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="First Name" />
            </Form.Item>
          </Col>
          <Col span={4.8}>
            <Form.Item
              name="middle_name"
              label="Middle Name"
            >
              <Input placeholder="Middle Name" />
            </Form.Item>
          </Col>
          <Col span={4.8}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="Last Name" />
            </Form.Item>
          </Col>
          <Col span={4.8}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input placeholder="Username" />
            </Form.Item>
          </Col>
          <Col span={4.8}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
          
          {/* Second Row */}
          <Col span={4.8}>
            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="Phone Number" />
            </Form.Item>
          </Col>
          <Col span={4.8}>
  <Form.Item
    name="role_id"
    label="Role"
    rules={[{ required: true, message: 'Please select role' }]}
  >
    <Select placeholder="Select Role">
      <Option value={2}>Admin</Option>
      <Option value={1}>Customer</Option>
    </Select>
  </Form.Item>
</Col>
          <Col span={4.8}>
            <Form.Item
              name="sex"
              label="Sex"
              rules={[{ required: true, message: 'Please select sex' }]}
            >
              <Select placeholder="Select sex">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={14.4}>
            <Form.Item
              name="profile_image"
              label="Profile Image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <Upload
                listType="picture"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
            </Form.Item>
            {imageUrl && (
              <div style={{ marginTop: 8 }}>
                <p>Current profile image:</p>
                <img src={imageUrl} alt="profile" style={{ maxWidth: '100%', maxHeight: 200 }} />
              </div>
            )}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;