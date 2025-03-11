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
        setProfileData(response.data.profile); // Assuming the backend returns { profile: {...} }
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

      {/* Pink background fills the screen */}
      <div className="pink-layer">
        <div className="content-design">
          {/* White container that holds both sidebar (white) + main content (peach) */}
          <div className="white-layer">
            <ProfileSidebar profileData={profileData} />
            <div className="main-layer">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileMain;