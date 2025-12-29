package pcgs

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
)

const (
	PCGSAPIBaseURL = "https://api.pcgs.com/publicapi"
)

type PCGSClient struct {
	BaseURL    string
	HTTPClient *http.Client
	APIKey     string
}

// CoinFactsResponse represents the response from PCGS GetCoinFactsByCertNo
type CoinFactsResponse struct {
	PCGSNo          string  `json:"PCGSNo"`
	CertNo          string  `json:"CertNo"`
	Name            string  `json:"Name"`
	Year            int     `json:"Year"`
	Denomination    string  `json:"Denomination"`
	Mintage         string  `json:"Mintage"`
	MintMark        string  `json:"MintMark"`
	MintLocation    string  `json:"MintLocation"`
	MetalContent    string  `json:"MetalContent"`
	Grade           string  `json:"Grade"`
	Designation     string  `json:"Designation"`
	PriceGuideValue float64 `json:"PriceGuideValue"`
	SeriesName      string  `json:"SeriesName"`
	IsValidRequest  bool    `json:"IsValidRequest"`
	ServerMessage   string  `json:"ServerMessage"`
}

// PCGSPriceData represents pricing information for a coin
type PCGSPriceData struct {
	PCGSNumber   string  `json:"pcgs_number"`
	CertNumber   string  `json:"cert_number"`
	Grade        string  `json:"grade"`
	Price        float64 `json:"price"`
	CoinTitle    string  `json:"coin_title"`
	Year         int     `json:"year"`
	MintMark     string  `json:"mint_mark"`
	Denomination string  `json:"denomination"`
	SeriesName   string  `json:"series_name"`
}

// ImageDetail represents individual image information
type ImageDetail struct {
	URL         string `json:"Url"`
	Resolution  string `json:"Resolution"`
	Description string `json:"Description"`
}

// PCGSImageData represents the response from PCGS GetImagesByCertNo
type PCGSImageData struct {
	CertNo           string        `json:"CertNo"`
	Images           []ImageDetail `json:"Images"`
	HasObverseImage  bool          `json:"HasObverseImage"`
	HasReverseImage  bool          `json:"HasReverseImage"`
	HasTrueViewImage bool          `json:"HasTrueViewImage"`
	ImageReady       bool          `json:"ImageReady"`
	IsValidRequest   bool          `json:"IsValidRequest"`
	ServerMessage    string        `json:"ServerMessage"`
}

// GetFrontImageURL returns the first available image URL (for backwards compatibility)
func (p *PCGSImageData) GetFrontImageURL() string {
	if len(p.Images) > 0 {
		return p.Images[0].URL
	}
	return ""
}

// GetBackImageURL returns the second image URL if available (for backwards compatibility)
func (p *PCGSImageData) GetBackImageURL() string {
	if len(p.Images) > 1 {
		return p.Images[1].URL
	}
	return ""
}

// NewPCGSClient creates a new PCGS API client
func NewPCGSClient() *PCGSClient {
	apiKey := os.Getenv("PCGS_API_KEY")
	fmt.Printf("[DEBUG] NewPCGSClient: API key loaded, length=%d\n", len(apiKey))
	return &PCGSClient{
		BaseURL:    PCGSAPIBaseURL,
		HTTPClient: &http.Client{},
		APIKey:     apiKey,
	}
}

