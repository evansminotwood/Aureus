package metals

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type SpotPrices struct {
	Gold      float64   `json:"gold"`
	Silver    float64   `json:"silver"`
	Platinum  float64   `json:"platinum"`
	Palladium float64   `json:"palladium"`
	Copper    float64   `json:"copper"`    // USD per pound
	Nickel    float64   `json:"nickel"`    // USD per pound
	UpdatedAt time.Time `json:"updated_at"`
}

type MetalsAPIResponse struct {
	Success   bool               `json:"success"`
	Timestamp int64              `json:"timestamp"`
	Base      string             `json:"base"`
	Date      string             `json:"date"`
	Rates     map[string]float64 `json:"rates"`
}

var cachedPrices *SpotPrices
var lastFetchTime time.Time

const cacheDuration = 15 * time.Minute

func GetSpotPrices() (*SpotPrices, error) {
	if cachedPrices != nil && time.Since(lastFetchTime) < cacheDuration {
		return cachedPrices, nil
	}

	realPrices, err := fetchRealPrices()
	if err == nil && realPrices != nil {
		fmt.Printf("✓ Fetched live spot prices: Gold=$%.2f, Silver=$%.2f\n", realPrices.Gold, realPrices.Silver)
		cachedPrices = realPrices
		lastFetchTime = time.Now()
		return realPrices, nil
	}

	fmt.Printf("⚠ Using fallback prices (live fetch failed: %v)\n", err)
	prices := &SpotPrices{
		Gold:      2650.00, // USD per troy ounce (updated Dec 2025)
		Silver:    30.50,   // USD per troy ounce (updated Dec 2025)
		Platinum:  950.00,
		Palladium: 950.00,
		Copper:    5.52,  // USD per pound (updated Dec 2025)
		Nickel:    6.96,  // USD per pound (updated Dec 2025)
		UpdatedAt: time.Now(),
	}

	cachedPrices = prices
	lastFetchTime = time.Now()

	return prices, nil
}

func fetchRealPrices() (*SpotPrices, error) {
	goldPrice, err := fetchGoldPriceOrg()
	if err == nil {
		return goldPrice, nil
	}

	metalsLive, err := fetchMetalsLive()
	if err == nil {
		return metalsLive, nil
	}

	return nil, fmt.Errorf("all price sources failed")
}

func fetchGoldPriceOrg() (*SpotPrices, error) {
	resp, err := http.Get("https://data-asg.goldprice.org/dbXRates/USD")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Items []struct {
			XAUPrice float64 `json:"xauPrice"`
			XAGPrice float64 `json:"xagPrice"`
		} `json:"items"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("no items in goldprice.org response")
	}

	gold := result.Items[0].XAUPrice
	silver := result.Items[0].XAGPrice

	if gold == 0 || silver == 0 {
		return nil, fmt.Errorf("invalid price data from goldprice.org")
	}

	return &SpotPrices{
		Gold:      gold,
		Silver:    silver,
		Platinum:  950.00, // Fallback for less common metals
		Palladium: 950.00,
		Copper:    5.52,   // Fallback for base metals
		Nickel:    6.96,   // Fallback for base metals
		UpdatedAt: time.Now(),
	}, nil
}

func fetchMetalsLive() (*SpotPrices, error) {
	resp, err := http.Get("https://www.metals.live/v1/spot")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result []struct {
		Metal string  `json:"metal"`
		Price float64 `json:"price"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	prices := &SpotPrices{UpdatedAt: time.Now()}
	for _, item := range result {
		switch item.Metal {
		case "gold":
			prices.Gold = item.Price
		case "silver":
			prices.Silver = item.Price
		case "platinum":
			prices.Platinum = item.Price
		case "palladium":
			prices.Palladium = item.Price
		case "copper":
			prices.Copper = item.Price
		case "nickel":
			prices.Nickel = item.Price
		}
	}

	if prices.Gold == 0 || prices.Silver == 0 {
		return nil, fmt.Errorf("incomplete price data")
	}

	return prices, nil
}

func CalculateMeltValue(metalType string, weight float64, purity float64) (float64, error) {
	prices, err := GetSpotPrices()
	if err != nil {
		return 0, err
	}

	var pricePerOz float64
	switch metalType {
	case "gold":
		pricePerOz = prices.Gold
	case "silver":
		pricePerOz = prices.Silver
	case "platinum":
		pricePerOz = prices.Platinum
	case "palladium":
		pricePerOz = prices.Palladium
	case "copper", "nickel":
		// Base metals are priced per pound, but weight is in troy ounces
		// For base metal coins, we need to return 0 since the weight stored is troy oz of precious metal
		// Base metal calculations need to be handled separately with gram weights
		return 0, nil
	default:
		return 0, fmt.Errorf("unsupported metal type: %s", metalType)
	}

	pureWeight := weight * (purity / 100.0)
	meltValue := pureWeight * pricePerOz

	return meltValue, nil
}

func UpdateSpotPricesManually(gold, silver, platinum, palladium float64) {
	cachedPrices = &SpotPrices{
		Gold:      gold,
		Silver:    silver,
		Platinum:  platinum,
		Palladium: palladium,
		Copper:    5.52,
		Nickel:    6.96,
		UpdatedAt: time.Now(),
	}
	lastFetchTime = time.Now()
}

// CalculateBaseMeltValue calculates melt value for base metal coins using gram weight
// weightGrams: total weight of coin in grams
// copperPercent: percentage of copper (0-100)
// nickelPercent: percentage of nickel (0-100)
func CalculateBaseMeltValue(weightGrams float64, copperPercent float64, nickelPercent float64) (float64, error) {
	prices, err := GetSpotPrices()
	if err != nil {
		return 0, err
	}

	// Convert grams to pounds (1 pound = 453.592 grams)
	weightPounds := weightGrams / 453.592

	// Calculate value from each metal component
	copperValue := weightPounds * (copperPercent / 100.0) * prices.Copper
	nickelValue := weightPounds * (nickelPercent / 100.0) * prices.Nickel

	return copperValue + nickelValue, nil
}

// CalculateMeltValueFromComposition calculates melt value using a MetalComposition
// This handles both precious metals (troy oz) and base metals (grams)
func CalculateMeltValueFromComposition(comp MetalComposition) (float64, error) {
	if comp.IsBaseMetal {
		return CalculateBaseMeltValue(comp.WeightGrams, comp.CopperPercent, comp.NickelPercent)
	}
	return CalculateMeltValue(comp.MetalType, comp.Weight, comp.Purity)
}
