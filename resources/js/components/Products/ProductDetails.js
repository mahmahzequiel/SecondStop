import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MainPage from "../Reusable/MainPage";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

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
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const currentCartItems = Array.isArray(cartResponse.data)
        ? cartResponse.data
        : [];

      // Check if the product is already in the cart
      const isItemInCart = currentCartItems.some(
        (item) => item.product?.id === product.id
      );

      if (isItemInCart) {
        alert("Item is already in the cart.");
        return;
      }

      // Add product to the cart via API
      await axios.post(
        "http://127.0.0.1:8000/api/carts",
        {
          user_id: userId,
          product_id: product.id,
        },
        {
          headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
        }
      );

      alert("Item added to cart!");

      // Update the user-specific cart count
      const newCount = currentCartItems.length + 1;
      localStorage.setItem(`cartCount_${userId}`, newCount.toString());
      window.dispatchEvent(new Event("cartCountUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error);
      alert("Error adding to cart. Please try again.");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
  
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");
  
    if (!userToken) {
      alert("Please log in to purchase items.");
      return;
    }
  
    if (!userId) {
      alert("User ID is missing. Please log in again.");
      return;
    }
  
    try {
      // Fetch current cart items
      const cartResponse = await axios.get("http://127.0.0.1:8000/api/carts", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const currentCartItems = Array.isArray(cartResponse.data)
        ? cartResponse.data
        : [];
  
      // Check if product is already in the cart
      const isItemInCart = currentCartItems.some(
        (item) => item.product?.id === product.id
      );
  
      if (!isItemInCart) {
        // Add product to the cart via API
        await axios.post(
          "http://127.0.0.1:8000/api/carts",
          {
            user_id: userId,
            product_id: product.id,
          },
          {
            headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
          }
        );
        // Update localStorage and dispatch event for cart count update
        const newCount = currentCartItems.length + 1;
        localStorage.setItem(`cartCount_${userId}`, newCount.toString());
        window.dispatchEvent(new Event("cartCountUpdated"));
      }
  
      // Prepare product data for direct purchase navigation
      const price = Number(product.price);
      const numericPrice = isNaN(price) ? 0 : price;
      const productData = {
        product_id: product.id,
        product_name: product.product_name,
        price: numericPrice,
        brand: product.brand ? product.brand.name : "N/A",
        quantity: 1,
      };
  
      // Navigate to /cart with directPurchase flag and product data
      navigate("/cart", {
        state: {
          directPurchase: true,
          productData: productData,
          totalPrice: numericPrice,
          selectedItems: [productData],
        },
      });
    } catch (error) {
      console.error("Error processing Buy Now:", error.response?.data || error);
      alert("Error processing your purchase. Please try again.");
    }
  };

  if (loading) return (
    <MainPage>
      <div className="product-details-view">
        <div className="loading-container">
          <h2>Loading...</h2>
        </div>
      </div>
    </MainPage>
  );
  
  if (error) return (
    <MainPage>
      <div className="product-details-view">
        <div className="error-container">
          <h2>{error}</h2>
        </div>
      </div>
    </MainPage>
  );
  
  if (!product) return (
    <MainPage>
      <div className="product-details-view">
        <div className="not-found-container">
          <h2>Product not found</h2>
        </div>
      </div>
    </MainPage>
  );

  return (
    <MainPage>
      <div className="product-details-view">
        <div className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> Back
        </div>

        <div className="product-details-layout">
          <div className="product-details-image-container">
            <img
              src={`http://127.0.0.1:8000/storage/${product.product_image}`}
              alt={product.product_name}
              className="product-details-image"
            />
          </div>

          <div className="product-info-panel">
            <h1 className="product-title">{product.product_name}</h1>
            
            <div className="product-meta">
              <p>
                <span className="meta-label">Brand:</span> {
                  product.brand?.name || 
                  (product.brand_id && `ID: ${product.brand_id}`) || 
                  "N/A"
                }
              </p>
            </div>

            <div className="product-details-price">
              <span className="currency">$</span>
              <span className="amount">{product.price}</span>
            </div>

            <div className="product-description">
              <h3>Description:</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-details-actions">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <ShoppingCartOutlined /> Add to Cart
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainPage>
  );
};

export default ProductDetails;