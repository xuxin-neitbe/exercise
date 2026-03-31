import { useState } from 'react'
import ProductList from './components/ProductList'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>{{PROJECT_NAME}}</h1>
        <p>{{PROJECT_DESCRIPTION}}</p>
      </header>

      <main className="app-main">
        <section className="demo-section">
          <h2>功能演示</h2>
          
          <div className="counter">
            <h3>计数器示例</h3>
            <button onClick={() => setCount((count) => count + 1)}>
              点击次数：{count}
            </button>
          </div>

          <div className="products">
            <ProductList />
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Powered by Node.js + Express + React</p>
      </footer>
    </div>
  )
}

export default App
