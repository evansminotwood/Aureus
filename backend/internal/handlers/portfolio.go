package handlers

import (
	"net/http"

	"github.com/evansminotwood/aureus/internal/database"
	"github.com/evansminotwood/aureus/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreatePortfolioRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdatePortfolioRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func GetPortfolios(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var portfolios []models.Portfolio
	if err := database.GetDB().Where("user_id = ?", userID).Find(&portfolios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch portfolios"})
		return
	}

	type PortfolioWithCount struct {
		models.Portfolio
		CoinCount  int     `json:"coin_count"`
		TotalValue float64 `json:"total_value"`
	}

	result := make([]PortfolioWithCount, len(portfolios))
	for i, p := range portfolios {
		var count int64
		var totalValue float64

		database.GetDB().Model(&models.Coin{}).Where("portfolio_id = ?", p.ID).Count(&count)
		database.GetDB().Model(&models.Coin{}).Where("portfolio_id = ?", p.ID).Select("COALESCE(SUM(current_value * quantity), 0)").Scan(&totalValue)

		result[i] = PortfolioWithCount{
			Portfolio:  p,
			CoinCount:  int(count),
			TotalValue: totalValue,
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetPortfolio(c *gin.Context) {
	userID, _ := c.Get("user_id")
	portfolioID := c.Param("id")

	var portfolio models.Portfolio
	if err := database.GetDB().
		Preload("Coins").
		Where("id = ? AND user_id = ?", portfolioID, userID).
		First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.JSON(http.StatusOK, portfolio)
}

func CreatePortfolio(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	portfolio := models.Portfolio{
		UserID:      userID.(uuid.UUID),
		Name:        req.Name,
		Description: req.Description,
	}

	if err := database.GetDB().Create(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create portfolio"})
		return
	}

	c.JSON(http.StatusCreated, portfolio)
}

func UpdatePortfolio(c *gin.Context) {
	userID, _ := c.Get("user_id")
	portfolioID := c.Param("id")

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", portfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	var req UpdatePortfolioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		portfolio.Name = req.Name
	}
	portfolio.Description = req.Description

	if err := database.GetDB().Save(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update portfolio"})
		return
	}

	c.JSON(http.StatusOK, portfolio)
}

func DeletePortfolio(c *gin.Context) {
	userID, _ := c.Get("user_id")
	portfolioID := c.Param("id")

	result := database.GetDB().Where("id = ? AND user_id = ?", portfolioID, userID).Delete(&models.Portfolio{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete portfolio"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Portfolio deleted successfully"})
}

func GetPortfolioStats(c *gin.Context) {
	userID, _ := c.Get("user_id")
	portfolioID := c.Param("id")

	var portfolio models.Portfolio
	if err := database.GetDB().Where("id = ? AND user_id = ?", portfolioID, userID).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	var stats models.PortfolioStats

	database.GetDB().Model(&models.Coin{}).Where("portfolio_id = ?", portfolioID).Count((*int64)(&stats.TotalCoins))

	database.GetDB().Model(&models.Coin{}).
		Where("portfolio_id = ?", portfolioID).
		Select("COALESCE(SUM(current_value * quantity), 0)").
		Scan(&stats.TotalValue)

	database.GetDB().Model(&models.Coin{}).
		Where("portfolio_id = ?", portfolioID).
		Select("COALESCE(SUM(purchase_price * quantity), 0)").
		Scan(&stats.TotalPurchaseCost)

	stats.TotalGainLoss = stats.TotalValue - stats.TotalPurchaseCost
	if stats.TotalPurchaseCost > 0 {
		stats.GainLossPercent = (stats.TotalGainLoss / stats.TotalPurchaseCost) * 100
	}

	c.JSON(http.StatusOK, stats)
}
