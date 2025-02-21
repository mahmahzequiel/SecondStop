import React, { useEffect, useState } from "react";
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined } from "@ant-design/icons";
import categories from "../Categories/Categories";
import Filters from "../Categories/Filters";

const DisplayProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null); // NEW: State for selected brand
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products based on selected category type
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = "http://127.0.0.1:8000/api/products";

        if (selectedCategoryType) {
          url = `http://127.0.0.1:8000/api/products-by-category-type?category_type_id=${selectedCategoryType.id}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategoryType]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory((prevCategory) => (prevCategory?.id === category.id ? null : category));
    setShowFilters((prev) => (selectedCategory?.id === category.id ? false : true));
    setSelectedCategoryType(null);
    setSelectedBrand(null); // Reset brand selection when category changes
    setSelectedFilters({});
  };

  // Handle category type selection from Filters
  const handleCategoryTypeSelect = (categoryType) => {
    setSelectedCategoryType((prevType) => (prevType?.id === categoryType.id ? null : categoryType));
  };

  // Handle brand selection from Filters
  const handleBrandSelect = (brand) => {
    setSelectedBrand((prevBrand) => (prevBrand?.id === brand.id ? null : brand));
  };

  // Apply additional filters locally
  useEffect(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category_id === selectedCategory.id);
    }

    if (selectedBrand) {
      filtered = filtered.filter((product) => product.brand_id === selectedBrand.id);
    }

    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((product) => product[key] === value);
      }
    });

    setFilteredProducts(filtered);
  }, [selectedFilters, selectedBrand, products]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <MainPage>
      <div className="product-section">
        {/* Category List */}
        <div className="category-container">
          {categories.map((category) => (
            <div key={category.id} className="category-item" onClick={() => handleCategorySelect(category)}>
              <img src={`http://127.0.0.1:8000/${category.image}`} alt={category.name} className="category-image" />
              <p>{category.name}</p>
            </div>
          ))}
        </div>

        {/* Filters & Products */}
        <div className="content">
          {showFilters && selectedCategory && (
            <div className="filter-section">
              <Filters
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onCategoryTypeSelect={handleCategoryTypeSelect}
                onBrandSelect={handleBrandSelect} // NEW: Pass brand selection function
              />
            </div>
          )}

          {/* Product List */}
          <div className="product-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  {product.product_image && (
                    <img src={`http://127.0.0.1:8000/${product.product_image}`} alt={product.product_name} className="product-image" />
                  )}
                  <h2>{product.product_name}</h2>
                  <p>Price: ${product.price}</p>
                  <div className="description-container">
                    <p>{product.description}</p>
                    <button className="cart-button">
                      <ShoppingCartOutlined className="icon" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No products found.</p>
            )}
          </div>
        </div>
      </div>
    </MainPage>
  );
};

export default DisplayProducts;
