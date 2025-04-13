import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../../AdminReusable/AdminPage";
import { Table, Button, Input, Select, message, Space, Pagination, Modal } from "antd";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal"; // Import the EditProductModal
import { EditOutlined, InboxOutlined, UndoOutlined, PlusOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sacks, setSacks] = useState([]); // Add state for sacks
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(
    localStorage.getItem("selectedStatus") || "active"
  );
  const [isAddProductModalVisible, setIsAddProductModalVisible] = useState(false);
  const [isEditProductModalVisible, setIsEditProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Track the selected product for editing
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/products", {
        params: { status: selectedStatus },
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
      setTotal(response.data.length);
    } catch (error) {
      setError("Error fetching products.");
      console.error("Error fetching products:", error);
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

  const fetchBrands = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/brands");
      setBrands(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
    }
  };

  // Add function to fetch sacks
  const fetchSacks = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/sacks", {
        params: { status: 'active' }, // Only fetch active sacks
      });
      setSacks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching sacks:", error);
      setSacks([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCategoryTypes();
    fetchBrands();
    fetchSacks(); // Fetch sacks data
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem("selectedStatus", selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    let filtered = products.filter((product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category?.category_name === selectedCategory);
    }
  
    if (selectedCategoryType) {
      filtered = filtered.filter((product) => product.category_type?.category_type === selectedCategoryType);
    }
  
    if (selectedBrand) {
      filtered = filtered.filter((product) => product.brand?.name === selectedBrand);
    }
  
    setFilteredProducts(filtered);
    setTotal(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedCategory, selectedCategoryType, selectedBrand, products]);

  const handleArchive = async (productId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/products/${productId}`);
      setProducts(products.map(product =>
        product.id === productId ? { ...product, is_archived: true } : product
      ));
      message.success("Product archived successfully!");
    } catch (error) {
      console.error("Error archiving product:", error);
      message.error("Failed to archive product.");
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map(id => axios.delete(`http://127.0.0.1:8000/api/products/${id}`))
      );
      setProducts(products.map(product =>
        selectedRowKeys.includes(product.id) ? { ...product, is_archived: true } : product
      ));
      setSelectedRowKeys([]);
      message.success("Selected products archived successfully!");
    } catch (error) {
      console.error("Error archiving products:", error);
      message.error("Failed to archive selected products.");
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map(id => axios.put(`http://127.0.0.1:8000/api/products/${id}/restore`))
      );
      setProducts(products.map(product =>
        selectedRowKeys.includes(product.id) ? { ...product, is_archived: false } : product
      ));
      setSelectedRowKeys([]);
      message.success("Selected products restored successfully!");
    } catch (error) {
      console.error("Error restoring products:", error);
      message.error("Failed to restore selected products.");
    }
  };

  const handleRestore = async (productId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/products/${productId}/restore`);
      setProducts(products.map(product =>
        product.id === productId ? { ...product, is_archived: false } : product
      ));
      message.success("Product restored successfully!");
    } catch (error) {
      console.error("Error restoring product:", error);
      message.error("Failed to restore product.");
    }
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditProductModalVisible(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      // Append the _method=PUT field for Laravel to recognize it as an update request
      formData.append("_method", "PUT");

      const response = await axios.post(
        `http://127.0.0.1:8000/api/products/${selectedProduct.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Refetch products to update the UI
      fetchProducts();
      // Also refresh sacks data as quantities might have changed
      fetchSacks();
      setIsEditProductModalVisible(false);
      message.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error.response?.data);
      message.error("Failed to update product.");
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
  };

  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Add handler for when product is added successfully
  const handleProductAdded = () => {
    fetchProducts();
    fetchSacks(); // Refresh sacks data since available quantities have changed
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  // Calculate the current page data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageData = filteredProducts.slice(startIndex, endIndex);

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
          {selectedStatus === "archived" || record.is_archived ? (
            <UndoOutlined
              style={{ cursor: "pointer", color: "#52c41a" }}
              onClick={() => handleRestore(record.id)}
              title="Restore"
            />
          ) : (
            <InboxOutlined
              style={{ cursor: "pointer" }}
              onClick={() => handleArchive(record.id)}
              title="Archive"
            />
          )}
        </Space>
      ),
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      render: (brand) => brand?.name || "N/A",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => category?.category_name || "N/A",
    },
    {
      title: "Category Type",
      dataIndex: "category_type",
      key: "category_type",
      render: (categoryType) => categoryType?.category_type || "N/A",
    },
    {
      title: "Sack Code",
      key: "sack_code",
      render: (_, record) => {
        if (!sacks || sacks.length === 0) return null; // Or <Skeleton />
        
        const sack = sacks.find(s => s.id === record.sack_id);
        return sack?.sack_code || "N/A";
      }
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `PHP${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Image",
      dataIndex: "product_image",
      key: "product_image",
      render: (image, record) => image ? (
        <img 
          src={`http://127.0.0.1:8000/storage/${image}`} 
          alt={record.product_name}
          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 5, cursor: "pointer" }} 
          onClick={() => {
            setPreviewImage(`http://127.0.0.1:8000/storage/${image}`);
            setPreviewTitle(record.product_name);
            setPreviewVisible(true);
          }}
        />
      ) : "No Image",
    }
  ];

  return (
    <AdminPage>
      <h1>Admin Products</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Search
          placeholder="Search by product name"
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Filter by Category"
          onChange={(value) => setSelectedCategory(value)}
          allowClear
          style={{ width: 200 }}
        >
          {categories.map((category) => (
            <Option key={category.id} value={category.category_name}>
              {category.category_name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Category Type"
          onChange={(value) => setSelectedCategoryType(value)}
          allowClear
          style={{ width: 200 }}
        >
          {categoryTypes.map((type) => (
            <Option key={type.id} value={type.category_type}>
              {type.category_type}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Brand"
          onChange={(value) => setSelectedBrand(value)}
          allowClear
          style={{ width: 200 }}
        >
          {brands.map((brand) => (
            <Option key={brand.id} value={brand.name}>
              {brand.name}
            </Option>
          ))}
        </Select>
        <Select
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
          style={{ width: 120 }}
        >
          <Option value="active">Active</Option>
          <Option value="archived">Archived</Option>
          <Option value="all">All</Option>
        </Select>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
        <Button 
            type="primary" onClick={() => setIsAddProductModalVisible(true)}
            icon={<PlusOutlined />}
            style={{ backgroundColor: "#A63F3F" }}
          >
            Add Product
          </Button>
          {selectedStatus === "active" ? (
            <Button
              type="primary"
              danger
              onClick={handleBulkArchive}
              disabled={selectedRowKeys.length === 0}
            >
              Archive Selected Products
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleBulkRestore}
              disabled={selectedRowKeys.length === 0}
            >
              Restore Selected Products
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
          showTotal={(total) => `Total ${total} products`}
        />
      </div>
      <AddProductModal
  visible={isAddProductModalVisible}
  setVisible={setIsAddProductModalVisible}
  setProducts={setProducts}
  setFilteredProducts={setFilteredProducts}
  categories={categories}
  categoryTypes={categoryTypes}
  brands={brands}
  sacks={sacks}
  onProductAdded={() => {
    fetchProducts();
    fetchSacks(); // This will refresh the sacks data
  }}
/>
      <EditProductModal
        visible={isEditProductModalVisible}
        onCancel={() => setIsEditProductModalVisible(false)}
        onSave={handleSaveEdit}
        product={selectedProduct}
        categories={categories}
        categoryTypes={categoryTypes}
        brands={brands}
        sacks={sacks} // Pass sacks data to EditProductModal as well
      />

      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt={previewTitle} style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </AdminPage>
  );
};

export default AdminProducts;