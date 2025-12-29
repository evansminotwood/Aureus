package handlers

import (
	"net/http"

	"github.com/evansminotwood/aureus/internal/pcgs"
	"github.com/gin-gonic/gin"
)

func GetPCGSPrice(c *gin.Context) {
	certNumber := c.Query("cert_number")
	if certNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "cert_number query parameter is required",
		})
		return
	}

	client := pcgs.NewPCGSClient()

	priceData, err := client.GetPriceData(certNumber)
	if err != nil {
		// Log the error for debugging
		println("PCGS API Error for cert", certNumber, ":", err.Error())

		// Return 404 instead of 500 since this is likely a "not found" case
		// This allows the frontend to handle it gracefully
		c.JSON(http.StatusNotFound, gin.H{
			"error":        "PCGS data not found for this cert number",
			"message":      "The cert number may be invalid or the coin data is not available in the PCGS database. Please verify the cert number or enter the coin details manually.",
			"details":      err.Error(),
			"cert_number":  certNumber,
			"pcgs_url":     "https://www.pcgs.com/cert/" + certNumber,
		})
		return
	}

	c.JSON(http.StatusOK, priceData)
}

func GetPCGSImages(c *gin.Context) {
	certNumber := c.Query("cert_number")
	if certNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "cert_number query parameter is required",
		})
		return
	}

	client := pcgs.NewPCGSClient()

	imageData, err := client.GetCoinImagesByCertNumber(certNumber)
	if err != nil {
		// Log the error for debugging
		println("PCGS Images API Error for cert", certNumber, ":", err.Error())

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":        "Failed to fetch PCGS images",
			"details":      err.Error(),
			"cert_number":  certNumber,
		})
		return
	}

	c.JSON(http.StatusOK, imageData)
}
