package Routes

import (
	config "HabitBite/backend/Config"
	controllers "HabitBite/backend/Controllers"
	middleware "HabitBite/backend/Middleware"

	"github.com/gin-gonic/gin"
)

func SetupFoodEntryRoutes(router *gin.Engine, foodEntryController *controllers.FoodEntryController, config *config.Config) {
	foodEntries := router.Group("/api/food-entries")
	{
		foodEntries.Use(middleware.AuthMiddleware(config))

		foodEntries.POST("", foodEntryController.AddFoodEntry)

		foodEntries.GET("/daily", foodEntryController.GetDailyEntries)

		foodEntries.GET("/nutrition", foodEntryController.GetDailyNutrition)

		foodEntries.DELETE("/:id", foodEntryController.DeleteFoodEntry)

		foodEntries.GET("/history", foodEntryController.GetNutritionHistory)
	}
}
