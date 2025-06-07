package config

import (
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

// NewMySQLDB creates a new MySQL database connection
func NewMySQLDB(cfg *Config) (*sqlx.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := sqlx.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("could not open database: %v", err)
	}

	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(100)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database connection failed: %v", err)
	}

	return db, nil
}

// CreateSchema creates the database schema if it doesn't exist
func CreateSchema(db *sqlx.DB) error {
	//users table
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		email VARCHAR(255) NOT NULL UNIQUE,
		username VARCHAR(50) NOT NULL UNIQUE,
		password_hash VARCHAR(255) NOT NULL,
		full_name VARCHAR(255) NOT NULL,
		birthdate DATE NOT NULL,
		gender VARCHAR(20) NOT NULL,
		height DECIMAL(5,2) NOT NULL,
		weight DECIMAL(5,2) NOT NULL,
		goal_type VARCHAR(50) NOT NULL,
		activity_level VARCHAR(50) NOT NULL,
		daily_calorie_goal INT NOT NULL DEFAULT 2000,
		role VARCHAR(20) NOT NULL DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX (email),
		INDEX (username)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`)

	if err != nil {
		return fmt.Errorf("error creating users table: %v", err)
	}
	return nil
}
