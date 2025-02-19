import React, { useEffect, useState } from 'react';
import MainPage from '../Reusable/MainPage';
import { ShoppingCartOutlined } from '@ant-design/icons'; // Import the cart icon

const DisplayProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: 1, name: "Men's Apparel", image: 'images/categories/image1.png' },
    { id: 2, name: "Women's Apparel", image: 'images/categories/image2.png' },
    { id: 3, name: "Kid's Apparel", image: 'images/categories/image.png' }, // Fixed file name
  ];

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/products'); // Ensure API URL is correct
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Function to handle adding a product to the cart
  const handleAddToCart = (product) => {
    console.log('Added to cart:', product);
    alert(`${product.product_name} added to cart!`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <MainPage>
      {/* Category Section - Positioned at the Top */}
      <div className="category-container">
        {categories.map((category) => (
          <div key={category.id} className="category-item">
            <img
              src={`http://127.0.0.1:8000/${category.image}`} // Ensure correct image path
              alt={category.name}
              className="category-image"
            />
            <p>{category.name}</p>
          </div>
        ))}
      </div>

      {/* Product List Section */}
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            {product.product_image && (
              <img
                src={`http://127.0.0.1:8000/${product.product_image}`} // Ensure correct image path
                alt={product.product_name}
                className="product-image"
              />
            )}
            <h2>{product.product_name}</h2>
            <p>Price: ${product.price}</p>
            <div className="description-container">
              <p>{product.description}</p>
              <button
                className="cart-button"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCartOutlined className="icon" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </MainPage>
  );
};

export default DisplayProducts;
