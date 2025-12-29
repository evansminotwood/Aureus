package metals

// YearBasedComposition defines composition rules that vary by year
type YearBasedComposition struct {
	CoinType     string
	YearRanges   []YearRange
	DefaultComp  MetalComposition // Used if year doesn't match any range
}

type YearRange struct {
	StartYear   int
	EndYear     int
	Composition MetalComposition
}

// Year-based composition rules for coins that changed over time
var YearBasedCompositions = []YearBasedComposition{
	// Kennedy Half Dollar - composition changed multiple times
	{
		CoinType: "Kennedy Half Dollar",
		YearRanges: []YearRange{
			{
				StartYear: 1964,
				EndYear:   1964,
				Composition: MetalComposition{
					Name:        "Kennedy Half Dollar (1964)",
					MetalType:   "silver",
					Weight:      0.36169,
					Purity:      90,
					Description: "1964 only: Contains 0.36169 oz of silver (90% silver)",
				},
			},
			{
				StartYear: 1965,
				EndYear:   1970,
				Composition: MetalComposition{
					Name:        "Kennedy Half Dollar (1965-1970)",
					MetalType:   "silver",
					Weight:      0.14792,
					Purity:      40,
					Description: "1965-1970: Contains 0.14792 oz of silver (40% silver)",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:        "Kennedy Half Dollar (1971+)",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "1971+: Copper-nickel clad, no precious metal content",
		},
	},

	// Washington Quarter - silver before 1965
	{
		CoinType: "Washington Quarter",
		YearRanges: []YearRange{
			{
				StartYear: 1932,
				EndYear:   1964,
				Composition: MetalComposition{
					Name:        "Washington Quarter (1932-1964)",
					MetalType:   "silver",
					Weight:      0.18084,
					Purity:      90,
					Description: "1932-1964: Contains 0.18084 oz of silver (90% silver)",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:        "Washington Quarter (1965+)",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "1965+: Copper-nickel clad, no precious metal content",
		},
	},

	// Roosevelt Dime - silver before 1965
	{
		CoinType: "Roosevelt Dime",
		YearRanges: []YearRange{
			{
				StartYear: 1946,
				EndYear:   1964,
				Composition: MetalComposition{
					Name:        "Roosevelt Dime (1946-1964)",
					MetalType:   "silver",
					Weight:      0.07234,
					Purity:      90,
					Description: "1946-1964: Contains 0.07234 oz of silver (90% silver)",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:        "Roosevelt Dime (1965+)",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "1965+: Copper-nickel clad, no precious metal content",
		},
	},

	// Jefferson Nickel - wartime silver composition
	{
		CoinType: "Jefferson Nickel",
		YearRanges: []YearRange{
			{
				StartYear: 1942,
				EndYear:   1945,
				Composition: MetalComposition{
					Name:        "Jefferson Nickel (1942-1945 Wartime)",
					MetalType:   "silver",
					Weight:      0.05626,
					Purity:      35,
					Description: "1942-1945 wartime with large mintmark: 35% silver, 0.05626 oz (Note: Not all 1942 nickels are silver - only those with large mintmark above Monticello)",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:          "Jefferson Nickel (Regular)",
			MetalType:     "copper",
			Weight:        0.0,
			Purity:        0,
			Description:   "75% copper, 25% nickel. No precious metal content",
			IsBaseMetal:   true,
			WeightGrams:   5.0,
			CopperPercent: 75.0,
			NickelPercent: 25.0,
		},
	},

	// Lincoln Cent - composition changed multiple times
	{
		CoinType: "Lincoln Cent",
		YearRanges: []YearRange{
			{
				StartYear: 1909,
				EndYear:   1942,
				Composition: MetalComposition{
					Name:        "Lincoln Cent (1909-1942)",
					MetalType:   "copper",
					Weight:      0.0,
					Purity:      0,
					Description: "95% copper, 5% tin and zinc. No precious metal content",
				},
			},
			{
				StartYear: 1943,
				EndYear:   1943,
				Composition: MetalComposition{
					Name:        "Lincoln Cent (1943 Steel)",
					MetalType:   "copper",
					Weight:      0.0,
					Purity:      0,
					Description: "1943: Zinc-coated steel. No precious metal content",
				},
			},
			{
				StartYear: 1944,
				EndYear:   1946,
				Composition: MetalComposition{
					Name:        "Lincoln Cent (1944-1946 Shell Casing)",
					MetalType:   "copper",
					Weight:      0.0,
					Purity:      0,
					Description: "95% copper, 5% zinc (recycled shell casings). No precious metal content",
				},
			},
			{
				StartYear: 1947,
				EndYear:   1982,
				Composition: MetalComposition{
					Name:        "Lincoln Cent (1947-1982)",
					MetalType:   "copper",
					Weight:      0.0,
					Purity:      0,
					Description: "95% copper, 5% zinc. No precious metal content",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:        "Lincoln Cent (1982+)",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "1982+: 97.5% zinc, 2.5% copper plating. No precious metal content",
		},
	},

	// Eisenhower Dollar - some were 40% silver
	{
		CoinType: "Eisenhower Dollar",
		YearRanges: []YearRange{
			{
				StartYear: 1971,
				EndYear:   1976,
				Composition: MetalComposition{
					Name:        "Eisenhower Dollar (1971-1976 Silver)",
					MetalType:   "silver",
					Weight:      0.31625,
					Purity:      40,
					Description: "1971-1976 40% silver version (S mint only): Contains 0.31625 oz of silver",
				},
			},
		},
		DefaultComp: MetalComposition{
			Name:        "Eisenhower Dollar (Copper-Nickel Clad)",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "Copper-nickel clad, no precious metal content (most common)",
		},
	},

	// Susan B. Anthony Dollar - all clad
	{
		CoinType: "Susan B. Anthony Dollar",
		YearRanges: []YearRange{},
		DefaultComp: MetalComposition{
			Name:        "Susan B. Anthony Dollar",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "Copper-nickel clad, no precious metal content",
		},
	},

	// Sacagawea Dollar - all manganese brass
	{
		CoinType: "Sacagawea Dollar",
		YearRanges: []YearRange{},
		DefaultComp: MetalComposition{
			Name:        "Sacagawea Dollar",
			MetalType:   "copper",
			Weight:      0.0,
			Purity:      0,
			Description: "Manganese brass, no precious metal content",
		},
	},
}

// GetCompositionByYear looks up composition based on coin type and year
func GetCompositionByYear(coinType string, year int) (MetalComposition, bool) {
	// First check year-based compositions
	for _, ybc := range YearBasedCompositions {
		if ybc.CoinType == coinType {
			// Check if year falls in any range
			for _, yr := range ybc.YearRanges {
				if year >= yr.StartYear && year <= yr.EndYear {
					return yr.Composition, true
				}
			}
			// Year doesn't match any range, use default
			return ybc.DefaultComp, true
		}
	}

	// Fall back to static compositions (coins that don't vary by year)
	return GetComposition(coinType)
}
