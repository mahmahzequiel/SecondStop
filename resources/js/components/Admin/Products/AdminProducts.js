import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../../AdminReusable/AdminPage";
import { Table, Button, Input, Select, message, Space } from "antd";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal"; // Import the EditProductModal
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/products", {
        params: { status: selectedStatus },
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCategoryTypes();
    fetchBrands();
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem("selectedStatus", selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    let filtered = products.filter((product) =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category?.name === selectedCategory);
    }

    if (selectedCategoryType) {
      filtered = filtered.filter((product) => product.category_type?.name === selectedCategoryType);
    }

    if (selectedBrand) {
      filtered = filtered.filter((product) => product.brand?.name === selectedBrand);
    }

    setFilteredProducts(filtered);
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

  const handleEdit = (product) => {
    setSelectedProduct(product); // Set the selected product for editing
    setIsEditProductModalVisible(true); // Open the edit modal
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
      setIsEditProductModalVisible(false);
      message.success("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error.response?.data);
      message.error("Failed to update product.");
    }
  };

  const onSelectChange = (selectedRowKeys) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>{error}</div>;

  const columns = [
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <span>
          <Button
            type="primary"
            icon={<EditOutlined />}
            style={{ marginRight: "8px" }}
            onClick={() => handleEdit(record)} // Open the edit modal
          />
          {record.is_archived ? (
            <Button
              type="primary"
              onClick={() => handleBulkRestore(record.id)}
            >
              Restore
            </Button>
          ) : (
            <Button
              type="danger"
              onClick={() => handleArchive(record.id)}
            >
              Archive
            </Button>
          )}
        </span>
      ),
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
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
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `PHP${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Image",
      dataIndex: "product_image",
      key: "product_image",
      render: (image) => image ? (
        <img src={`http://127.0.0.1:8000/storage/${image}`} alt="Product" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 5 }} />
      ) : "No Image",
    },
    
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
          <Button type="primary" onClick={() => setIsAddProductModalVisible(true)}>
            Add New Product
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
        dataSource={filteredProducts}
        rowKey="id"
        pagination={false}
      />
      <AddProductModal
        visible={isAddProductModalVisible}
        setVisible={setIsAddProductModalVisible}
        setProducts={setProducts}
        setFilteredProducts={setFilteredProducts}
        categories={categories}
        categoryTypes={categoryTypes}
        brands={brands}
      />
      <EditProductModal
        visible={isEditProductModalVisible}
        onCancel={() => setIsEditProductModalVisible(false)}
        onSave={handleSaveEdit}
        product={selectedProduct}
        categories={categories}
        categoryTypes={categoryTypes}
        brands={brands}
      />
    </AdminPage>
  );
};

export default AdminProducts;