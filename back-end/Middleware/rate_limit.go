package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPRateLimiter manages rate limiting by IP address
type IPRateLimiter struct {
	ips    map[string]*rate.Limiter
	mu     sync.RWMutex
	rate   rate.Limit
	burst  int
	ttl    time.Duration
	lastIP map[string]time.Time
}

// NewIPRateLimiter creates a new rate limiter for IP addresses
func NewIPRateLimiter(r rate.Limit, b int, ttl time.Duration) *IPRateLimiter {
	i := &IPRateLimiter{
		ips:    make(map[string]*rate.Limiter),
		rate:   r,
		burst:  b,
		ttl:    ttl,
		lastIP: make(map[string]time.Time),
	}

	go i.cleanupRoutine()

	return i
}

func (i *IPRateLimiter) cleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		i.cleanup()
	}
}

func (i *IPRateLimiter) cleanup() {
	i.mu.Lock()
	defer i.mu.Unlock()

	now := time.Now()
	for ip, lastSeen := range i.lastIP {
		if now.Sub(lastSeen) > i.ttl {
			delete(i.ips, ip)
			delete(i.lastIP, ip)
		}
	}
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter, exists := i.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(i.rate, i.burst)
		i.ips[ip] = limiter
	}

	i.lastIP[ip] = time.Now()
	return limiter
}

func RateLimiter(r rate.Limit, b int) gin.HandlerFunc {
	limiter := NewIPRateLimiter(r, b, time.Hour)

	return func(c *gin.Context) {
		ip := getClientIP(c)
		if !limiter.GetLimiter(ip).Allow() {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests,
				gin.H{"error": "Rate limit exceeded. Please try again later."})
			return
		}
		c.Next()
	}
}

func getClientIP(c *gin.Context) string {
	if xForwardedFor := c.GetHeader("X-Forwarded-For"); xForwardedFor != "" {
		return xForwardedFor
	}

	if xRealIP := c.GetHeader("X-Real-IP"); xRealIP != "" {
		return xRealIP
	}

	return c.ClientIP()
}
