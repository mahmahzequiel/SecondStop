import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import { DeleteOutlined } from "@ant-design/icons";
import MainPage from "../Reusable/MainPage"; // Import MainPage

const Carts = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate(); // ✅ Initialize navigate

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);
  }, []);

  const handleSelectItem = (productId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    const updatedCart = cartItems.filter((item) => !selectedItems.includes(item.id));
    setCartItems(updatedCart);
    setSelectedItems([]);
    setSelectAll(false);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // ✅ Compute only the total of selected items
  const selectedCartItems = cartItems.filter((item) => selectedItems.includes(item.id));
  const totalPrice = selectedCartItems.reduce((acc, item) => acc + parseFloat(item.price), 0);

  // ✅ Handle Checkout (Redirect to Shipping)
  const handleCheckout = () => {
    const userToken = localStorage.getItem("userToken"); // ✅ Ensure user is logged in
    if (!userToken) {
      alert("Please log in to proceed to checkout.");
      return;
    }
    if (selectedCartItems.length === 0) {
      alert("Please select items to checkout.");
      return;
    }

    navigate("/checkout", {
      state: { selectedItems: selectedCartItems, totalPrice: totalPrice },
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
                  <th>Brand</th>
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
                    <td>{item.name}</td>
                    <td>
                    <img
  src={
    item.product_image
      ? item.product_image.startsWith("http")
        ? item.product_image
        : `${process.env.REACT_APP_BASE_URL}/${item.product_image}`
      : "/placeholder.jpg" // Fallback image if product_image is missing
  }
  alt={item.product_name || "Product Image"}
  className="cart-image"
/>

                    </td>
                    <td>{typeof item.brand === "object" ? item.brand.name : item.brand}</td>
                    <td className="price">PHP{item.price}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-actions">
              <label>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                Select All
              </label>

              <button className="delete-btn" onClick={handleDeleteSelected}>
                <DeleteOutlined /> Delete
              </button>

              <span className="total-price">Total: PHP{totalPrice.toFixed(2)}</span>

              <button className="checkout-btn" onClick={handleCheckout}> {/* ✅ Checkout Redirect */}
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
