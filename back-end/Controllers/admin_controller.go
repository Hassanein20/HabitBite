package Controllers

import (
	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AdminController struct {
	userRepo repositories.UserRepository
}

func NewAdminController(repo repositories.UserRepository) *AdminController {
	return &AdminController{userRepo: repo}
}

// GetAllUsers returns all users in the system
func (ac *AdminController) GetAllUsers(c *gin.Context) {
	users, err := ac.userRepo.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
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

// UpdateUser updates a user's information
func (ac *AdminController) UpdateUser(c *gin.Context) {
	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	existingUser, err := ac.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if fullName, ok := requestData["fullName"].(string); ok {
		existingUser.FullName = fullName
	}
	if email, ok := requestData["email"].(string); ok {
		existingUser.Email = email
	}
	if username, ok := requestData["username"].(string); ok {
		existingUser.Username = username
	}
	if password, ok := requestData["password"].(string); ok && password != "" {
		// Hash password if provided
		existingUser.SetPassword(password)
	}
	if birthdate, ok := requestData["birthdate"].(string); ok {
		// Parse birthdate string to time.Time
		birthdateTime, err := time.Parse("2006-01-02", birthdate)
		if err == nil {
			existingUser.Birthdate = birthdateTime
		}
	}
	if gender, ok := requestData["gender"].(string); ok {
		existingUser.Gender = gender
	}
	if height, ok := requestData["height"].(float64); ok {
		existingUser.Height = height
	}
	if weight, ok := requestData["weight"].(float64); ok {
		existingUser.Weight = weight
	}
	if goalType, ok := requestData["goalType"].(string); ok {
		existingUser.GoalType = goalType
	}
	if activityLevel, ok := requestData["activityLevel"].(string); ok {
		existingUser.ActivityLevel = activityLevel
	}
	if dailyCalorieGoal, ok := requestData["dailyCalorieGoal"].(float64); ok {
		existingUser.DailyCalorieGoal = int(dailyCalorieGoal)
	}
	if role, ok := requestData["role"].(string); ok {
		existingUser.Role = role
	}

	if err := ac.userRepo.UpdateUser(c.Request.Context(), existingUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	sanitizedUser := existingUser.SanitizeUser()
	c.JSON(http.StatusOK, gin.H{
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

func (ac *AdminController) DeleteUser(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := ac.userRepo.DeleteUser(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (ac *AdminController) CreateUser(c *gin.Context) {
	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := &models.User{}

	if fullName, ok := requestData["fullName"].(string); ok {
		user.FullName = fullName
	}
	if email, ok := requestData["email"].(string); ok {
		user.Email = email
	}
	if username, ok := requestData["username"].(string); ok {
		user.Username = username
	}
	if password, ok := requestData["password"].(string); ok && password != "" {
		user.SetPassword(password)
	}
	if birthdate, ok := requestData["birthdate"].(string); ok {
		birthdateTime, err := time.Parse("2006-01-02", birthdate)
		if err == nil {
			user.Birthdate = birthdateTime
		}
	}
	if gender, ok := requestData["gender"].(string); ok {
		user.Gender = gender
	}
	if height, ok := requestData["height"].(float64); ok {
		user.Height = height
	}
	if weight, ok := requestData["weight"].(float64); ok {
		user.Weight = weight
	}
	if goalType, ok := requestData["goalType"].(string); ok {
		user.GoalType = goalType
	}
	if activityLevel, ok := requestData["activityLevel"].(string); ok {
		user.ActivityLevel = activityLevel
	}
	if dailyCalorieGoal, ok := requestData["dailyCalorieGoal"].(float64); ok {
		user.DailyCalorieGoal = int(dailyCalorieGoal)
	}
	if role, ok := requestData["role"].(string); ok {
		user.Role = role
	}

	if err := ac.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	sanitizedUser := user.SanitizeUser()
	c.JSON(http.StatusCreated, gin.H{
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
