import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const OrderTracking = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await axios.get('/api/user/purchases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setPurchases(response.data.data);
        } else {
          setError('Failed to load purchase history.');
        }
      } catch (err) {
        setError('Error fetching purchase history: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const fetchPurchaseDetails = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`/api/user/purchases/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSelectedPurchase(response.data.data);
      } else {
        setError('Failed to load purchase details.');
      }
    } catch (err) {
      setError('Error fetching purchase details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && purchases.length === 0) {
    return <div className="flex justify-center p-8"><div className="loader">Loading...</div></div>;
  }

  if (error && purchases.length === 0) {
    return <div className="text-red-500 p-4 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      
      {purchases.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">You haven't made any purchases yet.</p>
          <Link to="/products" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div 
                  key={purchase.purchase_id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedPurchase?.purchase_id === purchase.purchase_id 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => fetchPurchaseDetails(purchase.purchase_id)}
                >
                  <div className="font-medium">Order #{purchase.order_number}</div>
                  <div className="text-sm text-gray-600">{formatDate(purchase.purchase_date)}</div>
                  <div className="text-sm font-medium mt-1">${purchase.total_amount.toFixed(2)}</div>
                  <div className="text-xs mt-1 inline-block px-2 py-1 rounded-full bg-gray-200">
                    {purchase.status || 'Processing'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedPurchase ? (
              <div className="bg-white border rounded-lg shadow-sm p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-bold">Order #{selectedPurchase.order_number}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedPurchase.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    selectedPurchase.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedPurchase.status || 'Processing'}
                  </span>
                </div>
                
                <div className="mb-4 text-sm text-gray-600">
                  <div>Purchase Date: {formatDate(selectedPurchase.purchase_date)}</div>
                  <div className="mt-1">Total Amount: ${selectedPurchase.total_amount.toFixed(2)}</div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Order Items</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPurchase.products.map((product) => (
                          <tr key={product.product_id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link to={`/products/${product.product_id}`} className="text-blue-600 hover:underline">
                                {product.product_name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                              ${product.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-6 py-3 text-right font-medium">
                            Total:
                          </td>
                          <td className="px-6 py-3 text-right font-bold">
                            ${selectedPurchase.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center h-full flex items-center justify-center">
                <div>
                  <p className="text-gray-600 mb-2">Select an order to view details</p>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;