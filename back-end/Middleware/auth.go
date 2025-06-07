package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	config "HabitBite/backend/Config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates JWT tokens in requests
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := extractToken(c)
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		// fmt.Println("JWTsecret ", cfg.JWTSecret)
		token, err := validateToken(tokenString, cfg.JWTSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			c.Set("userID", claims["sub"])
			c.Set("userRole", claims["role"])
			// fmt.Println("claims: ", claims)

			if _, err := c.Cookie("csrf_token"); err != nil {
				if err := SetCSRFToken(c); err != nil {
					c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
					return
				}
			}

			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		}
	}
}

// RoleMiddleware checks if user has required role
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Invalid role format"})
			return
		}

		for _, role := range allowedRoles {
			if role == roleStr {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden,
			gin.H{"error": "Insufficient permissions for this resource"})
	}
}

// extractToken extracts the JWT token from the request
func extractToken(c *gin.Context) string {
	// First check cookie
	token, err := c.Cookie("auth_token")
	if err == nil && token != "" {
		return token
	}

	// Then check Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	return ""
}

// validateToken validates the JWT token
func validateToken(tokenString, secret string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// SetCSRFToken sets a new CSRF token in the response cookie
func SetCSRFToken(c *gin.Context) error {
	token := GenerateCSRFToken()

	c.SetCookie(
		"csrf_token",
		token,
		3600,
		"/",
		"",
		true,
		false,
	)

	c.Header("X-CSRF-Token", token)
	return nil
}

func GenerateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}
