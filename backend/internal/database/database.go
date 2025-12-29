package database

import (
	"log"
	"os"

	"github.com/evansminotwood/aureus/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set in environment")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Portfolio{},
		&models.Coin{},
		&models.PriceHistory{},
	)

	if err != nil {
		return err
	}

	log.Println("Database migrations completed")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}
