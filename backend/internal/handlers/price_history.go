package handlers

import (
	"net/http"
	"time"

	"github.com/evansminotwood/aureus/internal/database"
	"github.com/evansminotwood/aureus/internal/metals"
	"github.com/evansminotwood/aureus/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetCoinPriceHistory returns the price history for a specific coin
func GetCoinPriceHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	coinID := c.Param("id")

	// Verify coin belongs to user
	var coin models.Coin
	if err := database.GetDB().First(&coin, "id = ?", coinID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coin not found"})
		return
	}

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", coin.PortfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Fetch price history
	var history []models.PriceHistory
	if err := database.GetDB().
		Where("coin_id = ?", coinID).
		Order("recorded_at ASC").
		Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch price history"})
		return
	}

	c.JSON(http.StatusOK, history)
}

// RecordPriceSnapshot creates a new price history record for a coin
func RecordPriceSnapshot(c *gin.Context) {
	userID, _ := c.Get("user_id")
	coinID := c.Param("id")

	// Verify coin belongs to user
	var coin models.Coin
	if err := database.GetDB().First(&coin, "id = ?", coinID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Coin not found"})
		return
	}

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", coin.PortfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	coinUUID, err := uuid.Parse(coinID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid coin ID"})
		return
	}

	// Calculate current melt value
	var meltValue float64
	if coin.MetalType != "" && coin.MetalWeight > 0 && coin.MetalPurity > 0 {
		if mv, err := metals.CalculateMeltValue(coin.MetalType, coin.MetalWeight, coin.MetalPurity); err == nil {
			meltValue = mv
		}
	}

	// Create price history record
	now := time.Now()
	history := models.PriceHistory{
		CoinID:          coinUUID,
		MeltValue:       meltValue,
		NumismaticValue: coin.NumismaticValue,
		PCGSValue:       0, // TODO: Fetch from PCGS API if cert number exists
		RecordedAt:      now,
	}

	if err := database.GetDB().Create(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record price snapshot"})
		return
	}

	c.JSON(http.StatusCreated, history)
}

// BackfillPriceHistory creates initial price history records for all user's coins
func BackfillPriceHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")
	db := database.GetDB()

	// Get all coins for this user
	var coins []models.Coin
	if err := db.Table("coins").
		Joins("JOIN portfolios ON coins.portfolio_id = portfolios.id").
		Where("portfolios.user_id = ?", userID).
		Find(&coins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coins"})
		return
	}

	created := 0
	now := time.Now()

	for _, coin := range coins {
		// Check if history already exists
		var count int64
		if err := db.Model(&models.PriceHistory{}).Where("coin_id = ?", coin.ID).Count(&count).Error; err != nil {
			continue
		}

		// Skip if history already exists
		if count > 0 {
			continue
		}

		// Calculate melt value
		var meltValue float64
		if coin.MetalType != "" && coin.MetalWeight > 0 && coin.MetalPurity > 0 {
			if mv, err := metals.CalculateMeltValue(coin.MetalType, coin.MetalWeight, coin.MetalPurity); err == nil {
				meltValue = mv
			}
		}

		// Create initial history record
		history := models.PriceHistory{
			CoinID:          coin.ID,
			MeltValue:       meltValue,
			NumismaticValue: coin.NumismaticValue,
			PCGSValue:       0,
			RecordedAt:      now,
		}

		if err := db.Create(&history).Error; err == nil {
			created++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Price history backfill complete",
		"total_coins": len(coins),
		"created":     created,
	})
}
