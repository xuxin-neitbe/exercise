import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

function App() {
  const [count, setCount] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`)
        setProducts(response.data.data || [])
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>{{PROJECT_NAME}}</h1>
        <p>{{PROJECT_DESCRIPTION}}</p>
      </header>

      <main className="app-main">
        <section className="demo-section">
          <div className="counter">
            <h2>计数器示例</h2>
            <button onClick={() => setCount((count) => count + 1)}>
              点击次数：{count}
            </button>
          </div>

          <div className="products">
            <h2>产品列表</h2>
            {loading ? (
              <p>加载中...</p>
            ) : products.length === 0 ? (
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
        </section>
      </main>

      <footer className="app-footer">
        <p>Powered by FastAPI + React</p>
      </footer>
    </div>
  )
}

export default App
