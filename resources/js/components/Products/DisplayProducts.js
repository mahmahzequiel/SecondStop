import React, { useEffect, useState } from "react";
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useCategories from "../Categories/Categories";
import Filters from "./Filters";
import axios from "axios";
import Advertisement from "./Advertisement"; // Import the Advertisement component

const DisplayProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const navigate = useNavigate();
  
  // Get categories using the custom hook
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

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

  // Handle category filter
  const handleCategoryFilter = (categoryId) => {
    setActiveCategory(categoryId);
    
    if (categoryId === "all") {
      setFilteredProducts(products);
      setSelectedCategory(null);
    } else {
      const filtered = products.filter((product) => product.category_id === categoryId);
      setFilteredProducts(filtered);
      
      const selectedCat = categories.find(cat => cat.id === categoryId);
      setSelectedCategory(selectedCat || null);
    }
  };

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

  if (loading || categoriesLoading) return <div className="loading-container">Loading...</div>;
  if (error || categoriesError) return <div className="error-container">Error: {error || categoriesError}</div>;

  return (
    <MainPage onSearch={handleSearch}>
      <div className="display-products dark-theme">
        {/* Advertisement Carousel */}
        <Advertisement /> {/* Add the Advertisement component here */}

        {/* Category filter tabs from database */}
        <div className="filter-tabs">
          <button
            className={`filter-button ${activeCategory === "all" ? 'active' : ''}`}
            onClick={() => handleCategoryFilter("all")}
          >
            View all
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-button ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(category.id)}
            >
              {category.category_name}
            </button>
          ))}
          
          <div className="search-container">
            <input type="text" placeholder="Search for items..." onChange={(e) => handleSearch(e.target.value)} />
            <button className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Main content area with conditional filters */}
        <div className="content-area">
          {/* Filters panel - automatically displayed when category is selected */}
          {selectedCategory && (
            <div className="filters-panel">
              <Filters
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onCategoryTypeSelect={setSelectedCategoryType}
                onBrandSelect={setSelectedBrand}
              />
            </div>
          )}

          {/* Product Grid */}
          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container" onClick={() => navigate(`/product/${product.id}`)}>
                    {product.product_image ? (
                      <img
                        src={`http://127.0.0.1:8000/storage/${product.product_image}`}
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
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.product_name}</h3>
                    <p className="product-price">$ {product.price}</p>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="cart-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCartOutlined className="cart-icon" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-products">No products found.</p>
            )}
          </div>
        </div>
      </div>
    </MainPage>
  );
};

export default DisplayProducts;