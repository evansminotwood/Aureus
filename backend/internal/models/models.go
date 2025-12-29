package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Portfolio struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Coins       []Coin    `gorm:"foreignKey:PortfolioID" json:"coins,omitempty"`
}

func (p *Portfolio) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type Coin struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PortfolioID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	CoinType        string     `json:"coin_type"`
	Year            int        `json:"year"`
	MintMark        string     `json:"mint_mark"`
	Denomination    string     `json:"denomination"`
	PCGSCertNumber   string     `json:"pcgs_cert_number"`
	PurchasePrice    float64    `json:"purchase_price"`
	PurchaseDate     *time.Time `json:"purchase_date"`
	CurrentValue     float64    `json:"current_value"`
	NumismaticValue  float64    `json:"numismatic_value"`
	LastPriceUpdate  *time.Time `json:"last_price_update"`
	ImageURL        string     `json:"image_url"`
	ThumbnailURL    string     `json:"thumbnail_url"`
	Notes           string     `json:"notes"`
	Quantity        int        `gorm:"default:1" json:"quantity"`
	MetalType       string     `json:"metal_type"`   // e.g., "silver", "gold", "copper"
	MetalWeight     float64    `json:"metal_weight"` // weight in troy ounces
	MetalPurity     float64    `json:"metal_purity"` // purity percentage (e.g., 90 for 90%)
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (c *Coin) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type PriceHistory struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CoinID           uuid.UUID  `gorm:"type:uuid;not null;index" json:"coin_id"`
	MeltValue        float64    `json:"melt_value"`
	NumismaticValue  float64    `json:"numismatic_value"`
	PCGSValue        float64    `json:"pcgs_value"`
	RecordedAt       time.Time  `gorm:"index" json:"recorded_at"`
	CreatedAt        time.Time  `json:"created_at"`
}

func (p *PriceHistory) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type PortfolioStats struct {
	TotalCoins        int64   `json:"total_coins"`
	TotalValue        float64 `json:"total_value"`
	TotalPurchaseCost float64 `json:"total_purchase_cost"`
	TotalGainLoss     float64 `json:"total_gain_loss"`
	GainLossPercent   float64 `json:"gain_loss_percent"`
}
