import React from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation and useNavigate
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons"; // Import icons

const Confirmation = () => {
    // Use useLocation to access data passed from the Payment page
    const location = useLocation();
    const orderDetails = location.state;
    const navigate = useNavigate(); // ✅ Initialize useNavigate

    // If no order details are found, show a loading message
    if (!orderDetails) {
        return <p>Loading order details...</p>;
    }

    // Destructure order details
    const { 
        orderNumber, 
        purchaseDate, 
        address = {}, 
        selectedItems = [], 
        totalPrice, 
        paymentMethod 
    } = orderDetails;

    // Ensure address fields exist to prevent undefined errors
    const {
        fullname = "N/A",
        phone = "N/A",
        country = "N/A",
        region = "N/A",
        state = "N/A",
        city = "N/A",
        barangay = "N/A",
        street = "N/A"
    } = address;

    // Ensure selectedItems contains valid data
    const formattedItems = selectedItems.map((item) => ({
        ...item,
        price: Number(item.price) || 0, // Ensure price is a number
    }));

    // Calculate subtotal, shipping cost, and grand total
    const shippingCost = 70;
    const subtotal = totalPrice - shippingCost;
    const grandTotal = totalPrice;

    return (
        <MainPage>
            <div className="confirmation-page">
                {/* Progress Bar */}
                <div className="progress-bar">
                    <div className="step">
                        <ShoppingCartOutlined />
                        <span>Checkout</span>
                    </div>
                    <div className="line"></div>
                    <div className="step">
                        <CreditCardOutlined />
                        <span>Payment</span>
                    </div>
                    <div className="line"></div>
                    <div className="step active">
                        <CheckCircleOutlined />
                        <span>Confirmation</span>
                    </div>
                </div>

                {/* Animation or Image Container */}
                <div className="animation-container">
                    <img src="/images/order.png" alt="Order Confirmation" />
                    {/* Track Order Button */}
                    <button className="track-order" onClick={() => navigate("/purchases")}>
                        Track Your Order
                    </button>
                </div>

                {/* Order Details Container */}
                <div className="order-details">
                    <h2>Order Confirmation</h2>
                    <p><strong>Order Number:</strong> {orderNumber}</p>
                    <p><strong>Purchase Date:</strong> {purchaseDate}</p>

                    <h3>Customer Information</h3>
                    <p><strong>Full Name:</strong> {fullname}</p>
                    <p><strong>Phone Number:</strong> {phone}</p>
                    <p><strong>Address:</strong> {`${country}, ${region}, ${state}, ${city}, ${barangay}, ${street}`}</p>

                    <h3>Item Details</h3>
                    <ul>
                        {formattedItems.map((item, index) => (
                            <li key={index}>
                                <span>{item.product_name}</span>
                                <span>PHP {item.price.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>

                    <h3>Order Summary</h3>
                    <div className="summary">
                        <p><strong>Subtotal:</strong> PHP {subtotal.toFixed(2)}</p>
                        <p><strong>Shipping Cost:</strong> PHP {shippingCost.toFixed(2)}</p>
                        <p><strong>Grand Total:</strong> PHP {grandTotal.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> {paymentMethod}</p>
                    </div>
                </div>
            </div>
        </MainPage>
    );
};

export default Confirmation;
