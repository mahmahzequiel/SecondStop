import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../../AdminReusable/AdminPage";
import { 
  Table, 
  Button, 
  Input, 
  message, 
  Space, 
  Pagination, 
  Modal, 
  Tag,
  Select
} from "antd";
import AddSackModal from "./AddSackModal";
import EditSackModal from "./EditSackModal";
import { EditOutlined, DeleteOutlined, UndoOutlined, PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const AdminSacks = () => {
  const [sacks, setSacks] = useState([]);
  const [filteredSacks, setFilteredSacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(
    localStorage.getItem("selectedStatus") || "active"
  );
  const [isAddSackModalVisible, setIsAddSackModalVisible] = useState(false);
  const [isEditSackModalVisible, setIsEditSackModalVisible] = useState(false);
  const [selectedSack, setSelectedSack] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchSacks = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/sacks", {
        params: { status: selectedStatus },
      });
      setSacks(response.data);
      setFilteredSacks(response.data);
      setTotal(response.data.length);
    } catch (error) {
      setError("Error fetching sacks.");
      console.error("Error fetching sacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCategoryTypes = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/category-types");
      setCategoryTypes(response.data);
    } catch (error) {
      console.error("Error fetching category types:", error);
    }
  };

  useEffect(() => {
    fetchSacks();
    fetchCategories();
    fetchCategoryTypes();
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem("selectedStatus", selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    let filtered = sacks.filter((sack) =>
      sack.sack_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    setFilteredSacks(filtered);
    setTotal(filtered.length);
    setCurrentPage(1);
  }, [searchQuery, sacks]);

  // ... (keep all your existing handler functions unchanged) ...

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => handleOpenEditModal(record)}
          />
          {selectedStatus === "archived" || record.deleted_at ? (
            <UndoOutlined
              style={{ cursor: "pointer", color: "#52c41a" }}
              onClick={() => handleRestore(record.id)}
              title="Restore"
            />
          ) : (
            <DeleteOutlined
              style={{ cursor: "pointer", color: "#ff4d4f" }}
              onClick={() => handleDelete(record.id)}
              title="Delete"
            />
          )}
        </Space>
      ),
    },
    {
      title: "Sack Code",
      dataIndex: "sack_code",
      key: "sack_code",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (_, record) => record.category?.category_name || 'N/A'
    },
    {
      title: "Category Type",
      dataIndex: "category_type",
      key: "category_type",
      render: (_, record) => record.category_type?.category_type || 'N/A'
    },
    {
      title: "Total Items",
      dataIndex: "total_items",
      key: "total_items",
    },
    {
      title: "Available Items",
      dataIndex: "available_items",
      key: "available_items",
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "Sold Items",
      dataIndex: "sold_items",
      key: "sold_items",
      render: (text) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: "Estimated Pieces",
      dataIndex: "estimated_pieces",
      key: "estimated_pieces",
      render: (text) => text || 'N/A',
    },
    {
      title: "Buying Price",
      dataIndex: "buying_price",
      key: "buying_price",
      render: (price) => `PHP${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.deleted_at ? "red" : "green"}>
          {record.deleted_at ? "Deleted" : "Active"}
        </Tag>
      ),
    },
  ];

  // Add these functions before the return statement

// Handle opening edit modal
const handleOpenEditModal = (record) => {
  setSelectedSack(record);
  setIsEditSackModalVisible(true);
};

// Handle saving edits
const handleSaveEdit = async (updatedSack) => {
  try {
    await axios.put(`http://127.0.0.1:8000/api/sacks/${updatedSack.id}`, updatedSack);
    message.success("Sack updated successfully");
    setIsEditSackModalVisible(false);
    fetchSacks();
  } catch (error) {
    message.error("Failed to update sack");
    console.error("Error updating sack:", error);
  }
};

// Handle delete single sack
const handleDelete = (id) => {
  Modal.confirm({
    title: "Are you sure you want to delete this sack?",
    content: "This action can be reversed later.",
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk: async () => {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/sacks/${id}`);
        message.success("Sack deleted successfully");
        fetchSacks();
      } catch (error) {
        message.error("Failed to delete sack");
        console.error("Error deleting sack:", error);
      }
    },
  });
};

// Handle restore single sack
const handleRestore = async (id) => {
  try {
    await axios.put(`http://127.0.0.1:8000/api/sacks/${id}/restore`);
    message.success("Sack restored successfully");
    fetchSacks();
  } catch (error) {
    message.error("Failed to restore sack");
    console.error("Error restoring sack:", error);
  }
};

// Handle bulk delete
const handleBulkDelete = () => {
  Modal.confirm({
    title: "Are you sure you want to delete selected sacks?",
    content: "This action can be reversed later.",
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk: async () => {
      try {
        await axios.post("http://127.0.0.1:8000/api/sacks/bulk-delete", {
          ids: selectedRowKeys,
        });
        message.success("Selected sacks deleted successfully");
        setSelectedRowKeys([]);
        fetchSacks();
      } catch (error) {
        message.error("Failed to delete selected sacks");
        console.error("Error bulk deleting sacks:", error);
      }
    },
  });
};

// Handle bulk restore
const handleBulkRestore = async () => {
  try {
    await axios.post("http://127.0.0.1:8000/api/sacks/bulk-restore", {
      ids: selectedRowKeys,
    });
    message.success("Selected sacks restored successfully");
    setSelectedRowKeys([]);
    fetchSacks();
  } catch (error) {
    message.error("Failed to restore selected sacks");
    console.error("Error bulk restoring sacks:", error);
  }
};

// Handle page change
const handlePageChange = (page, pageSize) => {
  setCurrentPage(page);
  setPageSize(pageSize);
};

// Row selection configuration
const rowSelection = {
  selectedRowKeys,
  onChange: (keys) => setSelectedRowKeys(keys),
};

// Calculate current page data
const currentPageData = filteredSacks.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

  return (
    <AdminPage>
      <h1>Sack Management</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Search
          placeholder="Search by sack code"
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 200 }}
        />
         <Select
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
          style={{ width: 120 }}
        >
          <Option value="active">Active</Option>
          <Option value="archived">Deleted</Option>
          <Option value="all">All</Option>
        </Select>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          <Button 
            type="primary" 
            onClick={() => setIsAddSackModalVisible(true)}
            icon={<PlusOutlined />}
          >
            Add Sack
          </Button>
          {selectedStatus === "active" ? (
            <Button
              type="primary"
              danger
              onClick={handleBulkDelete}
              disabled={selectedRowKeys.length === 0}
            >
              Delete Selected
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleBulkRestore}
              disabled={selectedRowKeys.length === 0}
            >
              Restore Selected
            </Button>
          )}
        </div>
      </div>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={currentPageData}
        rowKey="id"
        pagination={false}
      />
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showTotal={(total) => `Total ${total} sacks`}
        />
      </div>
      <AddSackModal
        visible={isAddSackModalVisible}
        setVisible={setIsAddSackModalVisible}
        fetchSacks={fetchSacks}
        categories={categories}
        categoryTypes={categoryTypes}
      />
      <EditSackModal
        visible={isEditSackModalVisible}
        onCancel={() => setIsEditSackModalVisible(false)}
        onSave={handleSaveEdit}
        sack={selectedSack}
        categories={categories}
        categoryTypes={categoryTypes}
      />
    </AdminPage>
  );
};

export default AdminSacks;