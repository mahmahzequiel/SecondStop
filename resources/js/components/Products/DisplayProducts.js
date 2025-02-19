import React, { useEffect, useState } from 'react';
import MainPage from '../Reusable/MainPage';

const DisplayProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <MainPage> {/* Use MainPage as a wrapper */}
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            {product.product_image && (
              <img
                src={`http://127.0.0.1:8000/${product.product_image}`} // Construct the correct URL
                alt={product.product_name}
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
            )}
            <h2>{product.product_name}</h2>
            <p>Price: ${product.price}</p>
            <p>{product.description}</p>
          </div>
        ))}
      </div>
    </MainPage>
  );
};

export default DisplayProducts;
