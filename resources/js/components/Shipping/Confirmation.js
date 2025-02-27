import React, { useEffect, useState } from "react";
import MainPage from "../Reusable/MainPage";
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons"; // Import icons

const Confirmation = () => {
    const [orderDetails, setOrderDetails] = useState(null);

    useEffect(() => {
        // Retrieve order details from LocalStorage
        const storedOrder = localStorage.getItem("orderDetails");
        if (storedOrder) {
            setOrderDetails(JSON.parse(storedOrder));
        }
    }, []);

    if (!orderDetails) {
        return <p>Loading order details...</p>;
    }

    const { 
        orderNumber, 
        purchaseDate, 
        fullName, 
        phoneNumber, 
        address, 
        selectedItems, 
        subtotal, 
        shippingCost, 
        grandTotal 
    } = orderDetails;

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
                    <button className="track-order">Track Your Order</button>
                </div>

                {/* Order Details Container */}
                <div className="order-details">
                    <h2>Order Confirmation</h2>
                    <p><strong>Order Number:</strong> {orderNumber}</p>
                    <p><strong>Purchase Date:</strong> {purchaseDate}</p>

                    <h3>Customer Information</h3>
                    <p><strong>Full Name:</strong> {fullName}</p>
                    <p><strong>Phone Number:</strong> {phoneNumber}</p>
                    <p><strong>Address:</strong> {address}</p>

                    <h3>Item Details</h3>
                    <ul>
                        {selectedItems.map((item, index) => (
                            <li key={index}>
                                <span>{item.product_name}</span>
                                <span>PHP{item.price}.00</span>
                            </li>
                        ))}
                    </ul>

                    <h3>Order Summary</h3>
                    <div className="summary">
                        <p><strong>Subtotal:</strong> PHP{subtotal}.00</p>
                        <p><strong>Shipping Cost:</strong> PHP{shippingCost}.00</p>
                        <p><strong>Grand Total:</strong> PHP{grandTotal}.00</p>
                    </div>
                </div>
            </div>
        </MainPage>
    );
};

export default Confirmation;