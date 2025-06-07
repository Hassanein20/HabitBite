package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	config "HabitBite/backend/Config"
	middleware "HabitBite/backend/Middleware"
	Routes "HabitBite/backend/Routes"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Set up logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Load configuration
	fmt.Println("JWT_SECRET", os.Getenv("JWT_SECRET"))
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Error loading config:", err)
	}

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Database connection
	db, err := config.NewMySQLDB(cfg)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	// Create Gin router
	router := gin.New()

	// Session store setup
	store := cookie.NewStore([]byte(cfg.JWTSecret))
	store.Options(sessions.Options{
		Path:     "/",
		Domain:   cfg.CookieDomain,
		MaxAge:   86400,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	router.Use(sessions.Sessions("habitbite-session", store))

	// Middleware chain for all routes
	router.Use(
		middleware.CORSMiddleware(cfg.CORSAllowedOrigins),
		middleware.SecurityHeaders(),
	)

	// Set up all routes using the routes.go file
	Routes.SetupRoutes(router, db, cfg)

	api := router.Group("/api")
	public := api.Group("")
	{
		public.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "healthy",
			})
		})

		public.GET("/version", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"version": "1.0.0",
				"env":     cfg.Environment,
			})
		})
	}

	// Create server with timeouts
	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", cfg.ServerPort)

		// HTTPS setup
		certFile := os.Getenv("SSL_CERT_PATH")
		keyFile := os.Getenv("SSL_KEY_PATH")

		var err error
		if certFile != "" && keyFile != "" {
			// Start HTTP server for redirects
			go startRedirectServer()

			// Start HTTPS server
			log.Printf("Starting HTTPS server on port %s", cfg.ServerPort)
			err = srv.ListenAndServeTLS(certFile, keyFile)
		} else {
			log.Printf("Starting HTTP server on port %s", cfg.ServerPort)
			err = srv.ListenAndServe()
		}

		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}

// startRedirectServer starts an HTTP server that redirects all traffic to HTTPS
func startRedirectServer() {
	redirectServer := &http.Server{
		Addr:    ":80",
		Handler: http.HandlerFunc(redirectToHTTPS),
	}

	if err := redirectServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("HTTP redirect server error: %v", err)
	}
}

// redirectToHTTPS redirects HTTP requests to HTTPS
func redirectToHTTPS(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r,
		"https://"+r.Host+r.URL.String(),
		http.StatusMovedPermanently,
	)
}
