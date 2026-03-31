package main

import (
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// 从环境变量读取端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
		})
	})

	// 启动服务器
	r.Run(":" + port)
}
