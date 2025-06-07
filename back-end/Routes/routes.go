package Routes

import (
	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"
	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func SetupRoutes(router *gin.Engine, db *sqlx.DB, cfg *config.Config) {
	userRepo := repositories.NewUserRepository(db)
	foodEntryRepo := repositories.NewFoodEntryRepository(db)

	userService := models.NewUserService(userRepo)

	authController := controllers.NewAuthControllerWithService(userService, cfg)
	foodEntryController := controllers.NewFoodEntryController(foodEntryRepo)
	adminController := controllers.NewAdminController(userRepo)
	dietitianController := controllers.NewDietitianController(userRepo)

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	public := router.Group("/api")
	{
		public.POST("/auth/register", authController.Register)
		public.POST("/auth/login", authController.Login)
		public.POST("/auth/logout", authController.Logout)
		public.GET("/auth/csrf", authController.GetCSRFToken)
	}
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(cfg))
	{
		protected.GET("/auth/profile", authController.GetCurrentUser)
		protected.POST("/auth/refresh", authController.RefreshToken)
		protected.GET("/user/goals", authController.GetUserGoals)
		protected.PUT("/user/goals", authController.UpdateUserGoals)

		protected.POST("/consumed-foods", foodEntryController.AddFoodEntry)
		protected.GET("/consumed-foods/daily", foodEntryController.GetDailyEntries)
		protected.GET("/consumed-foods/nutrition", foodEntryController.GetDailyNutrition)
		protected.DELETE("/consumed-foods/:id", foodEntryController.DeleteFoodEntry)
		protected.GET("/consumed-foods/history", foodEntryController.GetNutritionHistory)

		admin := protected.Group("/admin")
		admin.Use(middleware.AdminAuthMiddleware())
		{
			admin.GET("/users", adminController.GetAllUsers)
			admin.POST("/users", adminController.CreateUser)
			admin.PUT("/users/:id", adminController.UpdateUser)
			admin.DELETE("/users/:id", adminController.DeleteUser)
			admin.POST("/recalculate-goals", authController.RecalculateAllUserGoals)
		}

		protected.GET("/dietitians", dietitianController.GetAvailableDietitians)
		protected.POST("/dietitians/:dietitianId/subscribe", dietitianController.SubscribeToDietitian)
		protected.DELETE("/dietitians/:dietitianId/subscribe", dietitianController.UnsubscribeFromDietitian)

		dietitian := protected.Group("/dietitian")
		dietitian.Use(middleware.DietitianAuthMiddleware())
		{
			dietitian.GET("/users", dietitianController.GetSubscribedUsers)
			dietitian.GET("/users/:userId/progress", dietitianController.GetUserProgress)
			dietitian.GET("/users/:userId/goals", dietitianController.GetUserGoals)
			dietitian.PUT("/users/:userId/goals", dietitianController.UpdateUserGoals)
		}
	}
}
