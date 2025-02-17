import React from 'react';
import Header from './Header'; // Import the Header component

function MainPage() {
  return (
    <div>
      <Header />
      {/* First Layer (Magenta) */}
      <div className="first-layer">
        {/* Second Layer (Pink) */}
        <div className="second-layer">
        </div>
      </div>
    </div>
  );
}

export default MainPage;
