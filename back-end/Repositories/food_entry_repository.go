package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	models "HabitBite/backend/Models"

	"github.com/jmoiron/sqlx"
)

type FoodEntryRepository interface {
	CreateFoodEntry(ctx context.Context, entry *models.FoodEntry) error
	GetDailyEntries(ctx context.Context, userID int, date time.Time) ([]*models.FoodEntry, error)
	DeleteFoodEntry(ctx context.Context, entryID int) error
	GetDailyNutrition(ctx context.Context, userID int, date time.Time) (*models.DailyNutrition, error)
	GetNutritionHistory(ctx context.Context, userID int, startDate, endDate time.Time) ([]*models.DailyNutrition, error)
}

type foodEntryRepository struct {
	db *sqlx.DB
}

func NewFoodEntryRepository(db *sqlx.DB) FoodEntryRepository {
	return &foodEntryRepository{db: db}
}

func (r *foodEntryRepository) CreateFoodEntry(ctx context.Context, entry *models.FoodEntry) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	defer tx.Rollback()

	query := `
		INSERT INTO consumed_foods (
			user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
			entry_date, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := tx.ExecContext(ctx, query,
		entry.UserID,
		entry.FoodID,
		entry.Name,
		entry.Amount,
		entry.Calories,
		entry.Protein,
		entry.Carbs,
		entry.Fat,
		entry.Date,
		now,
		now,
	)
	if err != nil {
		return fmt.Errorf("failed to insert food entry: %v", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert ID: %v", err)
	}
	entry.ID = int(id)

	entryDate := time.Date(entry.Date.Year(), entry.Date.Month(), entry.Date.Day(), 0, 0, 0, 0, time.UTC)

	nutritionQuery := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var totalCalories, totalProtein, totalCarbs, totalFats float64
	err = tx.QueryRowContext(ctx, nutritionQuery, entry.UserID, entryDate).Scan(
		&totalCalories,
		&totalProtein,
		&totalCarbs,
		&totalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to calculate daily totals: %v", err)
	}

	var entryID int
	checkQuery := `
		SELECT id FROM daily_entries
		WHERE user_id = ? AND entry_date = DATE(?)
	`

	err = tx.QueryRowContext(ctx, checkQuery, entry.UserID, entryDate).Scan(&entryID)

	if err == sql.ErrNoRows {
		insertQuery := `
			INSERT INTO daily_entries (
				user_id, entry_date, total_calories, total_protein, total_carbs, total_fats
			) VALUES (?, ?, ?, ?, ?, ?)
		`

		_, err = tx.ExecContext(ctx, insertQuery,
			entry.UserID,
			entryDate,
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFats,
		)
		if err != nil {
			return fmt.Errorf("failed to insert daily entry: %v", err)
		}
	} else if err == nil {
		updateQuery := `
			UPDATE daily_entries SET
				total_calories = ?,
				total_protein = ?,
				total_carbs = ?,
				total_fats = ?
			WHERE id = ?
		`

		_, err = tx.ExecContext(ctx, updateQuery,
			totalCalories,
			totalProtein,
			totalCarbs,
			totalFats,
			entryID,
		)
		if err != nil {
			return fmt.Errorf("failed to update daily entry: %v", err)
		}
	} else {
		return fmt.Errorf("failed to check for existing daily entry: %v", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func (r *foodEntryRepository) GetDailyEntries(ctx context.Context, userID int, date time.Time) ([]*models.FoodEntry, error) {

	query := `
		SELECT id, user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
			   entry_date, created_at, updated_at
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
		ORDER BY entry_date DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, date)
	if err != nil {
		return nil, fmt.Errorf("database query error: %v", err)
	}

	entries, err := scanEntries(rows)
	if err != nil {
		return nil, err
	}

	if len(entries) == 0 {

		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
		endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Second)

		query = `
			SELECT id, user_id, food_id, food_name, quantity, calories, protein, carbs, fats,
				   entry_date, created_at, updated_at
			FROM consumed_foods
			WHERE user_id = ? AND entry_date BETWEEN ? AND ?
			ORDER BY entry_date DESC
		`

		rows, err = r.db.QueryContext(ctx, query, userID, startOfDay, endOfDay)
		if err != nil {
			fmt.Printf("[ERROR GetDailyEntries] Alternative query error: %v\n", err)
			return nil, fmt.Errorf("database alternative query error: %v", err)
		}

		entries, err = scanEntries(rows)
		if err != nil {
			return nil, err
		}
	}
	return entries, nil
}

