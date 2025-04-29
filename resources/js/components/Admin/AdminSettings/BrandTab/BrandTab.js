import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Input, Space, Modal, Tag, Select, message } from "antd";
import { SearchOutlined, EditOutlined, InboxOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";

// Import modal components directly
import AddBrandModal from "./AddBrandModal";
import EditBrandModal from "./EditBrandModal";

const BRANDS_API = "http://127.0.0.1:8000/api/brands";
const { Option } = Select;

function BrandTab() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetchBrands();
  }, [statusFilter]); // Refetch when statusFilter changes

  const fetchBrands = () => {
    setLoading(true);
    
    // Modified API URL to include trashed parameter
    const url = statusFilter === "archived" 
      ? `${BRANDS_API}?trashed=only` 
      : BRANDS_API;
    
    axios
      .get(url)
      .then((res) => {
        console.log(`${statusFilter} brands response:`, res.data);
        if (res.data?.success && res.data?.data) {
          setBrands(res.data.data);
        } else {
          console.error("Invalid brands structure:", res.data);
          message.error("Failed to fetch brands");
        }
      })
      .catch((err) => {
        console.error("Error fetching brands:", err);
        message.error("Error fetching brands");
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
    fetchBrands();
  };

  // Handle edit modal functions
  const handleOpenEditModal = (brand) => {
    setSelectedBrand(brand);
    setIsEditModalVisible(true);
  };

  const handleCancelEditModal = () => {
    setSelectedBrand(null);
    setIsEditModalVisible(false);
  };

  const handleSaveEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedBrand(null);
    fetchBrands();
  };

  // Delete brand (soft delete / archive) - Modified with confirmation modal
  const archiveBrand = (brandId) => {
    Modal.confirm({
      title: "Are you sure you want to archive this brand?",
      content: "This will hide it from active view, but you can restore it later.",
      onOk: () => {
        setLoading(true);
        
        axios
          .delete(`${BRANDS_API}/${brandId}`)
          .then((response) => {
            console.log("Archive response:", response);
            message.success("Brand archived successfully!");
            fetchBrands();
          })
          .catch((err) => {
            console.error("Error archiving brand:", err);
            message.error("An error occurred while archiving the brand");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Restore archived brand - Modified with confirmation modal
  const restoreBrand = (brandId) => {
    Modal.confirm({
      title: "Are you sure you want to restore this brand?",
      content: "This will make it active again.",
      onOk: () => {
        setLoading(true);
        
        axios
          .put(`${BRANDS_API}/${brandId}/restore`, {})
          .then((response) => {
            console.log("Restore response:", response);
            message.success("Brand restored successfully!");
            fetchBrands();
          })
          .catch((err) => {
            console.error("Error restoring brand:", err);
            message.error("An error occurred while restoring the brand");
          })
          .finally(() => setLoading(false));
      },
    });
  };

  // Handle bulk actions based on current status filter - uses confirmation modal
  const handleBulkStatusChange = () => {
    if (selectedRowKeys.length === 0) {
      Modal.info({ 
        title: 'No brands selected', 
        content: `Please select at least one brand to ${statusFilter === "archived" ? "restore" : "archive"}.` 
      });
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to ${statusFilter === "archived" ? "restore" : "archive"} ${selectedRowKeys.length} brands?`,
      content: statusFilter === "archived" 
        ? "This will make them active again." 
        : "This action can be reversed later.",
      onOk: () => {
        setLoading(true);
        
        // Choose the appropriate action based on status filter
        if (statusFilter === "archived") {
          // Restore brands
          const restorePromises = selectedRowKeys.map(brandId =>
            axios.put(`${BRANDS_API}/${brandId}/restore`, {})
          );

          Promise.all(restorePromises)
            .then(() => {
              message.success(`${selectedRowKeys.length} brands restored successfully!`);
              fetchBrands();
              setSelectedRowKeys([]);
            })
            .catch(err => {
              console.error("Error restoring brands:", err);
              message.error("An error occurred while restoring the brands");
            })
            .finally(() => setLoading(false));
        } else {
          // Archive brands
          const archivePromises = selectedRowKeys.map(brandId =>
            axios.delete(`${BRANDS_API}/${brandId}`)
          );

          Promise.all(archivePromises)
            .then(() => {
              message.success(`${selectedRowKeys.length} brands archived successfully!`);
              fetchBrands();
              setSelectedRowKeys([]);
            })
            .catch(err => {
              console.error("Error archiving brands:", err);
              message.error("An error occurred while archiving the brands");
            })
            .finally(() => setLoading(false));
        }
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
              // Disable edit button for archived brands
              disabled={statusFilter === "archived"}
            />
            {statusFilter === "active" ? (
              <InboxOutlined
                style={{ cursor: "pointer" }}
                onClick={() => archiveBrand(record.id)}
                title="Archive"
              />
            ) : (
              <UndoOutlined
                style={{ cursor: "pointer", color: "#52c41a" }}
                onClick={() => restoreBrand(record.id)}
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
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <Tag color={statusFilter === "active" ? "blue" : "default"}>{text}</Tag>,
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

  // Filter brands based on search
  const filteredBrands = brands.filter((brand) =>
    (brand.name || "").toLowerCase().includes(search.toLowerCase())
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
      <h2 style={{ marginBottom: "20px" }}>Brands Management</h2>

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
          {/* Always show Add Brand button, like in RoleTab */}
          <Button
            type="primary"
            onClick={handleOpenAddModal}
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#A63F3F" }}
          >
            Add Brand
          </Button>
          
          {/* Dynamic button that changes based on status filter */}
          <Button
            type="primary"
            danger
            onClick={handleBulkStatusChange}
            disabled={selectedRowKeys.length === 0}
            icon={statusFilter === "archived" ? <UndoOutlined /> : null}
            style={{ marginLeft: 8 }}
          >
            {statusFilter === "archived" ? "Restore" : "Archive"} Selected
          </Button>
        </Space>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={getColumns()}
        dataSource={filteredBrands}
        rowKey={(record) => record.id}
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{ 
          emptyText: `No ${statusFilter} brands found matching the current search` 
        }}
      />

      {/* Integrated Add Brand Modal */}
      <AddBrandModal
        visible={isAddModalVisible}
        onCancel={handleCancelAddModal}
        onSave={handleSaveAddModal}
      />

      {/* Integrated Edit Brand Modal */}
      {isEditModalVisible && (
        <EditBrandModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveEditModal}
          brand={selectedBrand}
        />
      )}
    </div>
  );
}

export default BrandTab;