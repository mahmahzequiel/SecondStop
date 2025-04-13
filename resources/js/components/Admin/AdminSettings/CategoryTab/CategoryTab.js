import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Input, Space, Modal, Tag, Select, message } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

// Import modal components directly
import AddCategoryModal from "./AddCategoryModal";
import EditCategoryModal from "./EditCategoryModal";

const CATEGORIES_API = "http://127.0.0.1:8000/api/categories";
const { Option } = Select;

// Configure axios for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]); // Refetch when statusFilter changes

  const fetchCategories = () => {
    setLoading(true);
    
    // Modified API URL to include trashed parameter
    const url = statusFilter === "archived" 
      ? `${CATEGORIES_API}?trashed=only` 
      : CATEGORIES_API;
    
    axios
      .get(url)
      .then((res) => {
        console.log(`${statusFilter} categories response:`, res.data);
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.error("Invalid categories structure:", res.data);
          message.error("Failed to fetch categories");
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        message.error("Error fetching categories");
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
    fetchCategories();
  };

  // Handle edit modal functions
  const handleOpenEditModal = (category) => {
    setSelectedCategory(category);
    setIsEditModalVisible(true);
  };

  const handleCancelEditModal = () => {
    setSelectedCategory(null);
    setIsEditModalVisible(false);
  };

  const handleSaveEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  // Delete category (soft delete / archive)
  const archiveCategory = (categoryId) => {
    Modal.confirm({
      title: "Are you sure you want to archive this category?",
      content: "This will hide it from active view, but you can restore it later.",
      onOk: () => {
        setLoading(true);
        
        axios
          .delete(`${CATEGORIES_API}/${categoryId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          .then((response) => {
            console.log("Archive response:", response);
            message.success("Category archived successfully!");
            fetchCategories();
          })
          .catch((err) => {
            console.error("Error archiving category:", err);
            message.error("An error occurred while archiving the category");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Restore archived category
  const restoreCategory = (categoryId) => {
    Modal.confirm({
      title: "Are you sure you want to restore this category?",
      content: "This will make it active again.",
      onOk: () => {
        setLoading(true);
        
        axios
          .put(`${CATEGORIES_API}/${categoryId}/restore`, {}, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
          .then((response) => {
            console.log("Restore response:", response);
            message.success("Category restored successfully!");
            fetchCategories();
          })
          .catch((err) => {
            console.error("Error restoring category:", err);
            message.error("An error occurred while restoring the category");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Bulk archive selected categories
  const handleBulkArchive = () => {
    if (selectedRowKeys.length === 0) {
      message.info("Please select at least one category to archive");
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to archive ${selectedRowKeys.length} categories?`,
      content: "This action can be reversed later.",
      onOk: () => {
        const archivePromises = selectedRowKeys.map(categoryId =>
          axios.delete(`${CATEGORIES_API}/${categoryId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        );

        setLoading(true);
        Promise.all(archivePromises)
          .then(() => {
            message.success(`${selectedRowKeys.length} categories archived successfully!`);
            fetchCategories();
            setSelectedRowKeys([]);
          })
          .catch(err => {
            console.error("Error archiving categories:", err);
            message.error("An error occurred while archiving the categories");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Bulk restore selected categories
  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) {
      message.info("Please select at least one category to restore");
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to restore ${selectedRowKeys.length} categories?`,
      content: "This will make them active again.",
      onOk: () => {
        const restorePromises = selectedRowKeys.map(categoryId =>
          axios.post(`${CATEGORIES_API}/${categoryId}/restore`, {}, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        );

        setLoading(true);
        Promise.all(restorePromises)
          .then(() => {
            message.success(`${selectedRowKeys.length} categories restored successfully!`);
            fetchCategories();
            setSelectedRowKeys([]);
          })
          .catch(err => {
            console.error("Error restoring categories:", err);
            message.error("An error occurred while restoring the categories");
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
                style={{ cursor: "pointer" }}
                onClick={() => archiveCategory(record.id)}
                title="Archive"
              />
            ) : (
              <UndoOutlined
                style={{ cursor: "pointer", color: "#52c41a" }}
                onClick={() => restoreCategory(record.id)}
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
        title: "Category Name",
        dataIndex: "category_name",
        key: "category_name",
        render: (text) => <Tag color={statusFilter === "active" ? "green" : "default"}>{text}</Tag>,
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

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    (category.category_name || "").toLowerCase().includes(search.toLowerCase())
  );

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
      <h2 style={{ marginBottom: "20px" }}>Categories Management</h2>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <Space>
          <Input
            placeholder="Search by name"
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
                Add Category
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
        dataSource={filteredCategories}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{ 
          emptyText: `No ${statusFilter} categories found matching the current search` 
        }}
      />

      {/* Integrated Add Category Modal */}
      <AddCategoryModal
        visible={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
      />

      {/* Integrated Edit Category Modal */}
      {isEditModalVisible && (
        <EditCategoryModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveEditModal}
          category={selectedCategory}
        />
      )}
    </div>
  );
}

export default CategoryTab;