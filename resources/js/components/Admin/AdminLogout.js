import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

function AdminLogout() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      setLoading(true);
      try {
        const res = await axios.post("http://127.0.0.1:8000/api/logout");
        if (res.data.status) {
          message.success("Logged out successfully!");
        } else {
          message.error("Logout failed!");
        }
      } catch (error) {
        console.error("Logout error:", error);
        message.error("Logout error. Please try again.");
      } finally {
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        setLoading(false);
        navigate("/LogIn");
      }
    };
    performLogout();
  }, [navigate]);

  return <p>{loading ? "Logging out..." : "Logged out."}</p>;
}

export default AdminLogout;
