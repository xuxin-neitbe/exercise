<template>
  <div class="product-list">
    <h2>产品列表</h2>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="products.length === 0">暂无产品</div>
    <div v-else class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h3>{{ product.name }}</h3>
        <p class="price">¥{{ product.price.toFixed(2) }}</p>
        <p class="stock">
          <span v-if="product.stock > 0" class="in-stock">库存：{{ product.stock }}</span>
          <span v-else class="out-of-stock">缺货</span>
        </p>
        <button :disabled="product.stock === 0">
          {{ product.stock === 0 ? '缺货' : '购买' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const products = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await axios.get(`${API_URL}/products`)
    products.value = response.data.data || []
    error.value = null
  } catch (err) {
    error.value = '加载产品失败，请稍后重试'
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.product-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: left;
}

.price {
  color: #e74c3c;
  font-size: 18px;
  font-weight: bold;
}

.in-stock {
  color: #27ae60;
}

.out-of-stock {
  color: #95a5a6;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
</style>