func scanEntries(rows *sql.Rows) ([]*models.FoodEntry, error) {
	defer rows.Close()

	var entries []*models.FoodEntry
	for rows.Next() {
		entry := &models.FoodEntry{}
		err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.FoodID,
			&entry.Name,
			&entry.Amount,
			&entry.Calories,
			&entry.Protein,
			&entry.Carbs,
			&entry.Fat,
			&entry.Date,
			&entry.CreatedAt,
			&entry.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan food entry: %v", err)
		}
		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %v", err)
	}

	return entries, nil
}

func (r *foodEntryRepository) DeleteFoodEntry(ctx context.Context, entryID int) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	defer tx.Rollback()

	query := `SELECT user_id, entry_date FROM consumed_foods WHERE id = ?`
	var userID int
	var entryDate time.Time

	err = tx.QueryRowContext(ctx, query, entryID).Scan(&userID, &entryDate)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("food entry not found")
		}
		return fmt.Errorf("failed to fetch food entry: %v", err)
	}

	deleteQuery := `DELETE FROM consumed_foods WHERE id = ?`
	_, err = tx.ExecContext(ctx, deleteQuery, entryID)
	if err != nil {
		return fmt.Errorf("failed to delete food entry: %v", err)
	}

	dateOnly := time.Date(entryDate.Year(), entryDate.Month(), entryDate.Day(), 0, 0, 0, 0, time.UTC)

	nutritionQuery := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var totalCalories, totalProtein, totalCarbs, totalFats float64
	err = tx.QueryRowContext(ctx, nutritionQuery, userID, dateOnly).Scan(
		&totalCalories,
		&totalProtein,
		&totalCarbs,
		&totalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to calculate daily totals: %v", err)
	}

	var dailyEntryID int
	checkQuery := `
		SELECT id FROM daily_entries
		WHERE user_id = ? AND entry_date = DATE(?)
	`

	err = tx.QueryRowContext(ctx, checkQuery, userID, dateOnly).Scan(&dailyEntryID)

	if err == sql.ErrNoRows {
		if totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFats > 0 {
			insertQuery := `
				INSERT INTO daily_entries (
					user_id, entry_date, total_calories, total_protein, total_carbs, total_fats
				) VALUES (?, ?, ?, ?, ?, ?)
			`

			_, err = tx.ExecContext(ctx, insertQuery,
				userID,
				dateOnly,
				totalCalories,
				totalProtein,
				totalCarbs,
				totalFats,
			)
			if err != nil {
				return fmt.Errorf("failed to insert daily entry: %v", err)
			}
		}
	} else if err == nil {
		if totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFats > 0 {
			updateQuery := `
				UPDATE daily_entries SET
					total_calories = ?,
					total_protein = ?,
					total_carbs = ?,
					total_fats = ?
				WHERE id = ?
			`

			_, err = tx.ExecContext(ctx, updateQuery,
				totalCalories,
				totalProtein,
				totalCarbs,
				totalFats,
				dailyEntryID,
			)
			if err != nil {
				return fmt.Errorf("failed to update daily entry: %v", err)
			}
		} else {
			deleteEntryQuery := `DELETE FROM daily_entries WHERE id = ?`
			_, err = tx.ExecContext(ctx, deleteEntryQuery, dailyEntryID)
			if err != nil {
				return fmt.Errorf("failed to delete daily entry: %v", err)
			}
		}
	} else {
		return fmt.Errorf("failed to check for existing daily entry: %v", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func (r *foodEntryRepository) GetDailyNutrition(ctx context.Context, userID int, date time.Time) (*models.DailyNutrition, error) {
	query := `
		SELECT 
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
	`

	var nutrition models.DailyNutrition
	err := r.db.QueryRowContext(ctx, query, userID, date).Scan(
		&nutrition.TotalCalories,
		&nutrition.TotalProtein,
		&nutrition.TotalCarbs,
		&nutrition.TotalFats,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get daily nutrition: %v", err)
	}

	nutrition.Date = date
	return &nutrition, nil
}

func (r *foodEntryRepository) GetNutritionHistory(ctx context.Context, userID int, startDate, endDate time.Time) ([]*models.DailyNutrition, error) {
	datesQuery := `
		WITH RECURSIVE dates(date) AS (
			SELECT DATE(?)
			UNION ALL
			SELECT DATE_ADD(date, INTERVAL 1 DAY)
			FROM dates
			WHERE date < DATE(?)
		)
		SELECT DATE_FORMAT(date, '%Y-%m-%d') as date
		FROM dates
		ORDER BY date ASC
	`
	dateRows, err := r.db.QueryContext(ctx, datesQuery, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query date range: %v", err)
	}
	defer dateRows.Close()

	nutritionByDate := make(map[string]*models.DailyNutrition)

	for dateRows.Next() {
		var dateStr string
		if err := dateRows.Scan(&dateStr); err != nil {
			return nil, fmt.Errorf("failed to scan date: %v", err)
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date %s: %v", dateStr, err)
		}

		nutritionByDate[dateStr] = &models.DailyNutrition{
			Date:          date,
			TotalCalories: 0,
			TotalProtein:  0,
			TotalCarbs:    0,
			TotalFats:     0,
		}
	}

	if len(nutritionByDate) == 0 {
		fmt.Printf("[WARN GetNutritionHistory] Empty nutritionByDate map after date population. Date range: %s to %s\n",
			startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	}
	entriesQuery := `
		SELECT 
			DATE_FORMAT(entry_date, '%Y-%m-%d') as date,
			total_calories,
			total_protein,
			total_carbs,
			total_fats
		FROM daily_entries
		WHERE user_id = ? AND entry_date BETWEEN ? AND ?
		ORDER BY entry_date ASC
	`

	entryRows, err := r.db.QueryContext(ctx, entriesQuery, userID, startDate, endDate)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Daily entries query error: %v\n", err)
		return nil, fmt.Errorf("failed to query daily entries: %v", err)
	}
	defer entryRows.Close()

	for entryRows.Next() {
		var nutrition models.DailyNutrition
		var dateStr string
		err := entryRows.Scan(
			&dateStr,
			&nutrition.TotalCalories,
			&nutrition.TotalProtein,
			&nutrition.TotalCarbs,
			&nutrition.TotalFats,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan daily entry row: %v", err)
		}

		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date %s: %v", dateStr, err)
		}
		nutrition.Date = date

		nutritionByDate[dateStr] = &nutrition
	}

	consumedFoodsRangeQuery := `
		SELECT 
			DATE_FORMAT(DATE(entry_date), '%Y-%m-%d') as date,
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) BETWEEN ? AND ?
		GROUP BY DATE(entry_date)
	`

	consumedRows, err := r.db.QueryContext(ctx, consumedFoodsRangeQuery, userID, startDate, endDate)
	if err != nil {
		fmt.Printf("[ERROR GetNutritionHistory] Consumed foods range query error: %v\n", err)
	} else {
		defer consumedRows.Close()

		for consumedRows.Next() {
			var nutrition models.DailyNutrition
			var dateStr string
			err := consumedRows.Scan(
				&dateStr,
				&nutrition.TotalCalories,
				&nutrition.TotalProtein,
				&nutrition.TotalCarbs,
				&nutrition.TotalFats,
			)
			if err != nil {
				fmt.Printf("[ERROR GetNutritionHistory] Error scanning consumed foods row: %v\n", err)
				continue
			}

			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				fmt.Printf("[ERROR GetNutritionHistory] Failed to parse date %s: %v\n", dateStr, err)
				continue
			}
			nutrition.Date = date

			nutritionByDate[dateStr] = &nutrition
		}
	}

	todayStr := time.Now().Format("2006-01-02")
	consumedFoodsQuery := `
		SELECT 
			DATE_FORMAT(DATE(entry_date), '%Y-%m-%d') as date,
			IFNULL(SUM(calories), 0) as total_calories,
			IFNULL(SUM(protein), 0) as total_protein,
			IFNULL(SUM(carbs), 0) as total_carbs,
			IFNULL(SUM(fats), 0) as total_fats
		FROM consumed_foods
		WHERE user_id = ? AND DATE(entry_date) = DATE(?)
		GROUP BY DATE(entry_date)
	`

	var todayNutrition models.DailyNutrition
	err = r.db.QueryRowContext(ctx, consumedFoodsQuery, userID, todayStr).Scan(
		&todayStr,
		&todayNutrition.TotalCalories,
		&todayNutrition.TotalProtein,
		&todayNutrition.TotalCarbs,
		&todayNutrition.TotalFats,
	)

	if err != nil && err != sql.ErrNoRows {
	} else if err == sql.ErrNoRows {
	} else if err == nil {
		todayDate, _ := time.Parse("2006-01-02", todayStr)
		todayNutrition.Date = todayDate

		if todayDate.Compare(startDate) >= 0 && todayDate.Compare(endDate) <= 0 {
			nutritionByDate[todayStr] = &todayNutrition
		}
	}

	var history []*models.DailyNutrition
	currentDate := startDate
	for !currentDate.After(endDate) {
		dateStr := currentDate.Format("2006-01-02")
		if nutrition, exists := nutritionByDate[dateStr]; exists {
			history = append(history, nutrition)
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return history, nil
}
