package metals

import "regexp"

type MetalComposition struct {
	Name           string  // Coin type name
	MetalType      string  // Primary metal: "silver", "gold", "copper", etc.
	Weight         float64 // Weight in troy ounces (for precious metals)
	Purity         float64 // Purity percentage (e.g., 90 for 90% silver)
	Description    string  // Human-readable description

	// For base metal coins (copper/nickel alloys)
	IsBaseMetal    bool    // True if this is a base metal coin (copper/nickel)
	WeightGrams    float64 // Total weight in grams (for base metals)
	CopperPercent  float64 // Percentage of copper (0-100)
	NickelPercent  float64 // Percentage of nickel (0-100)
}

// Common coin compositions database
var CommonCompositions = map[string]MetalComposition{
	// Silver Dollars
	"Morgan Dollar": {
		Name:        "Morgan Dollar",
		MetalType:   "silver",
		Weight:      0.77344, // troy ounces of pure silver
		Purity:      90,      // 90% silver
		Description: "Contains 0.77344 oz of silver (90% silver, 10% copper)",
	},
	"Peace Dollar": {
		Name:        "Peace Dollar",
		MetalType:   "silver",
		Weight:      0.77344,
		Purity:      90,
		Description: "Contains 0.77344 oz of silver (90% silver, 10% copper)",
	},
	"Eisenhower Dollar": {
		Name:        "Eisenhower Dollar",
		MetalType:   "copper",
		Weight:      0.0, // Base metal, negligible precious metal value
		Purity:      0,
		Description: "Copper-nickel clad, no precious metal content",
	},

	// Silver Half Dollars
	"Walking Liberty Half Dollar": {
		Name:        "Walking Liberty Half Dollar",
		MetalType:   "silver",
		Weight:      0.36169,
		Purity:      90,
		Description: "Contains 0.36169 oz of silver (90% silver, 10% copper)",
	},
	"Franklin Half Dollar": {
		Name:        "Franklin Half Dollar",
		MetalType:   "silver",
		Weight:      0.36169,
		Purity:      90,
		Description: "Contains 0.36169 oz of silver (90% silver, 10% copper)",
	},
	"Kennedy Half Dollar": {
		Name:        "Kennedy Half Dollar (1964)",
		MetalType:   "silver",
		Weight:      0.36169,
		Purity:      90,
		Description: "1964 only: 90% silver. 1965-1970: 40% silver. 1971+: no silver",
	},

	// Silver Quarters
	"Washington Quarter": {
		Name:        "Washington Quarter (Pre-1965)",
		MetalType:   "silver",
		Weight:      0.18084,
		Purity:      90,
		Description: "Pre-1965 only: Contains 0.18084 oz of silver (90% silver)",
	},
	"Standing Liberty Quarter": {
		Name:        "Standing Liberty Quarter",
		MetalType:   "silver",
		Weight:      0.18084,
		Purity:      90,
		Description: "Contains 0.18084 oz of silver (90% silver, 10% copper)",
	},

	// Silver Dimes
	"Mercury Dime": {
		Name:        "Mercury Dime",
		MetalType:   "silver",
		Weight:      0.07234,
		Purity:      90,
		Description: "Contains 0.07234 oz of silver (90% silver, 10% copper)",
	},
	"Roosevelt Dime": {
		Name:        "Roosevelt Dime (Pre-1965)",
		MetalType:   "silver",
		Weight:      0.07234,
		Purity:      90,
		Description: "Pre-1965 only: Contains 0.07234 oz of silver (90% silver)",
	},
	"Barber Dime": {
		Name:        "Barber Dime",
		MetalType:   "silver",
		Weight:      0.07234,
		Purity:      90,
		Description: "Contains 0.07234 oz of silver (90% silver, 10% copper)",
	},

	// Gold Coins
	"American Gold Eagle (1 oz)": {
		Name:        "American Gold Eagle (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      91.67, // 22 karat
		Description: "Contains 1 troy oz of pure gold (22 karat, 91.67% gold)",
	},
	"American Gold Eagle (1/2 oz)": {
		Name:        "American Gold Eagle (1/2 oz)",
		MetalType:   "gold",
		Weight:      0.5,
		Purity:      91.67,
		Description: "Contains 0.5 troy oz of pure gold (22 karat)",
	},
	"American Gold Eagle (1/4 oz)": {
		Name:        "American Gold Eagle (1/4 oz)",
		MetalType:   "gold",
		Weight:      0.25,
		Purity:      91.67,
		Description: "Contains 0.25 troy oz of pure gold (22 karat)",
	},
	"American Gold Eagle (1/10 oz)": {
		Name:        "American Gold Eagle (1/10 oz)",
		MetalType:   "gold",
		Weight:      0.1,
		Purity:      91.67,
		Description: "Contains 0.1 troy oz of pure gold (22 karat)",
	},
	"$20 Liberty": {
		Name:        "$20 Liberty Gold Coin",
		MetalType:   "gold",
		Weight:      0.96750,
		Purity:      90,
		Description: "Contains 0.96750 oz of pure gold (90% gold)",
	},
	"$20 Saint Gaudens": {
		Name:        "$20 Saint Gaudens",
		MetalType:   "gold",
		Weight:      0.96750,
		Purity:      90,
		Description: "Contains 0.96750 oz of pure gold (90% gold)",
	},
	"$10 Liberty": {
		Name:        "$10 Liberty Gold Coin",
		MetalType:   "gold",
		Weight:      0.48375,
		Purity:      90,
		Description: "Contains 0.48375 oz of pure gold (90% gold)",
	},
	"$10 Indian": {
		Name:        "$10 Indian Gold Coin",
		MetalType:   "gold",
		Weight:      0.48375,
		Purity:      90,
		Description: "Contains 0.48375 oz of pure gold (90% gold)",
	},
	"$5 Liberty": {
		Name:        "$5 Liberty Gold Coin",
		MetalType:   "gold",
		Weight:      0.24187,
		Purity:      90,
		Description: "Contains 0.24187 oz of pure gold (90% gold)",
	},
	"$5 Indian": {
		Name:        "$5 Indian Gold Coin",
		MetalType:   "gold",
		Weight:      0.24187,
		Purity:      90,
		Description: "Contains 0.24187 oz of pure gold (90% gold)",
	},
	"$2.50 Liberty": {
		Name:        "$2.50 Liberty Gold Coin",
		MetalType:   "gold",
		Weight:      0.12094,
		Purity:      90,
		Description: "Contains 0.12094 oz of pure gold (90% gold)",
	},
	"$2.50 Indian": {
		Name:        "$2.50 Indian Gold Coin",
		MetalType:   "gold",
		Weight:      0.12094,
		Purity:      90,
		Description: "Contains 0.12094 oz of pure gold (90% gold)",
	},
	"$1 Liberty": {
		Name:        "$1 Liberty Gold Coin",
		MetalType:   "gold",
		Weight:      0.04837,
		Purity:      90,
		Description: "Contains 0.04837 oz of pure gold (90% gold)",
	},

	// Nickels (Base Metal - Copper/Nickel)
	"Buffalo Nickel": {
		Name:          "Buffalo Nickel (1913-1938)",
		MetalType:     "copper",
		Weight:        0.0,
		Purity:        0,
		Description:   "75% copper, 25% nickel. No precious metal content - base metal only",
		IsBaseMetal:   true,
		WeightGrams:   5.0,  // Buffalo Nickel weighs 5 grams
		CopperPercent: 75.0,
		NickelPercent: 25.0,
	},
	"Jefferson Nickel": {
		Name:          "Jefferson Nickel",
		MetalType:     "copper",
		Weight:        0.0,
		Purity:        0,
		Description:   "75% copper, 25% nickel (wartime 1942-1945: 35% silver). No precious metal content in regular strikes",
		IsBaseMetal:   true,
		WeightGrams:   5.0,
		CopperPercent: 75.0,
		NickelPercent: 25.0,
	},
	"Jefferson Nickel (Wartime Silver)": {
		Name:        "Jefferson Nickel (1942-1945 Silver)",
		MetalType:   "silver",
		Weight:      0.05626,
		Purity:      35,
		Description: "Wartime 1942-1945 with large mintmark above Monticello: 35% silver, 0.05626 oz",
	},
	"Liberty Nickel": {
		Name:          "Liberty Head Nickel (1883-1913)",
		MetalType:     "copper",
		Weight:        0.0,
		Purity:        0,
		Description:   "75% copper, 25% nickel. No precious metal content",
		IsBaseMetal:   true,
		WeightGrams:   5.0,
		CopperPercent: 75.0,
		NickelPercent: 25.0,
	},
	"Shield Nickel": {
		Name:          "Shield Nickel (1866-1883)",
		MetalType:     "copper",
		Weight:        0.0,
		Purity:        0,
		Description:   "75% copper, 25% nickel. No precious metal content",
		IsBaseMetal:   true,
		WeightGrams:   5.0,
		CopperPercent: 75.0,
		NickelPercent: 25.0,
	},

	// Pennies (Copper/Zinc)
	"Indian Head Cent": {
		Name:        "Indian Head Cent",
		MetalType:   "copper",
		Weight:      0.0,
		Purity:      0,
		Description: "95% copper, 5% tin and zinc. No precious metal content",
	},
	"Lincoln Cent": {
		Name:        "Lincoln Cent (Pre-1982)",
		MetalType:   "copper",
		Weight:      0.0,
		Purity:      0,
		Description: "95% copper, 5% zinc. No precious metal content",
	},
	"Wheat Penny": {
		Name:        "Wheat Penny (1909-1958)",
		MetalType:   "copper",
		Weight:      0.0,
		Purity:      0,
		Description: "95% copper, 5% tin and zinc. No precious metal content",
	},
	"Steel Penny": {
		Name:        "Steel Penny (1943)",
		MetalType:   "copper",
		Weight:      0.0,
		Purity:      0,
		Description: "Zinc-coated steel. No precious metal content",
	},

	// Silver Three Cents
	"Three Cent Silver": {
		Name:        "Three Cent Silver (Trime)",
		MetalType:   "silver",
		Weight:      0.02419,
		Purity:      75,
		Description: "Contains 0.02419 oz of silver (75% silver, 25% copper)",
	},

	// Half Dimes
	"Seated Liberty Half Dime": {
		Name:        "Seated Liberty Half Dime",
		MetalType:   "silver",
		Weight:      0.03617,
		Purity:      90,
		Description: "Contains 0.03617 oz of silver (90% silver, 10% copper)",
	},
	"Bust Half Dime": {
		Name:        "Bust Half Dime",
		MetalType:   "silver",
		Weight:      0.03617,
		Purity:      89.24,
		Description: "Contains 0.03617 oz of silver (89.24% silver)",
	},

	// Additional Quarters
	"Barber Quarter": {
		Name:        "Barber Quarter",
		MetalType:   "silver",
		Weight:      0.18084,
		Purity:      90,
		Description: "Contains 0.18084 oz of silver (90% silver, 10% copper)",
	},
	"Seated Liberty Quarter": {
		Name:        "Seated Liberty Quarter",
		MetalType:   "silver",
		Weight:      0.18084,
		Purity:      90,
		Description: "Contains 0.18084 oz of silver (90% silver, 10% copper)",
	},
	"Draped Bust Quarter": {
		Name:        "Draped Bust Quarter",
		MetalType:   "silver",
		Weight:      0.19285,
		Purity:      89.24,
		Description: "Contains 0.19285 oz of silver (89.24% silver)",
	},
	"Capped Bust Quarter": {
		Name:        "Capped Bust Quarter",
		MetalType:   "silver",
		Weight:      0.19285,
		Purity:      89.24,
		Description: "Contains 0.19285 oz of silver (89.24% silver)",
	},

	// Additional Half Dollars
	"Barber Half Dollar": {
		Name:        "Barber Half Dollar",
		MetalType:   "silver",
		Weight:      0.36169,
		Purity:      90,
		Description: "Contains 0.36169 oz of silver (90% silver, 10% copper)",
	},
	"Seated Liberty Half Dollar": {
		Name:        "Seated Liberty Half Dollar",
		MetalType:   "silver",
		Weight:      0.36169,
		Purity:      90,
		Description: "Contains 0.36169 oz of silver (90% silver, 10% copper)",
	},
	"Capped Bust Half Dollar": {
		Name:        "Capped Bust Half Dollar",
		MetalType:   "silver",
		Weight:      0.38570,
		Purity:      89.24,
		Description: "Contains 0.38570 oz of silver (89.24% silver)",
	},
	"Draped Bust Half Dollar": {
		Name:        "Draped Bust Half Dollar",
		MetalType:   "silver",
		Weight:      0.38570,
		Purity:      89.24,
		Description: "Contains 0.38570 oz of silver (89.24% silver)",
	},

	// Silver Dollars
	"Seated Liberty Dollar": {
		Name:        "Seated Liberty Dollar",
		MetalType:   "silver",
		Weight:      0.77344,
		Purity:      90,
		Description: "Contains 0.77344 oz of silver (90% silver, 10% copper)",
	},
	"Trade Dollar": {
		Name:        "Trade Dollar",
		MetalType:   "silver",
		Weight:      0.78287,
		Purity:      90,
		Description: "Contains 0.78287 oz of silver (90% silver, 10% copper)",
	},
	"Bust Dollar": {
		Name:        "Bust Dollar",
		MetalType:   "silver",
		Weight:      0.77344,
		Purity:      89.24,
		Description: "Contains 0.77344 oz of silver (89.24% silver)",
	},
	"American Silver Eagle": {
		Name:        "American Silver Eagle (1 oz)",
		MetalType:   "silver",
		Weight:      1.0,
		Purity:      99.9,
		Description: "Contains 1 troy oz of pure silver (99.9% silver)",
	},

	// Modern Bullion
	"Canadian Maple Leaf (Gold)": {
		Name:        "Canadian Gold Maple Leaf (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      99.99,
		Description: "Contains 1 troy oz of pure gold (99.99% gold)",
	},
	"Canadian Maple Leaf (Silver)": {
		Name:        "Canadian Silver Maple Leaf (1 oz)",
		MetalType:   "silver",
		Weight:      1.0,
		Purity:      99.99,
		Description: "Contains 1 troy oz of pure silver (99.99% silver)",
	},
	"American Buffalo (Gold)": {
		Name:        "American Gold Buffalo (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      99.99,
		Description: "Contains 1 troy oz of pure gold (99.99% gold - 24 karat)",
	},
	"Krugerrand": {
		Name:        "South African Krugerrand (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      91.67,
		Description: "Contains 1 troy oz of pure gold (22 karat, 91.67% gold)",
	},
	"Vienna Philharmonic (Gold)": {
		Name:        "Austrian Gold Philharmonic (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      99.99,
		Description: "Contains 1 troy oz of pure gold (99.99% gold)",
	},
	"Britannia (Gold)": {
		Name:        "British Gold Britannia (1 oz)",
		MetalType:   "gold",
		Weight:      1.0,
		Purity:      99.99,
		Description: "Contains 1 troy oz of pure gold (99.99% gold)",
	},
	"Britannia (Silver)": {
		Name:        "British Silver Britannia (1 oz)",
		MetalType:   "silver",
		Weight:      1.0,
		Purity:      99.9,
		Description: "Contains 1 troy oz of pure silver (99.9% silver)",
	},
}

func GetComposition(coinType string) (MetalComposition, bool) {
	// Try exact match first
	comp, exists := CommonCompositions[coinType]
	if exists {
		return comp, true
	}

	// Try to normalize PCGS-style names
	// e.g., "1921-S Peace Dollar MS67" -> "Peace Dollar"
	normalized := normalizeCoinType(coinType)
	if normalized != coinType {
		comp, exists = CommonCompositions[normalized]
		if exists {
			return comp, true
		}
	}

	return MetalComposition{}, false
}

// normalizeCoinType attempts to extract the base coin name from PCGS-style names
func normalizeCoinType(coinType string) string {
	// Remove leading year patterns like "1921 " or "1921-S "
	normalized := regexp.MustCompile(`^\d{4}[-\s]?[A-Z]?\s*`).ReplaceAllString(coinType, "")
	// Remove trailing grade patterns like " MS67" or " PR70DCAM"
	normalized = regexp.MustCompile(`\s+[A-Z]{2}\d+[A-Z]*$`).ReplaceAllString(normalized, "")
	return normalized
}

func GetAllCompositions() map[string]MetalComposition {
	return CommonCompositions
}
