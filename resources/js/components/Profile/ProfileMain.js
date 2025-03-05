import React from "react";
import Header from "../Reusable/Header";
import ProfileSidebar from "./ProfileSidebar";

function ProfileMain({ children, onSearch, profileData }) {
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
