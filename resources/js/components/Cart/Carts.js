// Carts.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import MainPage from "../Reusable/MainPage";

const Carts = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchCartItems = async () => {
        try {
            const userToken = localStorage.getItem("userToken");
            if (!userToken) {
                navigate("/login");
                return;
            }

            const response = await axios.get("http://127.0.0.1:8000/api/carts", {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            // Updated this line
            const fetchedItems = response.data.data || [];
            setCartItems(fetchedItems);

            if (userId) {
                localStorage.setItem(`cartCount_${userId}`, fetchedItems.length.toString());
                window.dispatchEvent(new Event("cartCountUpdated"));
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
        }
    };

    fetchCartItems();
}, [navigate, userId]);

  // Handle select item
  const handleSelectItem = (productId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    setSelectedItems(selectAll ? [] : cartItems.map((item) => item.id));
    setSelectAll(!selectAll);
  };

  // Delete selected items
  const handleDeleteSelected = async () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
        alert("Please log in to delete items.");
        navigate("/login");
        return;
    }

    try {
        const response = await axios.post(
            "http://127.0.0.1:8000/api/carts/delete",
            { cart_ids: selectedItems }, // Match backend parameter name
            { headers: { Authorization: `Bearer ${userToken}` } }
        );

        if (response.data.status === 'success') {
            const updatedCart = cartItems.filter((item) => !selectedItems.includes(item.id));
            setCartItems(updatedCart);
            setSelectedItems([]);
            setSelectAll(false);

            if (userId) {
                localStorage.setItem(`cartCount_${userId}`, updatedCart.length.toString());
                window.dispatchEvent(new Event("cartCountUpdated"));
            }
            alert(response.data.message);
        }
    } catch (error) {
        console.error("Error deleting cart items:", error);
        alert(error.response?.data?.message || "Failed to delete items");
    }
};

  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
  const totalPrice = selectedCartItems.reduce(
    (acc, item) => acc + parseFloat(item.product?.price || 0),
    0
  );

  const handleCheckout = async () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("Please log in to checkout.");
      navigate("/login");
      return;
    }
  
    if (selectedItems.length === 0) {
      alert("Please select at least one item to checkout.");
      return;
    }
  
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/checkout",
        {
          cart_item_id: selectedItems[0], // Send the first selected item's ID
          payment_method: "cod", // Default payment method
          shipping_cost: 70.00 // Default shipping cost
        },
        {
          headers: { 
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.status === 'success') {
        localStorage.setItem(`cartCount_${userId}`, "0");
        window.dispatchEvent(new Event("cartCountUpdated"));
        navigate("/confirmation", { 
          state: {
            order: response.data.order,
            payment: response.data.order.payment
          }
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error.response?.data?.message || "Checkout failed. Please try again.");
    }
  };

  return (
    <MainPage>
      <div className="cart-container">
        <h2>Shopping Cart</h2>
        {cartItems.length === 0 ? (
          <p className="empty-cart-message">Your cart is empty.</p>
        ) : (
          <div>
            <table className="cart-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product</th>
                  <th>Image</th>
                  <th>Description</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
  {cartItems.map((item) => (
    <tr key={item.id}>
      <td>
        <input
          type="checkbox"
          checked={selectedItems.includes(item.id)}
          onChange={() => handleSelectItem(item.id)}
        />
      </td>
      <td>{item.product?.product_name || "Unknown Product"}</td>
      <td>
        <img
          src={
            item.product?.product_image
              ? item.product.product_image // Already includes full URL from backend
              : "/placeholder.jpg"
          }
          alt={item.product?.product_name || "Product Image"}
          className="cart-image"
        />
      </td>
      <td className="description">
        {item.product?.description || "No Description"}
      </td>
      <td className="price">PHP {item.product?.price || "0"}.00</td>
    </tr>
  ))}
</tbody>
            </table>

            <div className="cart-actions">
              <label>
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                Select All
              </label>

              <button className="delete-btn" onClick={handleDeleteSelected}>
                <DeleteOutlined /> Delete
              </button>

              <span className="total-price">Total: PHP {totalPrice.toFixed(2)}</span>

              <button className="checkout-btn" onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </MainPage>
  );
};

export default Carts;
