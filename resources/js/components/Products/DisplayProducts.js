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
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategories, setShowCategories] = useState(true);
  const [profile, setProfile] = useState(null);

  // Fetch profile from localStorage.
  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = "http://127.0.0.1:8000/api/products";

        if (selectedCategoryType && selectedCategoryType.id) {
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

  const handleCategorySelect = (category) => {
    setSelectedCategory((prevCategory) =>
      prevCategory?.id === category.id ? null : category
    );
    setShowFilters(true);
    setSelectedCategoryType(null);
    setSelectedBrand(null);
    setSelectedFilters({});
    setShowCategories(false);
  };

  const handleCategoryTypeSelect = (categoryType) => {
    setSelectedCategoryType((prevType) =>
      prevType?.id === categoryType?.id ? null : categoryType
    );
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand((prevBrand) =>
      prevBrand?.id === brand?.id ? null : brand
    );
  };

  useEffect(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category_id === selectedCategory.id
      );
    }

    if (selectedBrand) {
      filtered = filtered.filter(
        (product) => product.brand_id === selectedBrand.id
      );
    }

    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((product) => product[key] === value);
      }
    });

    setFilteredProducts(filtered);
  }, [selectedFilters, selectedBrand, products, selectedCategory]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <MainPage>
      <div
        className="product-section"
        style={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}
      >
        {/* Filters Column */}
        <div className="filters-container" style={{ width: "20%", paddingRight: "20px" }}>
          {showCategories && (
            <div className="category-container">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="category-item"
                  onClick={() => handleCategorySelect(category)}
                >
                  <img
                    src={`http://127.0.0.1:8000/${category.image}`}
                    alt={category.name}
                    className="category-image"
                  />
                  <p>{category.name}</p>
                </div>
              ))}
            </div>
          )}
          {showFilters && selectedCategory && (
            <div className="filter-section">
              <Filters
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onCategoryTypeSelect={handleCategoryTypeSelect}
                onBrandSelect={handleBrandSelect}
              />
            </div>
          )}
        </div>

        {/* Product List Column */}
        <div className="product-list">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                {product.product_image && (
                  <img
                    src={`http://127.0.0.1:8000/${product.product_image}`}
                    alt={product.product_name}
                    className="product-image"
                  />
                )}
                <h2>{product.product_name}</h2>
                <p>Price: ${product.price}</p>
                <div className="description-container">
                  <p>{product.description}</p>
                  <button className="cart-button">
                    <ShoppingCartOutlined className="cart-icon" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>
    </MainPage>
  );
};

export default DisplayProducts;
