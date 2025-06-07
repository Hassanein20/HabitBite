package Controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	Models "HabitBite/backend/Models"
	Repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
)

type DietitianController struct {
	userRepo Repositories.UserRepository
}

func NewDietitianController(userRepo Repositories.UserRepository) *DietitianController {
	return &DietitianController{
		userRepo: userRepo,
	}
}

func (dc *DietitianController) GetSubscribedUsers(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		fmt.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var dietitianID int
	switch v := userIDValue.(type) {
	case float64:
		dietitianID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			fmt.Printf("Error converting string userID to int: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		dietitianID = id
	case int:
		dietitianID = v
	default:
		fmt.Printf("Unexpected userID type: %T\n", userIDValue)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if dietitianID == 0 {
		fmt.Println("Dietitian ID is zero after conversion")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get subscribed users
	users, err := dc.userRepo.GetSubscribedUsers(c.Request.Context(), dietitianID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get subscribed users"})
		return
	}

	var sanitizedUsers []gin.H
	for _, user := range users {
		sanitizedUser := user.SanitizeUser()
		sanitizedUsers = append(sanitizedUsers, gin.H{
			"id":               sanitizedUser.ID,
			"email":            sanitizedUser.Email,
			"username":         sanitizedUser.Username,
			"fullName":         sanitizedUser.FullName,
			"birthdate":        sanitizedUser.Birthdate,
			"gender":           sanitizedUser.Gender,
			"height":           sanitizedUser.Height,
			"weight":           sanitizedUser.Weight,
			"goalType":         sanitizedUser.GoalType,
			"activityLevel":    sanitizedUser.ActivityLevel,
			"dailyCalorieGoal": sanitizedUser.DailyCalorieGoal,
			"role":             sanitizedUser.Role,
			"createdAt":        sanitizedUser.CreatedAt,
			"updatedAt":        sanitizedUser.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, sanitizedUsers)
}

func (dc *DietitianController) GetAvailableDietitians(c *gin.Context) {
	dietitians, err := dc.userRepo.GetAvailableDietitians(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get available dietitians"})
		return
	}

	var sanitizedDietitians []gin.H
	for _, dietitian := range dietitians {
		sanitizedDietitian := dietitian.SanitizeUser()
		sanitizedDietitians = append(sanitizedDietitians, gin.H{
			"id":        sanitizedDietitian.ID,
			"email":     sanitizedDietitian.Email,
			"username":  sanitizedDietitian.Username,
			"fullName":  sanitizedDietitian.FullName,
			"gender":    sanitizedDietitian.Gender,
			"role":      sanitizedDietitian.Role,
			"createdAt": sanitizedDietitian.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, sanitizedDietitians)
}

func (dc *DietitianController) SubscribeToDietitian(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		fmt.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var userID int
	switch v := userIDValue.(type) {
	case float64:
		userID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			fmt.Printf("Error converting string userID to int: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		userID = id
	case int:
		userID = v
	default:
		fmt.Printf("Unexpected userID type: %T\n", userIDValue)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if userID == 0 {
		fmt.Println("User ID is zero after conversion")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	dietitianIDStr := c.Param("dietitianId")
	dietitianID, err := strconv.Atoi(dietitianIDStr)
	if err != nil {
		fmt.Printf("Error converting dietitianId parameter to int: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dietitian ID"})
		return
	}

	fmt.Printf("Attempting to subscribe user %d to dietitian %d\n", userID, dietitianID)

	err = dc.userRepo.SubscribeUserToDietitian(c.Request.Context(), userID, dietitianID)
	if err != nil {
		fmt.Printf("Error subscribing user to dietitian: %v\n", err)
		if errors.Is(err, errors.New("dietitian not found")) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Dietitian not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to subscribe to dietitian"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully subscribed to dietitian"})
}

func (dc *DietitianController) UnsubscribeFromDietitian(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var userID int
	switch v := userIDValue.(type) {
	case float64:
		userID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		userID = id
	case int:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	dietitianIDStr := c.Param("dietitianId")
	dietitianID, err := strconv.Atoi(dietitianIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dietitian ID"})
		return
	}

	// Unsubscribe user from dietitian
	err = dc.userRepo.UnsubscribeUserFromDietitian(c.Request.Context(), userID, dietitianID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsubscribe from dietitian"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully unsubscribed from dietitian"})
}

func (dc *DietitianController) GetUserGoals(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		fmt.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var dietitianID int
	switch v := userIDValue.(type) {
	case float64:
		dietitianID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			fmt.Printf("Error converting string userID to int: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		dietitianID = id
	case int:
		dietitianID = v
	default:
		fmt.Printf("Unexpected userID type: %T\n", userIDValue)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if dietitianID == 0 {
		fmt.Println("Dietitian ID is zero after conversion")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDParam := c.Param("userId")
	userID, err := strconv.Atoi(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	isSubscribed, err := dc.userRepo.IsUserSubscribedToDietitian(c.Request.Context(), userIDParam, dietitianID)
	if err != nil || !isSubscribed {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized to view this user's goals"})
		return
	}

	goals, err := dc.userRepo.GetUserGoals(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user goals"})
		return
	}

	camelCaseGoals := gin.H{
		"goals": gin.H{
			"userId":           goals.UserID,
			"dailyCalorieGoal": goals.TargetCalories,
			"proteinGoal":      goals.TargetProtein,
			"carbsGoal":        goals.TargetCarbs,
			"fatsGoal":         goals.TargetFats,
			"targetWeight":     goals.TargetWeight,
			"goalType":         "",
			"activityLevel":    "",
		},
	}

	user, err := dc.userRepo.FindByID(c.Request.Context(), userID)
	if err == nil {
		camelCaseGoals["goals"].(gin.H)["goalType"] = user.GoalType
		camelCaseGoals["goals"].(gin.H)["activityLevel"] = user.ActivityLevel
	}

	c.JSON(http.StatusOK, camelCaseGoals)
}

func (dc *DietitianController) UpdateUserGoals(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		fmt.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var dietitianID int
	switch v := userIDValue.(type) {
	case float64:
		dietitianID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			fmt.Printf("Error converting string userID to int: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		dietitianID = id
	case int:
		dietitianID = v
	default:
		fmt.Printf("Unexpected userID type: %T\n", userIDValue)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if dietitianID == 0 {
		fmt.Println("Dietitian ID is zero after conversion")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDParam := c.Param("userId")
	userID, err := strconv.Atoi(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	isSubscribed, err := dc.userRepo.IsUserSubscribedToDietitian(c.Request.Context(), userIDParam, dietitianID)
	if err != nil || !isSubscribed {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized to update this user's goals"})
		return
	}

	var requestBody struct {
		DailyCalorieGoal int     `json:"dailyCalorieGoal"`
		ProteinGoal      float64 `json:"proteinGoal"`
		CarbsGoal        float64 `json:"carbsGoal"`
		FatsGoal         float64 `json:"fatsGoal"`
		TargetWeight     float64 `json:"targetWeight"`
		GoalType         string  `json:"goalType"`
		ActivityLevel    string  `json:"activityLevel"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	goals := &Models.UserGoals{
		UserID:         userID,
		TargetCalories: requestBody.DailyCalorieGoal,
		TargetProtein:  requestBody.ProteinGoal,
		TargetCarbs:    requestBody.CarbsGoal,
		TargetFats:     requestBody.FatsGoal,
		TargetWeight:   requestBody.TargetWeight,
	}

	// Update the user's goals
	err = dc.userRepo.UpdateUserGoals(c.Request.Context(), goals)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user goals"})
		return
	}

	// Always update the user's goal type and activity level
	user, err := dc.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		fmt.Printf("Error finding user with ID %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user details"})
		return
	}

	// Log the current user state
	fmt.Printf("Current user state - ID: %d, GoalType: %s, ActivityLevel: %s, CalorieGoal: %d\n",
		user.ID, user.GoalType, user.ActivityLevel, user.DailyCalorieGoal)

	// Only update if values are provided
	if requestBody.GoalType != "" {
		user.GoalType = requestBody.GoalType
	}

	if requestBody.ActivityLevel != "" {
		user.ActivityLevel = requestBody.ActivityLevel
	}

	user.DailyCalorieGoal = requestBody.DailyCalorieGoal

	fmt.Printf("Updated user state - ID: %d, GoalType: %s, ActivityLevel: %s, CalorieGoal: %d\n",
		user.ID, user.GoalType, user.ActivityLevel, user.DailyCalorieGoal)

	err = dc.userRepo.UpdateUser(c.Request.Context(), user)
	if err != nil {
		fmt.Printf("Error updating user with ID %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user details"})
		return
	}

	updatedGoals, err := dc.userRepo.GetUserGoals(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated user goals"})
		return
	}

	// Get user details to include goal type and activity level
	user, err = dc.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user details"})
		return
	}

	// Convert to camelCase for frontend
	camelCaseGoals := gin.H{
		"goals": gin.H{
			"userId":           updatedGoals.UserID,
			"dailyCalorieGoal": updatedGoals.TargetCalories,
			"proteinGoal":      updatedGoals.TargetProtein,
			"carbsGoal":        updatedGoals.TargetCarbs,
			"fatsGoal":         updatedGoals.TargetFats,
			"targetWeight":     updatedGoals.TargetWeight,
			"goalType":         user.GoalType,
			"activityLevel":    user.ActivityLevel,
		},
	}

	c.JSON(http.StatusOK, camelCaseGoals)
}

func (dc *DietitianController) GetUserProgress(c *gin.Context) {
	// Handle different possible types from JWT claims
	userIDValue, exists := c.Get("userID")
	if !exists {
		fmt.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert userID to int based on its type
	var dietitianID int
	switch v := userIDValue.(type) {
	case float64:
		dietitianID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			fmt.Printf("Error converting string userID to int: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
			return
		}
		dietitianID = id
	case int:
		dietitianID = v
	default:
		fmt.Printf("Unexpected userID type: %T\n", userIDValue)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if dietitianID == 0 {
		fmt.Println("Dietitian ID is zero after conversion")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID := c.Param("userId")

	// Verify the user is subscribed to this dietitian
	isSubscribed, err := dc.userRepo.IsUserSubscribedToDietitian(c.Request.Context(), userID, dietitianID)
	if err != nil || !isSubscribed {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized to view this user's progress"})
		return
	}

	// Get user's progress (nutrition history, weight changes, etc.)
	progress, err := dc.userRepo.GetUserProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user progress"})
		return
	}

	// Get user details to include in the response
	userIDInt, _ := strconv.Atoi(userID)
	user, err := dc.userRepo.FindByID(c.Request.Context(), userIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user details"})
		return
	}

	// Convert to camelCase for frontend
	if nutritionHistory, ok := progress["nutritionHistory"].(map[string]interface{}); ok {
		if _, ok := nutritionHistory["protein"]; !ok {
			nutritionHistory["protein"] = []float64{}
		}
		if _, ok := nutritionHistory["carbs"]; !ok {
			nutritionHistory["carbs"] = []float64{}
		}
		if _, ok := nutritionHistory["fats"]; !ok {
			nutritionHistory["fats"] = []float64{}
		}

		camelCaseProgress := gin.H{
			"nutritionHistory": gin.H{
				"dates":    nutritionHistory["dates"],
				"calories": nutritionHistory["calories"],
				"protein":  nutritionHistory["protein"],
				"carbs":    nutritionHistory["carbs"],
				"fats":     nutritionHistory["fats"],
			},
			"userDetails": gin.H{
				"fullName":         user.FullName,
				"weight":           user.Weight,
				"height":           user.Height,
				"goalType":         user.GoalType,
				"dailyCalorieGoal": user.DailyCalorieGoal,
			},
		}
		c.JSON(http.StatusOK, camelCaseProgress)
	} else {
		defaultProgress := gin.H{
			"nutritionHistory": gin.H{
				"dates":    []string{},
				"calories": []float64{},
				"protein":  []float64{},
				"carbs":    []float64{},
				"fats":     []float64{},
			},
			"userDetails": gin.H{
				"fullName":         user.FullName,
				"weight":           user.Weight,
				"height":           user.Height,
				"goalType":         user.GoalType,
				"dailyCalorieGoal": user.DailyCalorieGoal,
			},
		}
		c.JSON(http.StatusOK, defaultProgress)
	}
}
