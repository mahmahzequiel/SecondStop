import React, { useEffect, useState } from "react";
import { Checkbox, Spin } from "antd";

const Filters = ({ selectedFilters, setSelectedFilters, onCategoryTypeSelect, onBrandSelect }) => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/category-types"),
          fetch("http://127.0.0.1:8000/api/brands"),
        ]);

        if (!categoryResponse.ok || !brandResponse.ok) {
          throw new Error("Failed to fetch filter data");
        }

        const categoryData = await categoryResponse.json();
        const brandData = await brandResponse.json();

        setCategoryTypes(Array.isArray(categoryData) ? categoryData : []);
        setBrands(Array.isArray(brandData.data) ? brandData.data : []); // Fix

      } catch (error) {
        console.error("Error fetching filters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const handleFilterChange = (checkedValues) => {
    const updatedFilters = {};

    setSelectedFilters(updatedFilters);

    // **Category Selection Logic**
    const selectedCategoryIds = checkedValues
      .filter((value) => value.startsWith("category_"))
      .map((value) => value.replace("category_", ""));

    if (selectedCategoryIds.length > 0 && onCategoryTypeSelect) {
      const selectedCategoryType = categoryTypes.find((type) => type.id === parseInt(selectedCategoryIds[0]));
      onCategoryTypeSelect(selectedCategoryType);
    }

    // **Brand Selection Logic**
    const selectedBrandIds = checkedValues
      .filter((value) => value.startsWith("brand_"))
      .map((value) => value.replace("brand_", ""));

    if (selectedBrandIds.length > 0 && onBrandSelect) {
      const selectedBrand = brands.find((brand) => brand.id === parseInt(selectedBrandIds[0]));
      onBrandSelect(selectedBrand);
    }
  };

  return (
    <div className="filters-container">
      <h3>Filters</h3>
      {loading ? (
        <Spin tip="Loading filters..." />
      ) : (
        <>
          {categoryTypes.length > 0 && (
            <div className="filter-group">
              <h4>Sub Category</h4>
              <Checkbox.Group
                options={categoryTypes.map((category) => ({
                  label: category.category_type,
                  value: `category_${category.id}`,
                }))}
                value={Object.keys(selectedFilters).filter((key) => selectedFilters[key])}
                onChange={handleFilterChange}
              />
            </div>
          )}

          {brands.length > 0 && (
            <div className="filter-group">
              <h4>Brands</h4>
              <Checkbox.Group
                options={brands.map((brand) => ({
                  label: brand.name,
                  value: `brand_${brand.id}`,
                }))}
                value={Object.keys(selectedFilters).filter((key) => selectedFilters[key])}
                onChange={handleFilterChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Filters;
