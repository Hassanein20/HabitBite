package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", buildCSP())
		c.Header("Permissions-Policy", buildPermissionsPolicy())
		c.Header("Server", "")

		c.Next()
	}
}

func buildCSP() string {
	directives := []string{
		"default-src 'self'",
		"script-src 'self'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self'",
		"connect-src 'self'",
		"media-src 'self'",
		"object-src 'none'",
		"frame-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"block-all-mixed-content",
		"upgrade-insecure-requests",
	}

	return join(directives, "; ")
}

func buildPermissionsPolicy() string {
	directives := []string{
		"camera=()",
		"microphone=()",
		"geolocation=()",
		"payment=()",
		"usb=()",
		"fullscreen=(self)",
		"display-capture=()",
		"accelerometer=()",
		"gyroscope=()",
		"magnetometer=()",
		"interest-cohort=()",
	}

	return join(directives, ", ")
}

// join joins strings with a separator
func join(strings []string, separator string) string {
	result := ""
	for i, s := range strings {
		if i > 0 {
			result += separator
		}
		result += s
	}
	return result
}

// CSRFMiddleware handles CSRF token validation
func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}

		if c.Request.URL.Path == "/api/auth/login" || c.Request.URL.Path == "/api/auth/register" {
			c.Next()
			return
		}

		if c.Request.Method == "GET" || c.Request.Method == "HEAD" {
			c.Next()
			return
		}
		if err := SetCSRFToken(c); err != nil {
			log.Printf("Error setting CSRF token: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to set CSRF token"})
			return
		}

		c.Next()
	}
}
