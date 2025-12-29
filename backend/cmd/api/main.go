package main

import (
	"log"
	"os"
	"time"

	"github.com/evansminotwood/aureus/internal/database"
	"github.com/evansminotwood/aureus/internal/handlers"
	"github.com/evansminotwood/aureus/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Try multiple .env locations
	if err := godotenv.Load("../../../.env"); err != nil {
		if err := godotenv.Load("../../.env"); err != nil {
			if err := godotenv.Load(".env"); err != nil {
				log.Println("No .env file found, using system environment variables")
			} else {
				log.Println("✓ Loaded .env from ./.env")
			}
		} else {
			log.Println("✓ Loaded .env from ../../.env")
		}
	} else {
		log.Println("✓ Loaded .env from ../../../.env")
	}

	// Debug: Check if PCGS_API_KEY is loaded
	pcgsKey := os.Getenv("PCGS_API_KEY")
	if pcgsKey != "" {
		log.Printf("✓ PCGS_API_KEY loaded (length: %d characters)", len(pcgsKey))
	} else {
		log.Println("⚠️  PCGS_API_KEY not found in environment")
	}

	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "aureus-api",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired())
		{
			protected.GET("/auth/me", handlers.GetCurrentUser)

			portfolios := protected.Group("/portfolios")
			{
				portfolios.GET("", handlers.GetPortfolios)
				portfolios.POST("", handlers.CreatePortfolio)
				portfolios.GET("/:id", handlers.GetPortfolio)
				portfolios.PUT("/:id", handlers.UpdatePortfolio)
				portfolios.DELETE("/:id", handlers.DeletePortfolio)
				portfolios.GET("/:id/stats", handlers.GetPortfolioStats)
				portfolios.GET("/:id/coins", handlers.GetPortfolioCoins)
			}

			coins := protected.Group("/coins")
			{
				coins.POST("", handlers.CreateCoin)
				coins.GET("/:id", handlers.GetCoin)
				coins.PUT("/:id", handlers.UpdateCoin)
				coins.DELETE("/:id", handlers.DeleteCoin)
				coins.GET("/:id/price-history", handlers.GetCoinPriceHistory)
				coins.POST("/:id/price-snapshot", handlers.RecordPriceSnapshot)
				coins.POST("/sync-pcgs-values", handlers.SyncPCGSValues)
			}

			pcgs := protected.Group("/pcgs")
			{
				pcgs.GET("/price", handlers.GetPCGSPrice)
			pcgs.GET("/images", handlers.GetPCGSImages)
			}

			metals := protected.Group("/metals")
			{
				metals.GET("/spot-prices", handlers.GetSpotPrices)
				metals.GET("/compositions", handlers.GetMetalCompositions)
				metals.GET("/composition", handlers.GetCoinComposition)
				metals.POST("/melt-value", handlers.CalculateMeltValue)
				metals.POST("/backfill-composition", handlers.BackfillMetalComposition)
			}

			priceHistory := protected.Group("/price-history")
			{
				priceHistory.POST("/backfill", handlers.BackfillPriceHistory)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📊 API documentation: http://localhost:%s/health", port)
	log.Printf("🔐 Auth endpoints: http://localhost:%s/api/auth/...", port)
	log.Printf("💼 Portfolio endpoints: http://localhost:%s/api/portfolios/...", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
