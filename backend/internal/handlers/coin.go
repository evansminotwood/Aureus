package handlers

import (
	"net/http"
	"time"

	"github.com/evansminotwood/aureus/internal/database"
	"github.com/evansminotwood/aureus/internal/metals"
	"github.com/evansminotwood/aureus/internal/models"
	"github.com/evansminotwood/aureus/internal/pcgs"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateCoinRequest struct {
	PortfolioID     string  `json:"portfolio_id" binding:"required"`
	CoinType        string  `json:"coin_type" binding:"required"`
	Year            int     `json:"year"`
	MintMark        string  `json:"mint_mark"`
	Denomination    string  `json:"denomination"`
	PCGSCertNumber  string  `json:"pcgs_cert_number"`
	PurchasePrice   float64 `json:"purchase_price"`
	CurrentValue    float64 `json:"current_value"`
	NumismaticValue float64 `json:"numismatic_value"`
	ImageURL        string  `json:"image_url"`
	ThumbnailURL    string  `json:"thumbnail_url"`
	Notes           string  `json:"notes"`
	Quantity        int     `json:"quantity"`
	MetalType       string  `json:"metal_type"`
	MetalWeight     float64 `json:"metal_weight"`
	MetalPurity     float64 `json:"metal_purity"`
}

type UpdateCoinRequest struct {
	PortfolioID     string  `json:"portfolio_id"`
	CoinType        string  `json:"coin_type"`
	Year            int     `json:"year"`
	MintMark        string  `json:"mint_mark"`
	Denomination    string  `json:"denomination"`
	PCGSCertNumber  string  `json:"pcgs_cert_number"`
	PurchasePrice   float64 `json:"purchase_price"`
	CurrentValue    float64 `json:"current_value"`
	NumismaticValue float64 `json:"numismatic_value"`
	Notes           string  `json:"notes"`
	Quantity        int     `json:"quantity"`
	MetalType       string  `json:"metal_type"`
	MetalWeight     float64 `json:"metal_weight"`
	MetalPurity     float64 `json:"metal_purity"`
}

func CreateCoin(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateCoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", req.PortfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	portfolioUUID, err := uuid.Parse(req.PortfolioID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid portfolio ID"})
		return
	}

	now := time.Now()
	coin := models.Coin{
		PortfolioID:     portfolioUUID,
		CoinType:        req.CoinType,
		Year:            req.Year,
		MintMark:        req.MintMark,
		Denomination:    req.Denomination,
		PCGSCertNumber:  req.PCGSCertNumber,
		PurchasePrice:   req.PurchasePrice,
		PurchaseDate:    &now,
		CurrentValue:    req.CurrentValue,
		NumismaticValue: req.NumismaticValue,
		LastPriceUpdate: &now,
		ImageURL:        req.ImageURL,
		ThumbnailURL:    req.ThumbnailURL,
		Notes:           req.Notes,
		Quantity:        req.Quantity,
		MetalType:       req.MetalType,
		MetalWeight:     req.MetalWeight,
		MetalPurity:     req.MetalPurity,
	}

	// Auto-fetch PCGS images if cert number is provided and no image URL is set
	if req.PCGSCertNumber != "" && req.ImageURL == "" {
		pcgsClient := pcgs.NewPCGSClient()
		imageData, err := pcgsClient.GetCoinImagesByCertNumber(req.PCGSCertNumber)
		if err == nil && imageData.IsValidRequest && len(imageData.Images) > 0 {
			// Set the first image as the main image
			coin.ImageURL = imageData.GetFrontImageURL()
			// Set the second image as thumbnail if available
			if len(imageData.Images) > 1 {
				coin.ThumbnailURL = imageData.GetBackImageURL()
			}
		}
	}

	if coin.Quantity == 0 {
		coin.Quantity = 1
	}

	// Auto-populate metal composition if not provided
	// Use year-based lookup for accurate composition
	if coin.MetalType == "" || coin.MetalWeight == 0 || coin.MetalPurity == 0 {
		var comp metals.MetalComposition
		var exists bool

		// Try year-based composition first (more accurate)
		if coin.Year > 0 {
			comp, exists = metals.GetCompositionByYear(coin.CoinType, coin.Year)
		} else {
			// Fall back to static composition if no year provided
			comp, exists = metals.GetComposition(coin.CoinType)
		}

		if exists {
			coin.MetalType = comp.MetalType
			coin.MetalWeight = comp.Weight
			coin.MetalPurity = comp.Purity

			// Calculate melt value using composition (handles both precious and base metals)
			if meltValue, err := metals.CalculateMeltValueFromComposition(comp); err == nil {
				coin.CurrentValue = meltValue
			}
		}
	}

	// Always calculate melt value if we have metal data but no current value
	// This handles cases where composition lookup failed but we have metal data
	if coin.CurrentValue == 0 && coin.MetalType != "" && coin.MetalWeight > 0 && coin.MetalPurity > 0 {
		if meltValue, err := metals.CalculateMeltValue(coin.MetalType, coin.MetalWeight, coin.MetalPurity); err == nil {
			coin.CurrentValue = meltValue
		}
	}

	if err := database.GetDB().Create(&coin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create coin"})
		return
	}

	c.JSON(http.StatusCreated, coin)
}

