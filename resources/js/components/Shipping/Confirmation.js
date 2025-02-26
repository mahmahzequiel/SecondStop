import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const Confirmation = () => {
    const location = useLocation();
    const { selectedItems = [], totalPrice = 0 } = location.state || {};

    const [orderNumber, setOrderNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [profile, setProfile] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        phone_number: "",
    });
    const [address, setAddress] = useState({
        fullname: "",
        phone: "",
        country: "",
        region: "",
        state: "",
        city: "",
        barangay: "",
        houseNo: "",
        street: "",
        postalCode: "",
    });

    useEffect(() => {
        // Generate order number and purchase date
        setOrderNumber("ORD-" + Math.floor(100000 + Math.random() * 900000));
        setPurchaseDate(new Date().toLocaleString());

        // Fetch profile and address data
        const fetchProfileAndAddress = async () => {
            try {
                const token = localStorage.getItem("userToken");
                if (!token) return;

                // Fetch profile data
                const profileResponse = await axios.get("http://127.0.0.1:8000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (profileResponse.data) {
                    const profile = profileResponse.data.profile || {};
                    const userId = profile.user_id;

                    // Fetch address data
                    const addressResponse = await axios.get(`http://127.0.0.1:8000/api/address/user/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const addressData = addressResponse.data.addresses?.[0] || {};

                    // Set profile and address state
                    setProfile({
                        first_name: profile.first_name || "",
                        middle_name: profile.middle_name || "",
                        last_name: profile.last_name || "",
                        phone_number: profile.phone_number || "",
                    });

                    setAddress({
                        fullname: `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`,
                        phone: profile.phone_number || "",
                        country: addressData.country || "",
                        region: addressData.region || "",
                        state: addressData.state || "",
                        city: addressData.city || "",
                        barangay: addressData.barangay || "",
                        houseNo: addressData.house_no || "",
                        street: addressData.street || "",
                        postalCode: addressData.postal_code || "",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile or address", error);
            }
        };

        fetchProfileAndAddress();
    }, []);

    // Construct full name from profile data
    const fullName = `${profile.first_name || ""} ${profile.middle_name ? profile.middle_name + " " : ""}${profile.last_name || ""}`;

    return (
        <div>
            <h2>Order Confirmation</h2>
            <p><strong>Order Number:</strong> {orderNumber}</p>
            <p><strong>Purchase Date:</strong> {purchaseDate}</p>

            <h3>Customer Information</h3>
            <p><strong>Full Name:</strong> {fullName.trim() || "N/A"}</p>
            <p><strong>Phone Number:</strong> {profile.phone_number || "N/A"}</p>
            <p>
                <strong>Address:</strong>{" "}
                {`${address.houseNo || ""} ${address.street || ""}, ${address.barangay || ""}, ${address.city || ""}, ${address.state || ""}, ${address.region || ""}, ${address.country || ""}, ${address.postalCode || ""}`}
            </p>

            <h3>Item Details</h3>
            <ul>
                {selectedItems.map((item, index) => (
                    <li key={index}>
                        <span>{item.name}</span> - <span>PHP{item.price}.00</span>
                    </li>
                ))}
            </ul>

            <h3>Order Summary</h3>
            <p><strong>Subtotal:</strong> PHP{totalPrice}.00</p>
            <p><strong>Shipping Cost:</strong> PHP70.00</p>
            <p><strong>Grand Total:</strong> PHP{(totalPrice + 70).toFixed(2)}</p>
        </div>
    );
};

export default Confirmation;