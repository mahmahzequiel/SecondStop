import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../Reusable/Header";
import ProfileSidebar from "./ProfileSidebar";

function ProfileMain({ children, onSearch }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const response = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(response.data.profile);
      } catch (error) {
        setError(error.message || "Failed to fetch profile data");
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Header onSearch={onSearch} />

      {/* Match MainPage structure */}
      <div className="first-layer">
        <div className="content-wrapper">
          <div className="white-layer">
            <ProfileSidebar profileData={profileData} />
            <div className="second-layer">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileMain;