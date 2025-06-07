package Controllers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	config "HabitBite/backend/Config"
	middleware "HabitBite/backend/Middleware"
	models "HabitBite/backend/Models"
	repositories "HabitBite/backend/Repositories"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthController struct {
	userRepo    repositories.UserRepository
	userService *models.UserService
	config      *config.Config
}

func NewAuthController(repo repositories.UserRepository, cfg *config.Config) *AuthController {
	return &AuthController{
		userRepo: repo,
		config:   cfg,
	}
}

func NewAuthControllerWithService(service *models.UserService, cfg *config.Config) *AuthController {
	return &AuthController{
		userService: service,
		config:      cfg,
	}
}

type RegisterRequest struct {
	Email         string  `json:"email" binding:"required,email"`
	Username      string  `json:"username" binding:"required,alphanum,min=3,max=50"`
	Password      string  `json:"password" binding:"required,min=8"`
	FullName      string  `json:"fullName" binding:"required"`
	Birthdate     string  `json:"birthdate" binding:"required"`
	Gender        string  `json:"gender" binding:"required,oneof=male female other"`
	Height        float64 `json:"height" binding:"required,gt=0"`
	Weight        float64 `json:"weight" binding:"required,gt=0"`
	GoalType      string  `json:"goalType" binding:"required,oneof=lose gain maintain"`
	ActivityLevel string  `json:"activityLevel" binding:"required,oneof=sedentary light moderate active very_active"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User  *models.AuthUser `json:"user"`
	Token string           `json:"token"`
}

func (ac *AuthController) Register(c *gin.Context) {
	log.Println("Register endpoint called")

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		log.Printf("Request body: %v", c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	log.Printf("Registration request received for email: %s", req.Email)
	log.Printf("Request data: %+v", req)

	birthdate, err := time.Parse("2006-01-02", req.Birthdate)
	if err != nil {
		log.Printf("Invalid birthdate format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid birthdate format. Use YYYY-MM-DD"})
		return
	}

	var existingUser *models.User
	var checkErr error

	if ac.userService != nil {
		existingUser, checkErr = ac.userService.FindUserByEmail(c.Request.Context(), req.Email)
	} else {
		existingUser, checkErr = ac.userRepo.FindByEmail(c.Request.Context(), req.Email)
	}

	if checkErr != nil && !errors.Is(checkErr, repositories.ErrUserNotFound) {
		log.Printf("Error checking if user exists: %v", checkErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user existence"})
		return
	}
	if existingUser != nil {
		log.Printf("User already exists with email: %s", req.Email)
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	dailyCalorieGoal := calculateDailyCalorieGoal(
		req.Weight,
		req.Height,
		req.Gender,
		time.Now().Year()-birthdate.Year(),
		req.ActivityLevel,
		req.GoalType,
	)

	log.Printf("Calculated daily calorie goal: %d", dailyCalorieGoal)

	user := &models.User{
		Email:            req.Email,
		Username:         req.Username,
		FullName:         req.FullName,
		Birthdate:        birthdate,
		Gender:           req.Gender,
		Height:           req.Height,
		Weight:           req.Weight,
		GoalType:         req.GoalType,
		ActivityLevel:    req.ActivityLevel,
		Role:             models.RoleUser,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		DailyCalorieGoal: dailyCalorieGoal,
	}

	if err := user.SetPassword(req.Password); err != nil {
		log.Printf("Error hashing password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	log.Printf("Attempting to create user in database with data: %+v", user)

	if ac.userService != nil {
		err = ac.userService.CreateUser(c.Request.Context(), user)
	} else {
		err = ac.userRepo.CreateUser(c.Request.Context(), user)
	}

	if err != nil {
		log.Printf("Error creating user: %v", err)
		if errors.Is(err, repositories.ErrUserAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("User created successfully with ID: %d", user.ID)

	accessToken, refreshToken, err := ac.generateAuthTokens(user)
	if err != nil {
		log.Printf("Error generating tokens: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	ac.setRefreshTokenCookie(c, refreshToken)

	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
		return
	}

	authUser := user.ToAuthUser()
	c.JSON(http.StatusCreated, gin.H{
		"user":    authUser,
		"token":   accessToken,
		"message": "User registered successfully",
	})
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid email or password format",
			"details": validationErrors(err),
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var user *models.User
	var err error

	if ac.userService != nil {
		user, err = ac.userService.FindUserByEmail(c.Request.Context(), email)
	} else {
		user, err = ac.userRepo.FindByEmail(c.Request.Context(), email)
	}

	if err != nil {
		log.Printf("User not found: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.CheckPassword(req.Password) {
		log.Printf("Invalid password for user: %s", email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	accessToken, refreshToken, err := ac.generateAuthTokens(user)
	if err != nil {
		log.Printf("Error generating tokens: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	ac.setRefreshTokenCookie(c, refreshToken)

	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
		return
	}

	authUser := user.ToAuthUser()
	c.JSON(http.StatusOK, gin.H{
		"user":  authUser,
		"token": accessToken,
	})
}

func (ac *AuthController) Logout(c *gin.Context) {
	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		ac.config.CookieDomain,
		true,
		true,
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	id, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var user *models.User
	var err error

	if ac.userService != nil {
		user, err = ac.userService.FindByID(c.Request.Context(), int(id))
	} else {
		user, err = ac.userRepo.FindByID(c.Request.Context(), int(id))
	}

	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		log.Printf("Error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user.ToAuthUser(),
	})
}

func (ac *AuthController) RefreshToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	id, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	var user *models.User
	var err error

	if ac.userService != nil {
		user, err = ac.userService.FindByID(c.Request.Context(), int(id))
	} else {
		user, err = ac.userRepo.FindByID(c.Request.Context(), int(id))
	}

	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		log.Printf("Error finding user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token"})
		return
	}

	token, err := ac.generateJWT(user)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token"})
		return
	}

	ac.setAuthCookie(c, token)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user.ToAuthUser(),
	})
}

func (ac *AuthController) GetCSRFToken(c *gin.Context) {
	if err := middleware.SetCSRFToken(c); err != nil {
		log.Printf("Error setting CSRF token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "CSRF token generated successfully",
	})
}

func (ac *AuthController) generateJWT(user *models.User) (string, error) {
	expirationTime := time.Now().Add(ac.config.JWTExpiryDuration())
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"name": user.Username,
		"role": user.Role,
		"iat":  time.Now().Unix(),
		"exp":  expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(ac.config.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}

	return tokenString, nil
}

func (ac *AuthController) setAuthCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		"auth_token",
		token,
		3600*ac.config.JWTExpiryHours,
		"/",
		ac.config.CookieDomain,
		true,
		true,
	)
}

func validationErrors(err error) interface{} {
	if err == nil {
		return nil
	}
	return err.Error()
}

func calculateDailyCalorieGoal(weight, height float64, gender string, age int, activityLevel, goalType string) int {
	heightInCm := height

	// Basic BMR calculation (Mifflin-St Jeor Equation)
	var bmr float64
	if gender == "male" {
		bmr = 10*weight + 6.25*heightInCm - 5*float64(age) + 5
	} else {
		bmr = 10*weight + 6.25*heightInCm - 5*float64(age) - 161
	}

	// Activity multiplier
	activityMultiplier := 1.2
	switch activityLevel {
	case "light":
		activityMultiplier = 1.375
	case "moderate":
		activityMultiplier = 1.55
	case "active":
		activityMultiplier = 1.725
	case "very_active":
		activityMultiplier = 1.9
	}

	// Calculate TDEE (Total Daily Energy Expenditure)
	tdee := bmr * activityMultiplier

	// Adjust based on goal
	switch goalType {
	case "lose":
		tdee -= 500 // 500 calorie deficit
	case "gain":
		tdee += 500 // 500 calorie surplus
	}

	return int(tdee)
}

func (ac *AuthController) generateAuthTokens(user *models.User) (string, string, error) {
	accessToken, err := ac.generateAccessToken(user)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken, err := ac.generateRefreshToken(user)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (ac *AuthController) generateAccessToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ac.config.JWTSecret))
}

func (ac *AuthController) generateRefreshToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"type": "refresh",
		"exp":  time.Now().Add(time.Hour * 24 * 7).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ac.config.JWTSecret))
}

func (ac *AuthController) setRefreshTokenCookie(c *gin.Context, token string) {
	c.SetCookie(
		"refresh_token",
		token,
		7*24*60*60,
		"/",
		"",
		true, // secure
		true, // httpOnly
	)
}

func (ac *AuthController) GetUserGoals(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDFloat, ok := userIDValue.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	userID := int(userIDFloat)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var goals *models.UserGoals
	var err error

	if ac.userService != nil {
		goals, err = ac.userService.GetUserGoals(c.Request.Context(), userID)
	} else {
		goals, err = ac.userRepo.GetUserGoals(c.Request.Context(), userID)
	}

	if err != nil {
		log.Printf("Error getting user goals: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user goals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"goals": goals})
}

func (ac *AuthController) UpdateUserGoals(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDFloat, ok := userIDValue.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	userID := int(userIDFloat)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var goals models.UserGoals
	if err := c.ShouldBindJSON(&goals); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	goals.UserID = userID

	var err error
	if ac.userService != nil {
		err = ac.userService.UpdateUserGoals(c.Request.Context(), &goals)
	} else {
		err = ac.userRepo.UpdateUserGoals(c.Request.Context(), &goals)
	}

	if err != nil {
		log.Printf("Error updating user goals: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user goals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goals updated successfully", "goals": goals})
}

func (ac *AuthController) RecalculateAllUserGoals(c *gin.Context) {
	userRole, exists := c.Get("userRole")
	if !exists || userRole != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}
	maxUserID := 100
	updatedCount := 0
	failedCount := 0
	for userID := 1; userID <= maxUserID; userID++ {
		user, err := ac.userRepo.FindByID(c.Request.Context(), userID)
		if err != nil {
			if errors.Is(err, repositories.ErrUserNotFound) {
				continue
			}
			log.Printf("Error finding user %d: %v", userID, err)
			failedCount++
			continue
		}

		// Calculate macronutrient targets based on goal type
		var targetProtein, targetCarbs, targetFats float64
		caloriesFromProtein := 4.0 // 4 calories per gram of protein
		caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
		caloriesFromFats := 9.0    // 9 calories per gram of fat

		switch user.GoalType {
		case "lose":
			// For weight loss: protein 35%, fats 35%, carbs 30%
			targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
		case "maintain":
			// For weight maintenance: protein 25%, fats 25%, carbs 50%
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		case "gain":
			// For weight gain: protein 30%, fats 25%, carbs 45%
			targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
		default:
			// Default to maintenance if goal type is invalid
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		}

		// Create or update user goals
		goals := &models.UserGoals{
			UserID:         user.ID,
			TargetCalories: user.DailyCalorieGoal,
			TargetProtein:  targetProtein,
			TargetCarbs:    targetCarbs,
			TargetFats:     targetFats,
			TargetWeight:   user.Weight,
		}

		// Use the repository's UpdateUserGoals method
		err = ac.userRepo.UpdateUserGoals(c.Request.Context(), goals)
		if err != nil {
			log.Printf("Error updating goals for user %d: %v", user.ID, err)
			failedCount++
		} else {
			updatedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User goals recalculated",
		"updated": updatedCount,
		"failed":  failedCount,
	})
}
