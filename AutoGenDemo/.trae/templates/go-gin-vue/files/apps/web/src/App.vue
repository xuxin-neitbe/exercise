<template>
  <div id="app">
    <header class="app-header">
      <h1>{{PROJECT_NAME}}</h1>
      <p>{{PROJECT_DESCRIPTION}}</p>
    </header>
    
    <main class="app-main">
      <div class="counter">
        <h2>计数器示例</h2>
        <button @click="count++">点击次数：{{ count }}</button>
      </div>
      
      <div class="products">
        <h2>产品列表示例</h2>
        <ProductList />
      </div>
    </main>
    
    <footer class="app-footer">
      <p>Powered by Gin + Vue</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProductList from './components/ProductList.vue'

const count = ref(0)
</script>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.app-header {
  margin-bottom: 40px;
}

.counter {
  margin: 20px 0;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #35495e;
}
</style>
