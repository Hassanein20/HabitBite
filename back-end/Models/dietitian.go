package models

import (
	"time"
)

type DietitianSubscription struct {
	ID          int       `db:"id" json:"id"`
	UserID      int       `db:"user_id" json:"userId"`
	DietitianID int       `db:"dietitian_id" json:"dietitianId"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
}

type UserProgress struct {
	NutritionHistory struct {
		Dates    []string  `json:"dates"`
		Calories []float64 `json:"calories"`
		Protein  []float64 `json:"protein"`
		Carbs    []float64 `json:"carbs"`
		Fats     []float64 `json:"fats"`
	} `json:"nutritionHistory"`
	UserDetails struct {
		FullName         string  `json:"fullName"`
		Weight           float64 `json:"weight"`
		Height           float64 `json:"height"`
		GoalType         string  `json:"goalType"`
		DailyCalorieGoal int     `json:"dailyCalorieGoal"`
	} `json:"userDetails"`
}
