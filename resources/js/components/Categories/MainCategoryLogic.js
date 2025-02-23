import { useState, useEffect } from "react";

const useMainCategories = () => {
  const [mainCategories, setMainCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);

  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/categories");
        if (!response.ok) throw new Error("Failed to fetch main categories");
        
        const data = await response.json();
        setMainCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching main categories:", error);
      }
    };

    fetchMainCategories();
  }, []);

  const handleMainCategorySelect = (category) => {
    setSelectedMainCategory((prevCategory) => (prevCategory?.id === category.id ? null : category));
  };

  return { mainCategories, selectedMainCategory, handleMainCategorySelect };
};

export default useMainCategories;
