import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";
import axios from "axios";
import { PayCircleOutlined, MobileOutlined, ShoppingOutlined, ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from "@ant-design/icons";

// Import payment components
import PaypalPayment from "../PaymentMethods/PaypalPayment";
import GcashPayment from "../PaymentMethods/GcashPayment";
import CODPayment from "../PaymentMethods/CODPayment";

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedItems = [], totalPrice = 0, address: receivedAddress } = location.state || {};

const [address, setAddress] = useState(receivedAddress || {
    fullname: "",
    phone: "",
    country: "",
    region: "",
    state: "",
    city: "",
    barangay: "",
    street: ""
    });

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        const fetchProfileAndAddress = async () => {
            try {
                const token = localStorage.getItem("userToken");
                if (!token) return;

                const profileResponse = await axios.get("http://127.0.0.1:8000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (profileResponse.data) {
                    const profile = profileResponse.data.profile || {};
                    const userId = profile.user_id;

                    const addressResponse = await axios.get(`http://127.0.0.1:8000/api/address/user/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const addressData = addressResponse.data.addresses?.[0] || {};

                    setAddress({
                        fullname: `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`,
                        phone: profile.phone_number || "",
                        country: addressData.country || "",
                        region: addressData.region || "",
                        state: addressData.state || "",
                        city: addressData.city || "",
                        barangay: addressData.barangay || "",
                        street: addressData.street || ""
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile or address", error);
            }
        };

        fetchProfileAndAddress();
    }, []);

    const removePurchasedItemsFromCart = async (cartIds) => {
        try {
            if (!Array.isArray(cartIds) || cartIds.length === 0) {
                console.warn("⚠ No valid cart items to remove.");
                return;
            }
    
            const userToken = localStorage.getItem("userToken");
    
            await axios.post(
                "http://127.0.0.1:8000/api/carts/delete",
                { cart_ids: cartIds },  // Ensure cart_ids is an array
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
    
            console.log("✅ Purchased items removed from cart:", cartIds);
        } catch (error) {
            console.error("❌ Failed to remove purchased items:", error.response?.data || error);
        }
    };
    

    const handlePaymentSuccess = async (details) => {
        try {
            setPaymentDetails(details);
            alert(`Payment successful via ${details.method}!`);
    
            // Step 1: Save Payment Details and Get Payment ID
            const paymentId = await savePaymentDetails(details);
    
            if (!paymentId) {
                console.error("❌ Payment ID is undefined or null");
                throw new Error("Payment ID is missing");
            }
    
            // Step 2: Generate Order Data
            const orderData = {
                orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
                purchaseDate: new Date().toISOString(),
                userId: localStorage.getItem("userId"),
                items: selectedItems.map(item => ({
                    cart_id: item.cart_id,
                    product_name: item.product_name,
                    price: item.price,
                    brand: item.brand
                })),
                totalPrice: totalPrice + 70,
                paymentMethod: details.method,
                shippingAddress: `${address.country}, ${address.region}, ${address.state}, ${address.city}, ${address.barangay}, ${address.street}`,
                paymentId // Step 3: Attach Payment ID
            };
    
            // Step 4: Save Order Details
            const orderId = await saveOrderDetails(orderData);
    
            // Step 5: Remove Purchased Items from Cart
            const cartIds = selectedItems.map(item => item.cart_id);
            if (cartIds.length > 0) {
                await removePurchasedItemsFromCart(cartIds);
            }
    
            // Step 6: Redirect to Confirmation Page
            navigate("/confirmation", {
                state: {
                    orderNumber: orderData.orderNumber,
                    purchaseDate: orderData.purchaseDate,
                    address,
                    selectedItems,
                    totalPrice: totalPrice + 70,
                    paymentMethod: details.method
                },
            });
    
        } catch (error) {
            console.error("Error processing payment:", error);
            alert("Failed to process payment. Please try again.");
        }
    };
    
    
    
    
    

    const savePaymentDetails = async (details) => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.post(
                "http://127.0.0.1:8000/api/payments",
                { payment_method: details.method.toLowerCase() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            console.log("✅ Payment details saved:", response.data);
    
            // Check if the response contains the expected payment_id
            if (response.data && response.data.payment_id) {
                return response.data.payment_id;  // Use payment_id instead of id
            } else {
                console.error("❌ Payment ID not received from API. Response:", response.data);
                throw new Error("Payment ID is missing in the API response");
            }
        } catch (error) {
            console.error("❌ Failed to save payment details:", error.response?.data || error);
            throw error; // Re-throw the error to handle it in the calling function
        }
    };
    

    const saveOrderDetails = async (orderData) => {
        try {
            const token = localStorage.getItem("userToken");
    
            console.log("🔍 Sending Order Data:", orderData);
    
            // Ensure cartIds is always an array
            const cartIds = orderData.items.map(item => item.cart_id).filter(id => id !== undefined && id !== null);
    
            console.log("📌 Processed cart_id:", cartIds, "Type:", typeof cartIds); // Debugging
    
            const response = await axios.post(
                "http://127.0.0.1:8000/api/orders",
                {
                    cart_id: cartIds, // Always send cart_id as an array
                    payment_id: orderData.paymentId,
                    address_id: orderData.addressId || null,
                    subtotal: orderData.totalPrice, // Fix variable usage
                    shipping_cost: 70,
                    total_amount: orderData.totalPrice + 70,
                    status: "pending",
                    purchase_date: new Date().toISOString().split("T")[0],
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            console.log("✅ Order details saved:", response.data);
            return response.data.order.id;
        } catch (error) {
            console.error("❌ Failed to save order details:", error.response?.data || error);
            throw error;
        }
    };
    
    

    const [isGcashModalVisible, setIsGcashModalVisible] = useState(false);
    const [isPaypalVisible, setIsPaypalVisible] = useState(false);
    

    const renderPaymentForm = () => {
        switch (selectedPaymentMethod) {
            case "Paypal":
                return (
                    <PaypalPayment 
                        isVisible={isPaypalVisible} 
                        onClose={() => setIsPaypalVisible(false)} 
                        onPaymentSuccess={handlePaymentSuccess} 
                    />
                );
            case "Gcash":
                return (
                    <GcashPayment 
                        visible={isGcashModalVisible} 
                        onClose={() => setIsGcashModalVisible(false)}
                        onPaymentSuccess={handlePaymentSuccess} 
                    />
                );
            case "COD":
                return <CODPayment onPaymentSuccess={handlePaymentSuccess} />;
            default:
                return null;
        }
    };
    
    
    
    
    const handlePaymentMethodChange = (e) => {
        const method = e.target.value;
        setSelectedPaymentMethod(method);
    
        // Ensure only one modal is open at a time
        setIsPaypalVisible(method === "Paypal");
        setIsGcashModalVisible(method === "Gcash");
    };
    
    

    return (
        <MainPage>
            <div className="payment-container">
                <h2>Order Summary</h2>
                <div className="order-summary">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> {address.fullname}</p>
                    <p><strong>Phone:</strong> {address.phone}</p>
                    <p><strong>Shipping Address:</strong> {`${address.country}, ${address.region}, ${address.state}, ${address.city}, ${address.barangay}, ${address.street}`}</p>
                    <hr />

                    <h3>Item/s Details</h3>
                    <ul>
                        {selectedItems.map((item, index) => (
                            <li key={index}>
                                <span className="item-name">{item.product_name}</span>
                                <span className="item-price">PHP{item.price}.00</span>
                            </li>
                        ))}
                    </ul>

                    <div className="price-row">
                        <span className="label">Subtotal</span>
                        <span className="price">PHP{totalPrice}.00</span>
                    </div>
                    <div className="price-row">
                        <span className="label">Shipping Cost</span>
                        <span className="price">PHP70.00</span>
                    </div>
                    <hr />
                    <div className="price-row">
                        <span className="label">Grand Total</span>
                        <span className="price">PHP{(totalPrice + 70).toFixed(2)}</span>
                    </div>
                </div>

                <h3>Payment Method</h3>
                <div className="payment-method">
                    <label>
                    <input 
    type="radio" 
    name="payment" 
    value="Paypal" 
    onChange={handlePaymentMethodChange} 
/>
<PayCircleOutlined /> Paypal

                    </label>
                    <label>
                    <input 
    type="radio" 
    name="payment" 
    value="Gcash" 
    onChange={handlePaymentMethodChange} 
/>
<MobileOutlined /> Gcash

                    </label>
                    <label>
                        <input type="radio" name="payment" value="COD" onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                        <ShoppingOutlined /> Cash On Delivery
                    </label>
                </div>

                {renderPaymentForm()}
            </div>
        </MainPage>
    );
};

export default Payment;