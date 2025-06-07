package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// DietitianAuthMiddleware ensures the user is a dietitian
func DietitianAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("userRole")
		if role != "dietitian" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: Dietitian privileges required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
