"""
{{PROJECT_NAME}} - {{PROJECT_DESCRIPTION}}

后端 API 服务入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="{{PROJECT_NAME}}",
    description="{{PROJECT_DESCRIPTION}}",
    version="{{PROJECT_VERSION}}"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}

@app.get("/api")
async def api_info():
    """API 信息"""
    return {
        "name": "{{PROJECT_NAME}}",
        "version": "{{PROJECT_VERSION}}"
    }

@app.get("/api/products")
async def get_products():
    """获取产品列表示例"""
    return {
        "success": True,
        "data": [
            {"id": 1, "name": "产品 1", "price": 99.99, "stock": 100},
            {"id": 2, "name": "产品 2", "price": 149.99, "stock": 50},
            {"id": 3, "name": "产品 3", "price": 199.99, "stock": 25}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
