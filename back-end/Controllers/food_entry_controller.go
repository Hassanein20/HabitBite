package Controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
)

type FoodEntryController struct {
	foodEntryRepo repositories.FoodEntryRepository
}

func NewFoodEntryController(repo repositories.FoodEntryRepository) *FoodEntryController {
	return &FoodEntryController{
		foodEntryRepo: repo,
	}
}

func (c *FoodEntryController) AddFoodEntry(ctx *gin.Context) {
	// Get user ID from context (set by AuthMiddleware)
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req models.FoodEntryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	entry := &models.FoodEntry{
		UserID:   int(userID.(float64)),
		FoodID:   req.FoodID,
		Name:     req.Name,
		Amount:   req.Amount,
		Calories: req.Calories,
		Protein:  req.Protein,
		Carbs:    req.Carbs,
		Fat:      req.Fat,
		Date:     req.Date,
	}

	if err := c.foodEntryRepo.CreateFoodEntry(ctx.Request.Context(), entry); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add food entry"})
		return
	}

	ctx.JSON(http.StatusCreated, entry)
}

func (c *FoodEntryController) GetDailyEntries(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	dateStr := ctx.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		fmt.Printf("[ERROR GetDailyEntries] Invalid date format: %v\n", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	entries, err := c.foodEntryRepo.GetDailyEntries(ctx.Request.Context(), int(userID.(float64)), date)
	if err != nil {
		fmt.Printf("[ERROR GetDailyEntries] Error fetching entries: %v\n", err)
		ctx.JSON(http.StatusOK, []interface{}{})
		return
	}
	type EntryResponse struct {
		ID        int       `json:"id"`
		FoodName  string    `json:"food_name"`
		Quantity  float64   `json:"quantity"`
		Calories  float64   `json:"calories"`
		Protein   float64   `json:"protein"`
		Carbs     float64   `json:"carbs"`
		Fat       float64   `json:"fat"`
		EntryDate time.Time `json:"entry_date"`
	}

	var response []EntryResponse
	for _, e := range entries {
		response = append(response, EntryResponse{
			ID:        e.ID,
			FoodName:  e.Name,
			Quantity:  e.Amount,
			Calories:  e.Calories,
			Protein:   e.Protein,
			Carbs:     e.Carbs,
			Fat:       e.Fat,
			EntryDate: e.Date,
		})
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *FoodEntryController) GetDailyNutrition(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	dateStr := ctx.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	nutrition, err := c.foodEntryRepo.GetDailyNutrition(ctx.Request.Context(), int(userID.(float64)), date)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get nutrition data"})
		return
	}

	ctx.JSON(http.StatusOK, nutrition)
}

// DeleteFoodEntry deletes a food entry
func (c *FoodEntryController) DeleteFoodEntry(ctx *gin.Context) {
	// Verify user is authenticated
	if _, exists := ctx.Get("userID"); !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	entryID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entry ID"})
		return
	}

	if err := c.foodEntryRepo.DeleteFoodEntry(ctx.Request.Context(), entryID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete food entry"})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// GetNutritionHistory retrieves nutrition data for a date range
func (c *FoodEntryController) GetNutritionHistory(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	startDateStr := ctx.Query("startDate")
	endDateStr := ctx.Query("endDate")

	if startDateStr == "" || endDateStr == "" {
		endDate := time.Now()
		startDate := endDate.AddDate(0, 0, -6)
		startDateStr = startDate.Format("2006-01-02")
		endDateStr = endDate.Format("2006-01-02")
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	if endDate.Before(startDate) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "End date must be after start date"})
		return
	}

	// Limit date range to 30 days
	if endDate.Sub(startDate) > 30*24*time.Hour {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Date range cannot exceed 30 days"})
		return
	}

	startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, time.UTC)
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, time.UTC)

	history, err := c.foodEntryRepo.GetNutritionHistory(ctx.Request.Context(), int(userID.(float64)), startDate, endDate)
	if err != nil {
		ctx.JSON(http.StatusOK, []interface{}{})
		return
	}
	ctx.JSON(http.StatusOK, history)
}
