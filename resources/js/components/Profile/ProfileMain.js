import React from "react";
import Header from "../Reusable/Header"; // Import Header component


function ProfileMain({ children, onSearch }) { // ✅ Accept onSearch as a prop
  return (
    <div>

      <Header onSearch={onSearch} /> {/* ✅ Pass onSearch to Header */}
      {/* First Layer (Magenta) */}
      <div className="white-layer">
        <div className="content-wrapper">
          {/* Second Layer (Pink) */}
          <div className="pink-layer">{children}</div>
          
        </div>
      </div>
    </div>
  );
}

export default ProfileMain;
