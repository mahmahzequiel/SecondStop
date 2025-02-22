import React, { useEffect } from "react";
import { message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainPage from "../Reusable/MainPage";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const res = await axios.post("http://127.0.0.1:8000/api/logout");
        console.log("Logout response:", res.data);
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
        delete axios.defaults.headers.common["Authorization"];
        navigate("/LogIn");
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <MainPage>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Logging out...</h2>
      </div>
    </MainPage>
  );
};

export default Logout;
