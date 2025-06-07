package models

import (
	"time"
)

type FoodEntry struct {
	ID        int       `db:"id" json:"id"`
	UserID    int       `db:"user_id" json:"userId"`
	FoodID    string    `db:"food_id" json:"foodId"`
	Name      string    `db:"food_name" json:"name"`
	Amount    float64   `db:"quantity" json:"amount"`
	Calories  float64   `db:"calories" json:"calories"`
	Protein   float64   `db:"protein" json:"protein"`
	Carbs     float64   `db:"carbs" json:"carbs"`
	Fat       float64   `db:"fats" json:"fat"`
	Date      time.Time `db:"entry_date" json:"date"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

const (
	MealBreakfast = "breakfast"
	MealLunch     = "lunch"
	MealDinner    = "dinner"
	MealSnack     = "snack"
)

type DailyNutrition struct {
	Date          time.Time `json:"date"`
	TotalCalories float64   `json:"total_calories"`
	TotalProtein  float64   `json:"total_protein"`
	TotalCarbs    float64   `json:"total_carbs"`
	TotalFats     float64   `json:"total_fats"`
}

type FoodEntryRequest struct {
	FoodID   string    `json:"foodId" binding:"required"`
	Name     string    `json:"name" binding:"required"`
	Amount   float64   `json:"amount" binding:"required,gt=0"`
	Date     time.Time `json:"date" binding:"required"`
	Calories float64   `json:"calories" binding:"required,gte=0"`
	Protein  float64   `json:"protein" binding:"required,gte=0"`
	Carbs    float64   `json:"carbs" binding:"required,gte=0"`
	Fat      float64   `json:"fat" binding:"required,gte=0"`
}