func GetCoin(c *gin.Context) {
	userID, _ := c.Get("user_id")
	coinID := c.Param("id")

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

	c.JSON(http.StatusOK, coin)
}

func UpdateCoin(c *gin.Context) {
	userID, _ := c.Get("user_id")
	coinID := c.Param("id")

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

	var req UpdateCoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Handle portfolio move if requested
	if req.PortfolioID != "" && req.PortfolioID != coin.PortfolioID.String() {
		// Validate that the destination portfolio exists and belongs to the user
		var destPortfolio models.Portfolio
		if err := database.GetDB().Where("id = ? AND user_id = ?", req.PortfolioID, userID).First(&destPortfolio).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Destination portfolio not found or access denied"})
			return
		}

		// Parse and update the portfolio ID
		destPortfolioUUID, err := uuid.Parse(req.PortfolioID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid portfolio ID"})
			return
		}
		coin.PortfolioID = destPortfolioUUID
	}

	if req.CoinType != "" {
		coin.CoinType = req.CoinType
	}
	if req.Year != 0 {
		coin.Year = req.Year
	}
	coin.MintMark = req.MintMark
	coin.Denomination = req.Denomination

	// If PCGS cert number is being updated, fetch images
	pcgsCertChanged := req.PCGSCertNumber != "" && req.PCGSCertNumber != coin.PCGSCertNumber
	coin.PCGSCertNumber = req.PCGSCertNumber

	if pcgsCertChanged {
		pcgsClient := pcgs.NewPCGSClient()
		imageData, err := pcgsClient.GetCoinImagesByCertNumber(req.PCGSCertNumber)
		if err == nil && imageData.IsValidRequest && len(imageData.Images) > 0 {
			// Set the first image as the main image
			coin.ImageURL = imageData.GetFrontImageURL()
			// Set the second image as thumbnail if available
			if len(imageData.Images) > 1 {
				coin.ThumbnailURL = imageData.GetBackImageURL()
			}
		}
	}

	if req.PurchasePrice != 0 {
		coin.PurchasePrice = req.PurchasePrice
	}
	if req.CurrentValue != 0 {
		coin.CurrentValue = req.CurrentValue
		now := time.Now()
		coin.LastPriceUpdate = &now
	}
	if req.NumismaticValue != 0 {
		coin.NumismaticValue = req.NumismaticValue
	}
	if req.Quantity != 0 {
		coin.Quantity = req.Quantity
	}
	coin.Notes = req.Notes

	if req.MetalType != "" {
		coin.MetalType = req.MetalType
	}
	if req.MetalWeight != 0 {
		coin.MetalWeight = req.MetalWeight
	}
	if req.MetalPurity != 0 {
		coin.MetalPurity = req.MetalPurity
	}

	// Auto-populate metal composition if not provided and coin type or year changed
	if (req.CoinType != "" || req.Year != 0) && (coin.MetalType == "" || coin.MetalWeight == 0 || coin.MetalPurity == 0) {
		var comp metals.MetalComposition
		var exists bool

		// Try year-based composition first (more accurate)
		if coin.Year > 0 {
			comp, exists = metals.GetCompositionByYear(coin.CoinType, coin.Year)
		} else {
			// Fall back to static composition if no year provided
			comp, exists = metals.GetComposition(coin.CoinType)
		}

		if exists {
			if coin.MetalType == "" {
				coin.MetalType = comp.MetalType
			}
			if coin.MetalWeight == 0 {
				coin.MetalWeight = comp.Weight
			}
			if coin.MetalPurity == 0 {
				coin.MetalPurity = comp.Purity
			}

			// Calculate melt value using composition (handles both precious and base metals)
			if meltValue, err := metals.CalculateMeltValueFromComposition(comp); err == nil {
				coin.CurrentValue = meltValue
				now := time.Now()
				coin.LastPriceUpdate = &now
			}
		}
	}

	// Always recalculate melt value if metal data changed
	// This handles cases where composition lookup failed but we have metal data
	if coin.MetalType != "" && coin.MetalWeight > 0 && coin.MetalPurity > 0 &&
		(req.MetalType != "" || req.MetalWeight != 0 || req.MetalPurity != 0 || coin.CurrentValue == 0) {
		if meltValue, err := metals.CalculateMeltValue(coin.MetalType, coin.MetalWeight, coin.MetalPurity); err == nil {
			coin.CurrentValue = meltValue
			now := time.Now()
			coin.LastPriceUpdate = &now
		}
	}

	if err := database.GetDB().Save(&coin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update coin"})
		return
	}

	c.JSON(http.StatusOK, coin)
}

