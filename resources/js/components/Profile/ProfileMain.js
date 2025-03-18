import React, { useEffect, useState } from "react";
import axios from "axios";
import MainPage from "../Reusable/MainPage"; // Import MainPage instead of Header
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

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <MainPage onSearch={onSearch}> {/* Use MainPage instead of Header */}
      <div className="profile-main">
        <div className="container">
          <div className="layout">
            <div className="sidebar">
              <ProfileSidebar profileData={profileData} />
            </div>
            <div className="content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </MainPage>
  );
}

export default ProfileMain;