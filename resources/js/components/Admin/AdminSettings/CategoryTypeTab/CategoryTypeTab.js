import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Input, Space, Modal, Tag, Select, message } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

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

  useEffect(() => {
    fetchCategoryTypes();
  }, [statusFilter]); // Refetch when statusFilter changes

  const fetchCategoryTypes = () => {
    setLoading(true);
    axios
      .get(`${CATEGORY_TYPES_API}?status=${statusFilter}`)
      .then((res) => {
        console.log(`${statusFilter} category types response:`, res.data);
        if (Array.isArray(res.data)) {
          setCategoryTypes(res.data);
        } else {
          console.error("Invalid category types structure:", res.data);
          message.error("Failed to fetch category types");
        }
      })
      .catch((err) => {
        console.error("Error fetching category types:", err);
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

  // Restore archived category type
  const restoreCategoryType = (categoryTypeId) => {
    Modal.confirm({
      title: "Are you sure you want to restore this category type?",
      content: "This will make it active again.",
      onOk: () => {
        setLoading(true);
        
        axios
          .post(`${CATEGORY_TYPES_API}/${categoryTypeId}/restore`, {}, {
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
      message.info("Please select at least one category type to archive");
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

  // Bulk restore selected category types
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      message.info("Please select at least one category type to restore");
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to restore ${selectedRowKeys.length} category types?`,
      content: "This will make them active again.",
      onOk: () => {
        const restorePromises = selectedRowKeys.map(categoryTypeId =>
          axios.post(`${CATEGORY_TYPES_API}/${categoryTypeId}/restore`, {}, {
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
              <DeleteOutlined
                style={{ cursor: "pointer", color: "#ff4d4f" }}
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

  // Filter category types based on search
  const filteredCategoryTypes = categoryTypes.filter((categoryType) => {
    const type = (categoryType.category_type || "").toLowerCase();
    const categoryName = (categoryType.category?.name || "").toLowerCase();
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
          {statusFilter === "active" && (
            <>
              <Button
                type="primary"
                onClick={handleOpenAddModal}
                icon={<PlusOutlined />}
                style={{ backgroundColor: "#A63F3F" }}
              >
                Add Category Type
              </Button>
              <Button
                danger
                onClick={handleBulkArchive}
                disabled={selectedRowKeys.length === 0}
              >
                Archive Selected
              </Button>
            </>
          )}
          
          {statusFilter === "archived" && (
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

      {/* Integrated Add Category Type Modal */}
      <AddCategoryTypeModal
        visible={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
      />

      {/* Integrated Edit Category Type Modal */}
      {isEditModalVisible && (
        <EditCategoryTypeModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveEditModal}
          categoryType={selectedCategoryType}
        />
      )}
    </div>
  );
}

export default CategoryTypeTab;