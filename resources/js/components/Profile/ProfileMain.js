// ProfileMain.js
import React from "react";
import Header from "../Reusable/Header";
import ProfileSidebar from "./ProfileSidebar";

function ProfileMain({ children, onSearch, profileData }) {
  return (
    <div>
      <Header onSearch={onSearch} />
      <div className="white-layer">
        <div className="content-wrapper">
          <div className="pink-layer">
            <div className="profile-page">
              {/* Pass the user's data into the sidebar so it shows the correct name/avatar */}
              <ProfileSidebar profileData={profileData} />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileMain;
