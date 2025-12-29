package handlers

import (
	"net/http"

	"github.com/evansminotwood/aureus/internal/database"
	"github.com/evansminotwood/aureus/internal/metals"
	"github.com/evansminotwood/aureus/internal/models"
	"github.com/gin-gonic/gin"
)

func GetSpotPrices(c *gin.Context) {
	prices, err := metals.GetSpotPrices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch spot prices",
		})
		return
	}

	c.JSON(http.StatusOK, prices)
}

func GetMetalCompositions(c *gin.Context) {
	compositions := metals.GetAllCompositions()
	c.JSON(http.StatusOK, compositions)
}

func GetCoinComposition(c *gin.Context) {
	coinType := c.Query("coin_type")
	if coinType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "coin_type query parameter is required",
		})
		return
	}

	composition, exists := metals.GetComposition(coinType)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Composition not found for this coin type",
		})
		return
	}

	c.JSON(http.StatusOK, composition)
}

func CalculateMeltValue(c *gin.Context) {
	var req struct {
		MetalType string  `json:"metal_type" binding:"required"`
		Weight    float64 `json:"weight" binding:"required"`
		Purity    float64 `json:"purity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	meltValue, err := metals.CalculateMeltValue(req.MetalType, req.Weight, req.Purity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"melt_value": meltValue,
		"metal_type": req.MetalType,
		"weight":     req.Weight,
		"purity":     req.Purity,
	})
}

func BackfillMetalComposition(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Import required packages
	db := database.GetDB()

	// Get all coins for this user
	var coins []models.Coin
	if err := db.Table("coins").
		Joins("JOIN portfolios ON coins.portfolio_id = portfolios.id").
		Where("portfolios.user_id = ?", userID).
		Find(&coins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch coins",
		})
		return
	}

	updated := 0
	for _, coin := range coins {
		// Skip if already has metal composition
		if coin.MetalType != "" && coin.MetalWeight > 0 && coin.MetalPurity > 0 {
			continue
		}

		// Try to get composition (year-based for accuracy)
		var comp metals.MetalComposition
		var exists bool

		if coin.Year > 0 {
			comp, exists = metals.GetCompositionByYear(coin.CoinType, coin.Year)
		} else {
			comp, exists = metals.GetComposition(coin.CoinType)
		}

		if exists {
			coin.MetalType = comp.MetalType
			coin.MetalWeight = comp.Weight
			coin.MetalPurity = comp.Purity

			// Calculate melt value using new function that handles both precious and base metals
			if meltValue, err := metals.CalculateMeltValueFromComposition(comp); err == nil {
				coin.CurrentValue = meltValue
			}

			// Save the updated coin
			if err := db.Save(&coin).Error; err == nil {
				updated++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Metal composition backfill complete",
		"total_coins": len(coins),
		"updated": updated,
	})
}
