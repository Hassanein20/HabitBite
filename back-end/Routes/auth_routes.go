package Routes

import (
	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.Engine, authController *controllers.AuthController, cfg *config.Config) {
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/logout", authController.Logout)
		auth.GET("/profile", middleware.AuthMiddleware(cfg), authController.GetCurrentUser)
		auth.POST("/refresh", middleware.AuthMiddleware(cfg), authController.RefreshToken)
		auth.GET("/csrf", authController.GetCSRFToken)
	}
}
