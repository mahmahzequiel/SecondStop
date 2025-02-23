import React, { useEffect, useState } from "react";
import { Checkbox, Spin } from "antd";

const Filters = ({ selectedFilters, setSelectedFilters, onCategoryTypeSelect, onBrandSelect }) => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoryTypeResponse, brandResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/category-types"),
          fetch("http://127.0.0.1:8000/api/brands"),
        ]);

        if (!categoryTypeResponse.ok || !brandResponse.ok) {
          throw new Error("Failed to fetch filter data");
        }

        const categoryTypeData = await categoryTypeResponse.json();
        const brandData = await brandResponse.json();

        setCategoryTypes(Array.isArray(categoryTypeData) ? categoryTypeData : []);
        setBrands(Array.isArray(brandData.data) ? brandData.data : []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const handleFilterChange = (value, type) => {
    setSelectedFilters((prevFilters) => {
      let updatedFilters = { ...prevFilters };

      if (type === "categoryType") {
        Object.keys(updatedFilters).forEach((key) => {
          if (key.startsWith("categoryType_")) delete updatedFilters[key];
        });
      } else if (type === "brand") {
        Object.keys(updatedFilters).forEach((key) => {
          if (key.startsWith("brand_")) delete updatedFilters[key];
        });
      }

      if (value) {
        updatedFilters[value] = false;
      }

      return updatedFilters;
    });

    if (type === "categoryType" && value && onCategoryTypeSelect) {
      const selectedCategoryType = categoryTypes.find((type) => `categoryType_${type.id}` === value);
      onCategoryTypeSelect(selectedCategoryType);
    } else if (type === "categoryType" && !value && onCategoryTypeSelect) {
      onCategoryTypeSelect(null);
    }

    if (type === "brand" && value && onBrandSelect) {
      const selectedBrand = brands.find((brand) => `brand_${brand.id}` === value);
      onBrandSelect(selectedBrand);
    } else if (type === "brand" && !value && onBrandSelect) {
      onBrandSelect(null);
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
              {categoryTypes.map((categoryType) => (
                <Checkbox
                  key={categoryType.id}
                  checked={Object.keys(selectedFilters).includes(`categoryType_${categoryType.id}`)}
                  onChange={(e) =>
                    handleFilterChange(e.target.checked ? `categoryType_${categoryType.id}` : null, "categoryType")
                  }
                >
                  {categoryType.category_type}
                </Checkbox>
              ))}
            </div>
          )}

          {brands.length > 0 && (
            <div className="filter-group">
              <h4>Brands</h4>
              {brands.map((brand) => (
                <Checkbox
                  key={brand.id}
                  checked={Object.keys(selectedFilters).includes(`brand_${brand.id}`)}
                  onChange={(e) =>
                    handleFilterChange(e.target.checked ? `brand_${brand.id}` : null, "brand")
                  }
                >
                  {brand.name}
                </Checkbox>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Filters;