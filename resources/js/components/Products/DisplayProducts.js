// DisplayProducts.js
import React, { useEffect, useState } from "react";
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import categories from "../Categories/Categories";
import Filters from "./Filters";
import axios from "axios";

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
  const navigate = useNavigate();

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

  // Search Filtering
  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = products.filter((product) =>
      product.product_name.toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredProducts(filtered);
  };

  // Apply Filters
  useEffect(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category_id === selectedCategory.id
      );
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
  }, [selectedFilters, selectedBrand, products, selectedCategory]);

  // Add to Cart Functionality with Duplicate Check
  const handleAddToCart = async (product) => {
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");

    if (!userToken) {
      alert("Please log in to add items to the cart.");
      return;
    }

    if (!userId) {
      alert("User ID is missing. Please log in again.");
      return;
    }

    try {
      // Fetch current cart items to check for duplicates
      const cartResponse = await axios.get("http://127.0.0.1:8000/api/carts", {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const currentCartItems = Array.isArray(cartResponse.data)
        ? cartResponse.data
        : [];
      const productAlreadyInCart = currentCartItems.some(
        (item) => item.product?.id === product.id
      );

      if (productAlreadyInCart) {
        alert("Item is already in the cart!");
        return;
      }

      // If not a duplicate, proceed to add
      await axios.post(
        "http://127.0.0.1:8000/api/carts",
        {
          user_id: userId,
          product_id: product.id
        },
        {
          headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" }
        }
      );

      alert(`${product.product_name} added to cart!`);

      // Update the user-specific cart count
      let currentCount = parseInt(localStorage.getItem(`cartCount_${userId}`)) || 0;
      localStorage.setItem(`cartCount_${userId}`, (currentCount + 1).toString());
      window.dispatchEvent(new Event("cartCountUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error);
      alert("Error: " + JSON.stringify(error.response?.data.errors || error.response?.data || error));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <MainPage onSearch={handleSearch}>
      <div className="display-products">
        {/* Categories at the top */}
        <div className="category-container">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-item"
              onClick={() => setSelectedCategory(category)}
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

        {/* Main Grid Layout */}
        <div className="content-grid">
          {/* Filters on the left */}
          <div className="filters-container">
            {selectedCategory && (
              <Filters
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onCategoryTypeSelect={setSelectedCategoryType}
                onBrandSelect={setSelectedBrand}
              />
            )}
          </div>

          {/* Product Grid */}
          <div className="product-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div onClick={() => navigate(`/product/${product.id}`)}>
                    {product.product_image ? (
                      <img
                        src={`http://127.0.0.1:8000/${product.product_image}`}
                        alt={product.product_name}
                        className="product-image"
                      />
                    ) : (
                      <img
                        src="/placeholder.jpg"
                        alt="Placeholder"
                        className="product-image"
                      />
                    )}
                    <h2>{product.product_name}</h2>
                    <p>Price: ${product.price}</p>
                  </div>
                  <div className="description-container">
                    <p>{product.description}</p>
                    {/* Add to Cart Button */}
                    <button className="cart-button" onClick={() => handleAddToCart(product)}>
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
      </div>
    </MainPage>
  );
};

export default DisplayProducts;
