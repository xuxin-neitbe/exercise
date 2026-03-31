/**
 * 产品列表示件
 * 
 * 展示产品列表示例，演示如何调用后端 API
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取产品列表
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data.data || []);
        setError(null);
      } catch (err) {
        setError('加载产品失败，请稍后重试');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="product-list">
      <h2>产品列表</h2>
      {products.length === 0 ? (
        <p>暂无产品</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="price">¥{product.price.toFixed(2)}</p>
              <p className="stock">
                {product.stock > 0 ? (
                  <span className="in-stock">库存：{product.stock}</span>
                ) : (
                  <span className="out-of-stock">缺货</span>
                )}
              </p>
              <button 
                className="buy-btn"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? '缺货' : '购买'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