func DeleteCoin(c *gin.Context) {
	userID, _ := c.Get("user_id")
	coinID := c.Param("id")

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

	if err := database.GetDB().Delete(&coin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete coin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Coin deleted successfully"})
}

func GetPortfolioCoins(c *gin.Context) {
	userID, _ := c.Get("user_id")
	portfolioID := c.Param("id")

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", portfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	var coins []models.Coin
	if err := database.GetDB().Where("portfolio_id = ?", portfolioID).Find(&coins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch coins"})
		return
	}

	c.JSON(http.StatusOK, coins)
}

func SyncPCGSValues(c *gin.Context) {
	userID, _ := c.Get("user_id")

	db := database.GetDB()

	// Get all coins for this user that have PCGS cert numbers
	var coins []models.Coin
	if err := db.Table("coins").
		Joins("JOIN portfolios ON coins.portfolio_id = portfolios.id").
		Where("portfolios.user_id = ? AND coins.pcgs_cert_number != ''", userID).
		Find(&coins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch coins",
		})
		return
	}

	pcgsClient := pcgs.NewPCGSClient()
	updated := 0
	failed := 0
	errors := []string{}

	for _, coin := range coins {
		// Fetch PCGS price data
		priceData, err := pcgsClient.GetPriceData(coin.PCGSCertNumber)
		if err != nil {
			failed++
			errors = append(errors, coin.PCGSCertNumber+": "+err.Error())
			continue
		}

		// Update numismatic value if we got a valid price
		if priceData.Price > 0 {
			coin.NumismaticValue = priceData.Price

			// Save the updated coin
			if err := db.Save(&coin).Error; err != nil {
				failed++
				errors = append(errors, coin.PCGSCertNumber+": failed to save")
			} else {
				updated++
			}
		}
	}

	response := gin.H{
		"message":     "PCGS value sync complete",
		"total_coins": len(coins),
		"updated":     updated,
		"failed":      failed,
	}

	if len(errors) > 0 {
		response["errors"] = errors
	}

	c.JSON(http.StatusOK, response)
}
