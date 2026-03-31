module {{PROJECT_NAME}}

go {{GO_VERSION}}

require (
	github.com/gin-gonic/gin v{{GIN_VERSION}}
	github.com/golang-jwt/jwt/v5 v5.2.0
	gorm.io/driver/mysql v1.5.2
	gorm.io/gorm v1.25.5
)
