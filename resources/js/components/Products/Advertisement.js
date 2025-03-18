import React, { useState, useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";


const Advertisement = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Ad content for the carousel
  const adContent = [
    {
      title: "Second Stop",
      subtitle: "Your one stop shop for second hand clothes",
      imageUrl: "/images/ad1.png", // You'll need to add these images to your public folder
     
    },
    {
      title: "Quality Threads",
      subtitle: "We offer premium thrifted clothes at affordable prices",
      imageUrl: "/images/ad2.png",
     
    },
    {
      title: "Sustainable Fashion",
      subtitle: "Reduce your carbon footprint with pre-loved garments",
      imageUrl: "/images/ad3.png",
    
    },
    {
      title: "Vintage Vibes",
      subtitle: "Unique pieces with character and history",
      imageUrl: "/images/ad4.png",
     
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => 
        prevSlide === adContent.length - 1 ? 0 : prevSlide + 1
      );
    }, 6000); // Slightly longer than product carousel for better readability
    
    return () => clearInterval(interval);
  }, [adContent.length]);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => 
      prevSlide === adContent.length - 1 ? 0 : prevSlide + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => 
      prevSlide === 0 ? adContent.length - 1 : prevSlide - 1
    );
  };

  return (
    <div className="advertisement">
      <div className="ad-carousel">
        <div className="ad-slides-container">
          {adContent.map((slide, index) => (
            <div 
              key={index} 
              className={`ad-slide ${index === currentSlide ? "active" : ""}`}
            >
              <div className="ad-slide-content">
                <h1 className="ad-title">{slide.title}</h1>
                <p className="ad-subtitle">{slide.subtitle}</p>
               
              </div>
              <div className="ad-slide-overlay"></div>
              <div 
                className="ad-slide-bg"
                style={{ backgroundImage: `url(${slide.imageUrl})` }}
              ></div>
            </div>
          ))}
        </div>
        
        <div className="ad-controls">
          <button className="ad-control prev" onClick={prevSlide}>
            <LeftOutlined />
          </button>
          <div className="ad-indicators">
            {adContent.map((_, index) => (
              <span 
                key={index} 
                className={`ad-indicator ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
              ></span>
            ))}
          </div>
          <button className="ad-control next" onClick={nextSlide}>
            <RightOutlined />
          </button>
        </div>
      </div>
      
      <div className="ad-features">
        <div className="ad-feature">
          <div className="ad-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Timeless Style</h3>
          <p>Fashion that stands the test of time</p>
        </div>
        <div className="ad-feature">
          <div className="ad-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Curated Collection</h3>
          <p>Handpicked items for unique style</p>
        </div>
        <div className="ad-feature">
          <div className="ad-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Eco-Friendly</h3>
          <p>Sustainable fashion choices</p>
        </div>
      </div>
    </div>
  );
};

export default Advertisement;