// GetCoinDataByCertNumber retrieves coin data using PCGS certification number
func (c *PCGSClient) GetCoinDataByCertNumber(certNumber string) (*CoinFactsResponse, error) {
	// Use the correct endpoint from PCGS Swagger documentation
	endpoint := fmt.Sprintf("%s/coindetail/GetCoinFactsByCertNo/%s", c.BaseURL, certNumber)

	// Create request
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authorization header with Bearer token (required by PCGS API)
	fmt.Printf("[DEBUG] GetCoinDataByCertNumber: API key length=%d\n", len(c.APIKey))
	if c.APIKey != "" {
		req.Header.Add("Authorization", fmt.Sprintf("bearer %s", c.APIKey))
		fmt.Printf("[DEBUG] Authorization header added\n")
	} else {
		fmt.Printf("[DEBUG] API key is empty!\n")
		return nil, fmt.Errorf("PCGS API key not configured - please set PCGS_API_KEY environment variable")
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")

	// Execute request
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var coinData CoinFactsResponse
	if err := json.NewDecoder(resp.Body).Decode(&coinData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &coinData, nil
}

// GetPriceData retrieves pricing data for a coin by PCGS certification number
// Tries API first, falls back to returning error if API fails
func (c *PCGSClient) GetPriceData(certNumber string) (*PCGSPriceData, error) {
	fmt.Printf("[DEBUG] GetPriceData called for cert: %s\n", certNumber)
	// Try the PCGS API first
	coinData, err := c.GetCoinDataByCertNumber(certNumber)
	fmt.Printf("[DEBUG] GetCoinDataByCertNumber returned: err=%v, coinData=%v\n", err, coinData != nil)
	if err == nil && coinData != nil && coinData.IsValidRequest {
		// Successfully got data from API
		return &PCGSPriceData{
			PCGSNumber:   coinData.PCGSNo,
			CertNumber:   coinData.CertNo,
			Grade:        coinData.Grade,
			Price:        coinData.PriceGuideValue,
			CoinTitle:    coinData.Name,
			Year:         coinData.Year,
			MintMark:     coinData.MintMark,
			Denomination: coinData.Denomination,
			SeriesName:   coinData.SeriesName,
		}, nil
	}

	// API failed - return helpful error
	fmt.Printf("PCGS API failed for cert %s: %v\n", certNumber, err)
	return nil, fmt.Errorf("PCGS API not available - please enter the value manually or visit https://www.pcgs.com/cert/%s", certNumber)
}

// GetCoinImagesByCertNumber retrieves coin images using PCGS certification number
func (c *PCGSClient) GetCoinImagesByCertNumber(certNumber string) (*PCGSImageData, error) {
	// Use the PCGS API endpoint for images with query parameter
	endpoint := fmt.Sprintf("%s/coindetail/GetImagesByCertNo?certNo=%s", c.BaseURL, certNumber)
	fmt.Printf("[DEBUG] GetCoinImagesByCertNumber: Calling endpoint: %s\n", endpoint)

	// Create request
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add authorization header with Bearer token
	if c.APIKey != "" {
		req.Header.Add("Authorization", fmt.Sprintf("bearer %s", c.APIKey))
	} else {
		return nil, fmt.Errorf("PCGS API key not configured - please set PCGS_API_KEY environment variable")
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")

	// Execute request
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var imageData PCGSImageData
	if err := json.NewDecoder(resp.Body).Decode(&imageData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !imageData.IsValidRequest {
		return nil, fmt.Errorf("PCGS API returned invalid request: %s", imageData.ServerMessage)
	}

	return &imageData, nil
}

// scrapePCGSWebsite scrapes the PCGS cert verification page for coin data using headless Chrome
func (c *PCGSClient) scrapePCGSWebsite(certNumber string) (*PCGSPriceData, error) {
	fmt.Printf("Scraping PCGS for cert %s using headless browser...\n", certNumber)

	// Create context with timeout
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Set a timeout for the entire operation
	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// PCGS cert URL
	certURL := fmt.Sprintf("https://www.pcgs.com/cert/%s", certNumber)

	var pageHTML string

	// Navigate to the page and wait for content to load
	err := chromedp.Run(ctx,
		chromedp.Navigate(certURL),
		// Wait for the page to load - wait for specific elements that indicate the page is ready
		chromedp.WaitVisible(`body`, chromedp.ByQuery),
		// Give Cloudflare more time to process and complete the challenge
		chromedp.Sleep(8*time.Second),
		chromedp.OuterHTML(`html`, &pageHTML, chromedp.ByQuery),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to scrape PCGS page: %w", err)
	}

	// Parse the HTML to extract coin data
	priceData := &PCGSPriceData{
		PCGSNumber: certNumber,
	}

	// Extract coin title (e.g., "1921 Peace Dollar MS67")
	titleRegex := regexp.MustCompile(`<h1[^>]*>(.*?)</h1>`)
	if matches := titleRegex.FindStringSubmatch(pageHTML); len(matches) > 1 {
		title := strings.TrimSpace(matches[1])
		// Clean up HTML entities and tags
		title = regexp.MustCompile(`<[^>]+>`).ReplaceAllString(title, "")
		priceData.CoinTitle = title

		// Try to extract year from title
		yearRegex := regexp.MustCompile(`\b(1[7-9]\d{2}|20\d{2})\b`)
		if yearMatches := yearRegex.FindStringSubmatch(title); len(yearMatches) > 0 {
			if year, err := strconv.Atoi(yearMatches[0]); err == nil {
				priceData.Year = year
			}
		}
	}

	// Extract grade (e.g., "MS67", "PR70DCAM")
	// Try multiple patterns to find the grade
	gradePatterns := []string{
		`(?i)grade[^:]*:\s*([A-Z]{2,4}\d+(?:[A-Z]+)?)\s*<`,
		`<span[^>]*class="[^"]*grade[^"]*"[^>]*>([A-Z]{2,4}\d+(?:[A-Z]+)?)</span>`,
		`<[^>]+>([A-Z]{2,4}\d+(?:[A-Z]+)?)</[^>]+>`,
	}

	for _, pattern := range gradePatterns {
		gradeRegex := regexp.MustCompile(pattern)
		if matches := gradeRegex.FindStringSubmatch(pageHTML); len(matches) > 1 {
			grade := strings.TrimSpace(matches[1])
			// Validate it looks like a grade (MS65, PR70, etc)
			if regexp.MustCompile(`^[A-Z]{2,4}\d+`).MatchString(grade) {
				priceData.Grade = grade
				break
			}
		}
	}

	// Extract PCGS Price Guide value
	// Try multiple patterns for price
	pricePatterns := []string{
		`(?i)PCGS\s+Price\s+Guide[^$]*\$\s*([\d,]+(?:\.\d{2})?)`,
		`(?i)Value[^$]*\$\s*([\d,]+(?:\.\d{2})?)`,
		`(?i)Price[^$]*\$\s*([\d,]+(?:\.\d{2})?)`,
		`\$\s*([\d,]+(?:\.\d{2})?)`,
	}

	for _, pattern := range pricePatterns {
		priceRegex := regexp.MustCompile(pattern)
		if matches := priceRegex.FindStringSubmatch(pageHTML); len(matches) > 1 {
			priceStr := strings.ReplaceAll(matches[1], ",", "")
			if price, err := strconv.ParseFloat(priceStr, 64); err == nil && price > 0 {
				priceData.Price = price
				break
			}
		}
	}

	// Try to find price in JSON-LD structured data
	if priceData.Price == 0 {
		jsonLDRegex := regexp.MustCompile(`<script type="application/ld\+json">(.*?)</script>`)
		matches := jsonLDRegex.FindAllStringSubmatch(pageHTML, -1)
		for _, match := range matches {
			if len(match) > 1 {
				var data map[string]interface{}
				if err := json.Unmarshal([]byte(match[1]), &data); err == nil {
					// Try different JSON structures
					if offers, ok := data["offers"].(map[string]interface{}); ok {
						if priceVal, ok := offers["price"].(float64); ok {
							priceData.Price = priceVal
							break
						} else if priceStr, ok := offers["price"].(string); ok {
							if price, err := strconv.ParseFloat(priceStr, 64); err == nil {
								priceData.Price = price
								break
							}
						}
					}
				}
			}
		}
	}

	// Log what we found for debugging
	fmt.Printf("PCGS scrape result for %s: Title='%s', Grade='%s', Price=$%.2f\n",
		certNumber, priceData.CoinTitle, priceData.Grade, priceData.Price)

	// Save HTML to file for debugging if extraction failed
	if priceData.CoinTitle == "" || priceData.Grade == "" || priceData.Price == 0 {
		debugFile := fmt.Sprintf("/tmp/pcgs_debug_%s.html", certNumber)
		if err := os.WriteFile(debugFile, []byte(pageHTML), 0644); err == nil {
			fmt.Printf("Saved HTML to %s for debugging\n", debugFile)
		}
	}

	// Validate that we got at least some data
	if priceData.CoinTitle == "" && priceData.Grade == "" {
		return nil, fmt.Errorf("could not extract coin data from PCGS page - cert number may be invalid")
	}

	return priceData, nil
}
