import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminPage from "../../AdminReusable/AdminPage";
import { Table, Button, Input, Select, message } from "antd";
import AddProductModal from "./AddProductModal";
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
  const [isAddProductModalVisible, setIsAddProductModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // For selected product IDs

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/products");
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

    fetchProducts();
    fetchCategories();
    fetchCategoryTypes();
    fetchBrands();
  }, []);

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
      setProducts(products.filter((product) => product.id !== productId));
      setFilteredProducts(filteredProducts.filter((product) => product.id !== productId));
      message.success("Product archived successfully!");
    } catch (error) {
      console.error("Error archiving product:", error);
      message.error("Failed to archive product.");
    }
  };
  

  const handleBulkArchive = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) =>
          axios.delete(`http://127.0.0.1:8000/api/products/${id}`)
        )
      );
      setProducts(products.filter((product) => !selectedRowKeys.includes(product.id)));
      setFilteredProducts(filteredProducts.filter((product) => !selectedRowKeys.includes(product.id)));
      setSelectedRowKeys([]);
      message.success("Selected products archived successfully!");
    } catch (error) {
      console.error("Error archiving products:", error);
      message.error("Failed to archive selected products.");
    }
  };

  const handleRestore = async (productId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/products/${productId}/restore`);
      message.success("Product restored successfully!");
      fetchProducts(); // Refresh the product list
    } catch (error) {
      console.error("Error restoring product:", error);
      message.error("Failed to restore product.");
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
          <Button type="primary" icon={<EditOutlined />} style={{ marginRight: "8px" }} />
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            onClick={() => handleArchive(record.id)}
            disabled={record.is_archived} // Disable if already archived
          />
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
      render: (price) => `$${parseFloat(price).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "is_archived",
      key: "is_archived",
      render: (isArchived) => (isArchived ? "Archived" : "Active"),
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
        <Select placeholder="Filter by Category" onChange={setSelectedCategory} allowClear style={{ width: 200 }}>
          {categories.map((category) => (
            <Option key={category.id} value={category.category_name}>{category.category_name}</Option>
          ))}
        </Select>
        <Select placeholder="Filter by Category Type" onChange={setSelectedCategoryType} allowClear style={{ width: 200 }}>
          {categoryTypes.map((type) => (
            <Option key={type.id} value={type.category_type}>{type.category_type}</Option>
          ))}
        </Select>
        <Select placeholder="Filter by Brand" onChange={setSelectedBrand} allowClear style={{ width: 200 }}>
          {brands.map((brand) => (
            <Option key={brand.id} value={brand.name}>{brand.name}</Option>
          ))}
        </Select>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          <Button type="primary" onClick={() => setIsAddProductModalVisible(true)}>
            Add New Product
          </Button>
          <Button
            type="primary"
            danger
            onClick={handleBulkArchive}
            disabled={selectedRowKeys.length === 0}
          >
            Archive Selected Products
          </Button>
        </div>
      </div>
      <Table
        rowSelection={rowSelection} // Enable row selection
        columns={columns}
        dataSource={filteredProducts.filter((product) => !product.is_archived)} // Exclude archived products
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
    </AdminPage>
  );
};

export default AdminProducts;