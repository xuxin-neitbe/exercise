/**
 * 产品路由示例
 * 
 * 这是一个示例路由，展示如何添加业务逻辑
 */

import { Router, Request, Response } from 'express';

const router = Router();

// 模拟产品数据
const products = [
  { id: 1, name: '产品 1', price: 99.99, stock: 100 },
  { id: 2, name: '产品 2', price: 149.99, stock: 50 },
  { id: 3, name: '产品 3', price: 199.99, stock: 25 }
];

/**
 * GET /api/products
 * 获取所有产品
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: products,
    total: products.length
  });
});

/**
 * GET /api/products/:id
 * 获取单个产品
 */
router.get('/:id', (req: Request, res: Response) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

/**
 * POST /api/products
 * 创建新产品
 */
router.post('/', (req: Request, res: Response) => {
  const { name, price, stock } = req.body;
  
  // 简单验证
  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: '产品名称和价格必填'
    });
  }
  
  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    stock: stock || 0
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: newProduct
  });
});

export default router;
