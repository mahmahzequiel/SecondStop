import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MainPage from "../Reusable/MainPage"; // Import MainPage
import { ArrowLeftOutlined } from "@ant-design/icons"; // Import Ant Design back icon

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError("Failed to fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>{error}</h2>;
  if (!product) return <h2>Product not found</h2>;

  return (
    <MainPage>
      <div className="product-details-container">
        {/* Back Button with Ant Design Icon */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> Back
        </button>

        <div className="product-details">
          <div className="product-image-container">
            <img
              src={`http://127.0.0.1:8000/${product.product_image}`}
              alt={product.product_name}
              className="product-image"
            />
          </div>

          <div className="product-info">
            <h1>{product.product_name}</h1>
            <p className="price">Price: <span>PHP {product.price}</span></p>
            <p><strong>Description:</strong> {product.description}</p>
            <p><strong>Brand:</strong> {product.brand ? product.brand.name : "N/A"}</p>

            <div className="buttons">
              <button className="add-to-cart">🛒 Add to Cart</button>
              <button className="buy-now">Buy Now</button>
            </div>
          </div>
        </div>
      </div>
    </MainPage>
  );
};

export default ProductDetails;
