import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Input, Space, Modal, Tag, Select, message } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

// Import modal components directly
import AddCategoryTypeModal from "./AddCategoryTypeModal";
import EditCategoryTypeModal from "./EditCategoryTypeModal";

const CATEGORY_TYPES_API = "http://127.0.0.1:8000/api/category-types";
const { Option } = Select;

// Configure axios for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

function CategoryTypeTab() {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoryTypes();
  }, [statusFilter]); // Refetch when statusFilter changes

  const fetchCategoryTypes = () => {
    setLoading(true);
    setError(null);
    
    axios
      .get(`${CATEGORY_TYPES_API}?status=${statusFilter}`)
      .then((res) => {
        console.log(`${statusFilter} category types response:`, res.data);
        if (Array.isArray(res.data)) {
          setCategoryTypes(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          // Handle Laravel API resource format
          setCategoryTypes(res.data.data);
        } else {
          console.error("Invalid category types structure:", res.data);
          setError("Failed to parse category types data");
          message.error("Failed to fetch category types");
        }
      })
      .catch((err) => {
        console.error("Error fetching category types:", err);
        setError(`Error: ${err.message || "Unknown error"}`);
        message.error("Error fetching category types");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle add modal functions
  const handleOpenAddModal = () => setIsAddModalVisible(true);
  const handleCancelAddModal = () => setIsAddModalVisible(false);
  const handleSaveAddModal = () => {
    setIsAddModalVisible(false);
    fetchCategoryTypes();
  };

  // Handle edit modal functions
  const handleOpenEditModal = (categoryType) => {
    setSelectedCategoryType(categoryType);
    setIsEditModalVisible(true);
  };

  const handleCancelEditModal = () => {
    setSelectedCategoryType(null);
    setIsEditModalVisible(false);
  };

  const handleSaveEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedCategoryType(null);
    fetchCategoryTypes();
  };

  // Delete category type (soft delete / archive)
  const archiveCategoryType = (categoryTypeId) => {
    Modal.confirm({
      title: "Are you sure you want to archive this category type?",
      content: "This will hide it from active view, but you can restore it later.",
      onOk: () => {
        setLoading(true);
        
        axios
          .delete(`${CATEGORY_TYPES_API}/${categoryTypeId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          .then((response) => {
            console.log("Archive response:", response);
            message.success("Category type archived successfully!");
            fetchCategoryTypes();
          })
          .catch((err) => {
            console.error("Error archiving category type:", err);
            message.error("An error occurred while archiving the category type");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Restore archived category type - FIXED METHOD TYPE TO PUT
  const restoreCategoryType = (categoryTypeId) => {
    Modal.confirm({
      title: "Are you sure you want to restore this category type?",
      content: "This will make it active again.",
      onOk: () => {
        setLoading(true);
        
        axios
          .put(`${CATEGORY_TYPES_API}/${categoryTypeId}/restore`, {}, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          .then((response) => {
            console.log("Restore response:", response);
            message.success("Category type restored successfully!");
            fetchCategoryTypes();
          })
          .catch((err) => {
            console.error("Error restoring category type:", err);
            message.error("An error occurred while restoring the category type");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Bulk delete/archive selected category types
  const handleBulkArchive = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ 
        title: 'No category types selected', 
        content: 'Please select at least one category type to archive.' 
      });
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to archive ${selectedRowKeys.length} category types?`,
      content: "This action can be reversed later.",
      onOk: () => {
        const archivePromises = selectedRowKeys.map(categoryTypeId =>
          axios.delete(`${CATEGORY_TYPES_API}/${categoryTypeId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        );

        setLoading(true);
        Promise.all(archivePromises)
          .then(() => {
            message.success(`${selectedRowKeys.length} category types archived successfully!`);
            fetchCategoryTypes();
            setSelectedRowKeys([]);
          })
          .catch(err => {
            console.error("Error archiving category types:", err);
            message.error("An error occurred while archiving the category types");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Bulk restore selected category types - FIXED METHOD TYPE TO PUT
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ 
        title: 'No category types selected', 
        content: 'Please select at least one category type to restore.' 
      });
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to restore ${selectedRowKeys.length} category types?`,
      content: "This will make them active again.",
      onOk: () => {
        const restorePromises = selectedRowKeys.map(categoryTypeId =>
          axios.put(`${CATEGORY_TYPES_API}/${categoryTypeId}/restore`, {}, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        );

        setLoading(true);
        Promise.all(restorePromises)
          .then(() => {
            message.success(`${selectedRowKeys.length} category types restored successfully!`);
            fetchCategoryTypes();
            setSelectedRowKeys([]);
          })
          .catch(err => {
            console.error("Error restoring category types:", err);
            message.error("An error occurred while restoring the category types");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Define table columns based on status filter
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Space size="small">
            <EditOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleOpenEditModal(record)}
            />
            {statusFilter === "active" ? (
              <InboxOutlined
                style={{ cursor: "pointer"}}
                onClick={() => archiveCategoryType(record.id)}
                title="Archive"
              />
            ) : (
              <UndoOutlined
                style={{ cursor: "pointer", color: "#52c41a" }}
                onClick={() => restoreCategoryType(record.id)}
                title="Restore"
              />
            )}
          </Space>
        ),
      },
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Category Type",
        dataIndex: "category_type",
        key: "category_type",
        render: (text) => <Tag color={statusFilter === "active" ? "purple" : "default"}>{text}</Tag>,
      },
      {
        title: "Created At",
        dataIndex: "created_at",
        key: "created_at",
        render: (date) => date ? new Date(date).toLocaleDateString() : "-",
      },
      {
        title: "Updated At",
        dataIndex: "updated_at",
        key: "updated_at",
        render: (date) => date ? new Date(date).toLocaleDateString() : "-",
      }
    ];
    
    // Add deleted_at column for archived items
    if (statusFilter === "archived") {
      baseColumns.push({
        title: "Archived At",
        dataIndex: "deleted_at",
        key: "deleted_at",
        render: (date) => date ? new Date(date).toLocaleDateString() : "-",
      });
    }
    
    return baseColumns;
  };

  // Filter category types based on search - IMPROVED NULL CHECKING
  const filteredCategoryTypes = categoryTypes.filter((categoryType) => {
    if (!categoryType) return false;
    const type = ((categoryType.category_type || "").toString()).toLowerCase();
    const categoryName = ((categoryType.category?.name || "").toString()).toLowerCase();
    return type.includes(search.toLowerCase()) || categoryName.includes(search.toLowerCase());
  });

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  // Options for status filter dropdown
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" }
  ];
  
  // If there was an error loading the component, show an error message
  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Category Types Management</h2>
        <div style={{ 
          padding: "20px", 
          background: "#fff1f0", 
          border: "1px solid #ffa39e", 
          borderRadius: "4px",
          marginTop: "16px"
        }}>
          <h3>Error Loading Category Types</h3>
          <p>{error}</p>
          <Button 
            type="primary" 
            onClick={fetchCategoryTypes}
            style={{ marginTop: "10px" }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Category Types Management</h2>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <Space>
          <Input
            placeholder="Search by name or category"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200, backgroundColor: "#FFFFFF" }}
          />
          
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setSelectedRowKeys([]);
            }}
            style={{ width: 120 }}
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Space>

        <Space>
          {/* FIXED: Always show Add button regardless of filter */}
          <Button
            type="primary"
            onClick={handleOpenAddModal}
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#A63F3F" }}
          >
            Add Category Type
          </Button>
          
          {statusFilter === "active" ? (
            <Button
              type="primary"
              danger
              onClick={handleBulkArchive}
              disabled={selectedRowKeys.length === 0}
            >
              Archive Selected
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleBulkRestore}
              disabled={selectedRowKeys.length === 0}
              icon={<UndoOutlined />}
              style={{ backgroundColor: "#52c41a" }}
            >
              Restore Selected
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={getColumns()}
        dataSource={filteredCategoryTypes}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{ 
          emptyText: `No ${statusFilter} category types found matching the current search` 
        }}
      />

      {/* FIXED: Updated modal property from 'visible' to 'open' */}
      <AddCategoryTypeModal
        open={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
      />

      {/* FIXED: Updated modal property from 'visible' to 'open' */}
      {isEditModalVisible && (
        <EditCategoryTypeModal
          open={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveEditModal}
          categoryType={selectedCategoryType}
        />
      )}
    </div>
  );
}

export default CategoryTypeTab;