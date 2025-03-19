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
          alert("Please log in to view your cart.");
          navigate("/login");
          return;
        }
        const response = await axios.get("http://127.0.0.1:8000/api/carts", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const fetchedItems = Array.isArray(response.data) ? response.data : [];
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

  const handleSelectItem = (cartItemId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(cartItemId)
        ? prevSelected.filter((id) => id !== cartItemId)
        : [...prevSelected, cartItemId]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(selectAll ? [] : cartItems.map((item) => item.id));
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("Please log in to delete items.");
      navigate("/login");
      return;
    }
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/carts/delete",
        { cart_item_ids: selectedItems },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const updatedCart = cartItems.filter((item) => !selectedItems.includes(item.id));
      setCartItems(updatedCart);
      setSelectedItems([]);
      setSelectAll(false);
      if (userId) {
        localStorage.setItem(`cartCount_${userId}`, updatedCart.length.toString());
        window.dispatchEvent(new Event("cartCountUpdated"));
      }
    } catch (error) {
      console.error("Error deleting cart items:", error);
    }
  };

  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
  const totalPrice = selectedCartItems.reduce(
    (acc, item) => acc + parseFloat(item.product?.price || 0) * (item.quantity || 1),
    0
  );

  const handleCheckout = () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("Please log in to proceed to checkout.");
      navigate("/login");
      return;
    }
    if (selectedCartItems.length === 0) {
      alert("Please select items to checkout.");
      return;
    }
    navigate("/checkout", {
      state: {
        selectedItems: selectedCartItems.map((item) => ({
          cart_id: item.cart_id,
          product_name: item.product?.product_name,
          price: item.product?.price,
          brand: item.product?.brand,
          quantity: item.quantity || 1,
        })),
        totalPrice,
      },
    });
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
                  <th>Price</th>
                  <th>Quantity</th>
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
                    <td className="product_name">
                      {item.product?.product_name || "Unknown Product"}
                    </td>
                    <td>
                      <img
                        src={
                          item.product?.product_image
                            ? `http://127.0.0.1:8000/storage/${item.product.product_image}`
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
                    <td className="quantity">{item.quantity || 1}</td>
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
