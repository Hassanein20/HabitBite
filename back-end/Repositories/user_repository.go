package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"

	models "HabitBite/backend/Models"

	"github.com/jmoiron/sqlx"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrDatabaseOperation = errors.New("database operation failed")
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByUsername(ctx context.Context, username string) (*models.User, error)
	FindByID(ctx context.Context, id int) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	DeleteUser(ctx context.Context, id int) error
	GetAllUsers(ctx context.Context) ([]models.User, error)

	GetUserGoals(ctx context.Context, userID int) (*models.UserGoals, error)
	UpdateUserGoals(ctx context.Context, goals *models.UserGoals) error
	SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error

	GetSubscribedUsers(ctx context.Context, dietitianID int) ([]models.User, error)
	IsUserSubscribedToDietitian(ctx context.Context, userID string, dietitianID int) (bool, error)
	GetUserProgress(ctx context.Context, userID string) (map[string]interface{}, error)
	SubscribeUserToDietitian(ctx context.Context, userID int, dietitianID int) error
	UnsubscribeUserFromDietitian(ctx context.Context, userID int, dietitianID int) error
	GetAvailableDietitians(ctx context.Context) ([]models.User, error)
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	existingUser, err := r.FindByEmail(ctx, user.Email)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return err
	}
	if existingUser != nil {
		return ErrUserAlreadyExists
	}

	existingUser, err = r.FindByUsername(ctx, user.Username)
	if err != nil && !errors.Is(err, ErrUserNotFound) {
		return err
	}
	if existingUser != nil {
		return ErrUserAlreadyExists
	}

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	query := `INSERT INTO users (
        email, username, password_hash, full_name, birthdate, gender, 
        height, weight, goal_type, activity_level, daily_calorie_goal, role, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := tx.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.DailyCalorieGoal, user.Role, user.CreatedAt, user.UpdatedAt)

	if err != nil {
		return wrapDatabaseError(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return wrapDatabaseError(err)
	}

	user.ID = int(id)

	var targetProtein, targetCarbs, targetFats float64
	caloriesFromProtein := 4.0 // 4 calories per gram of protein
	caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
	caloriesFromFats := 9.0    // 9 calories per gram of fat

	switch user.GoalType {
	case "lose":
		// For weight loss: protein 35%, fats 35%, carbs 30%
		targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
	case "maintain":
		// For weight maintenance: protein 25%, fats 25%, carbs 50%
		targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
	case "gain":
		// For weight gain: protein 30%, fats 25%, carbs 45%
		targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
	default:
		// Default to maintenance if goal type is invalid
		targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
	}

	targetWeight := user.Weight

	goalsQuery := `INSERT INTO user_goals (
		user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
	) VALUES (?, ?, ?, ?, ?, ?)`

	_, err = tx.ExecContext(ctx, goalsQuery,
		user.ID, user.DailyCalorieGoal, targetProtein, targetCarbs, targetFats, targetWeight)

	if err != nil {
		return wrapDatabaseError(err)
	}

	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT * FROM users WHERE email = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, email)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `SELECT * FROM users WHERE username = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, username)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

func (r *userRepository) FindByID(ctx context.Context, id int) (*models.User, error) {
	query := `SELECT * FROM users WHERE id = ? LIMIT 1`
	var user models.User
	err := r.db.GetContext(ctx, &user, query, id)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, wrapDatabaseError(err)
	}

	return &user, nil
}

func (r *userRepository) UpdateUser(ctx context.Context, user *models.User) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	user.UpdatedAt = time.Now()

	query := `UPDATE users SET 
		email = ?, username = ?, password_hash = ?, full_name = ?, 
		birthdate = ?, gender = ?, height = ?, weight = ?, 
		goal_type = ?, activity_level = ?, daily_calorie_goal = ?, role = ?, updated_at = ?
		WHERE id = ?`

	result, err := tx.ExecContext(ctx, query,
		user.Email, user.Username, user.PasswordHash, user.FullName,
		user.Birthdate, user.Gender, user.Height, user.Weight,
		user.GoalType, user.ActivityLevel, user.DailyCalorieGoal, user.Role, user.UpdatedAt,
		user.ID)

	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	goalsUpdateQuery := `
		UPDATE user_goals 
		SET target_calories = ? 
		WHERE user_id = ?
	`

	_, err = tx.ExecContext(ctx, goalsUpdateQuery, user.DailyCalorieGoal, user.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			var targetProtein, targetCarbs, targetFats float64
			caloriesFromProtein := 4.0 // 4 calories per gram of protein
			caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
			caloriesFromFats := 9.0    // 9 calories per gram of fat

			switch user.GoalType {
			case "lose":
				// For weight loss: protein 35%, fats 35%, carbs 30%
				targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
			case "maintain":
				// For weight maintenance: protein 25%, fats 25%, carbs 50%
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			case "gain":
				// For weight gain: protein 30%, fats 25%, carbs 45%
				targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
			default:
				// Default to maintenance if goal type is invalid
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			}

			insertQuery := `
				INSERT INTO user_goals (user_id, target_calories, target_protein, target_carbs, target_fats, target_weight)
				VALUES (?, ?, ?, ?, ?, ?)
			`
			_, err = tx.ExecContext(ctx, insertQuery, user.ID, user.DailyCalorieGoal, targetProtein, targetCarbs, targetFats, user.Weight)
			if err != nil {
				return wrapDatabaseError(err)
			}
		} else {
			return wrapDatabaseError(err)
		}
	} else {
		var targetProtein, targetCarbs, targetFats float64
		caloriesFromProtein := 4.0 // 4 calories per gram of protein
		caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
		caloriesFromFats := 9.0    // 9 calories per gram of fat

		switch user.GoalType {
		case "lose":
			// For weight loss: protein 35%, fats 35%, carbs 30%
			targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
		case "maintain":
			// For weight maintenance: protein 25%, fats 25%, carbs 50%
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		case "gain":
			// For weight gain: protein 30%, fats 25%, carbs 45%
			targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
		default:
			// Default to maintenance if goal type is invalid
			targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
			targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
			targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
		}

		// Update macronutrient targets
		macroUpdateQuery := `
			UPDATE user_goals 
			SET target_protein = ?, target_carbs = ?, target_fats = ?
			WHERE user_id = ?
		`
		_, err = tx.ExecContext(ctx, macroUpdateQuery, targetProtein, targetCarbs, targetFats, user.ID)
		if err != nil {
			return wrapDatabaseError(err)
		}
	}

	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

func (r *userRepository) DeleteUser(ctx context.Context, id int) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	goalsQuery := `DELETE FROM user_goals WHERE user_id = ?`
	_, err = tx.ExecContext(ctx, goalsQuery, id)
	if err != nil {
		return wrapDatabaseError(err)
	}

	userQuery := `DELETE FROM users WHERE id = ?`
	result, err := tx.ExecContext(ctx, userQuery, id)
	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

func (r *userRepository) GetUserGoals(ctx context.Context, userID int) (*models.UserGoals, error) {
	query := `SELECT * FROM user_goals WHERE user_id = ?`
	var goals models.UserGoals

	err := r.db.GetContext(ctx, &goals, query, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			user, err := r.FindByID(ctx, userID)
			if err != nil {
				return nil, err
			}

			var targetProtein, targetCarbs, targetFats float64
			caloriesFromProtein := 4.0 // 4 calories per gram of protein
			caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
			caloriesFromFats := 9.0    // 9 calories per gram of fat

			switch user.GoalType {
			case "lose":
				// For weight loss: protein 35%, fats 35%, carbs 30%
				targetProtein = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.35 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromCarbs
			case "maintain":
				// For weight maintenance: protein 25%, fats 25%, carbs 50%
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			case "gain":
				// For weight gain: protein 30%, fats 25%, carbs 45%
				targetProtein = float64(user.DailyCalorieGoal) * 0.30 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.45 / caloriesFromCarbs
			default:
				// Default to maintenance if goal type is invalid
				targetProtein = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromProtein
				targetFats = float64(user.DailyCalorieGoal) * 0.25 / caloriesFromFats
				targetCarbs = float64(user.DailyCalorieGoal) * 0.50 / caloriesFromCarbs
			}

			goals = models.UserGoals{
				UserID:         userID,
				TargetCalories: user.DailyCalorieGoal,
				TargetProtein:  targetProtein,
				TargetCarbs:    targetCarbs,
				TargetFats:     targetFats,
				TargetWeight:   user.Weight,
			}

			err = r.UpdateUserGoals(ctx, &goals)
			if err != nil {
				return nil, err
			}

			return &goals, nil
		}
		return nil, wrapDatabaseError(err)
	}

	return &goals, nil
}

func (r *userRepository) UpdateUserGoals(ctx context.Context, goals *models.UserGoals) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	var goalType string
	userQuery := `SELECT goal_type FROM users WHERE id = ?`
	err = tx.GetContext(ctx, &goalType, userQuery, goals.UserID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	recalculateMacros := goals.TargetProtein == 0 || goals.TargetCarbs == 0 || goals.TargetFats == 0

	if recalculateMacros {
		caloriesFromProtein := 4.0 // 4 calories per gram of protein
		caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
		caloriesFromFats := 9.0    // 9 calories per gram of fat

		switch goalType {
		case "lose":
			// For weight loss: protein 35%, fats 35%, carbs 30%
			goals.TargetProtein = float64(goals.TargetCalories) * 0.35 / caloriesFromProtein
			goals.TargetFats = float64(goals.TargetCalories) * 0.35 / caloriesFromFats
			goals.TargetCarbs = float64(goals.TargetCalories) * 0.30 / caloriesFromCarbs
		case "maintain":
			// For weight maintenance: protein 25%, fats 25%, carbs 50%
			goals.TargetProtein = float64(goals.TargetCalories) * 0.25 / caloriesFromProtein
			goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
			goals.TargetCarbs = float64(goals.TargetCalories) * 0.50 / caloriesFromCarbs
		case "gain":
			// For weight gain: protein 30%, fats 25%, carbs 45%
			goals.TargetProtein = float64(goals.TargetCalories) * 0.30 / caloriesFromProtein
			goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
			goals.TargetCarbs = float64(goals.TargetCalories) * 0.45 / caloriesFromCarbs
		default:
			// Default to maintenance if goal type is invalid
			goals.TargetProtein = float64(goals.TargetCalories) * 0.25 / caloriesFromProtein
			goals.TargetFats = float64(goals.TargetCalories) * 0.25 / caloriesFromFats
			goals.TargetCarbs = float64(goals.TargetCalories) * 0.50 / caloriesFromCarbs
		}
	}

	checkQuery := `SELECT COUNT(*) FROM user_goals WHERE user_id = ?`
	var count int
	err = tx.GetContext(ctx, &count, checkQuery, goals.UserID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	var result sql.Result
	if count == 0 {
		insertQuery := `
			INSERT INTO user_goals (
				user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
			) VALUES (?, ?, ?, ?, ?, ?)
		`
		result, err = tx.ExecContext(ctx, insertQuery,
			goals.UserID, goals.TargetCalories, goals.TargetProtein,
			goals.TargetCarbs, goals.TargetFats, goals.TargetWeight)
	} else {
		updateQuery := `
			UPDATE user_goals SET
				target_calories = ?, target_protein = ?, target_carbs = ?, 
				target_fats = ?, target_weight = ?
			WHERE user_id = ?
		`
		result, err = tx.ExecContext(ctx, updateQuery,
			goals.TargetCalories, goals.TargetProtein, goals.TargetCarbs,
			goals.TargetFats, goals.TargetWeight, goals.UserID)
	}

	if err != nil {
		return wrapDatabaseError(err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	userUpdateQuery := `
		UPDATE users 
		SET daily_calorie_goal = ?, updated_at = ?
		WHERE id = ?
	`

	_, err = tx.ExecContext(ctx, userUpdateQuery, goals.TargetCalories, time.Now(), goals.UserID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	fmt.Printf("Updated user goals for user ID %d: calories=%d, protein=%.2f, carbs=%.2f, fats=%.2f\n",
		goals.UserID, goals.TargetCalories, goals.TargetProtein, goals.TargetCarbs, goals.TargetFats)

	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

func (r *userRepository) SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return wrapDatabaseError(err)
	}
	defer tx.Rollback()

	userUpdateQuery := `
		UPDATE users 
		SET daily_calorie_goal = ?, updated_at = ?
		WHERE id = ?
	`

	userResult, err := tx.ExecContext(ctx, userUpdateQuery, calorieGoal, time.Now(), userID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	userRowsAffected, err := userResult.RowsAffected()
	if err != nil {
		return wrapDatabaseError(err)
	}

	if userRowsAffected == 0 {
		return ErrUserNotFound
	}

	var goalType string
	goalTypeQuery := `SELECT goal_type FROM users WHERE id = ?`
	err = tx.GetContext(ctx, &goalType, goalTypeQuery, userID)
	if err != nil {
		return wrapDatabaseError(err)
	}

	caloriesFromProtein := 4.0 // 4 calories per gram of protein
	caloriesFromCarbs := 4.0   // 4 calories per gram of carbs
	caloriesFromFats := 9.0    // 9 calories per gram of fat

	var targetProtein, targetCarbs, targetFats float64

	switch goalType {
	case "lose":
		// For weight loss: protein 35%, fats 35%, carbs 30%
		targetProtein = float64(calorieGoal) * 0.35 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.35 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.30 / caloriesFromCarbs
	case "maintain":
		// For weight maintenance: protein 25%, fats 25%, carbs 50%
		targetProtein = float64(calorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.50 / caloriesFromCarbs
	case "gain":
		// For weight gain: protein 30%, fats 25%, carbs 45%
		targetProtein = float64(calorieGoal) * 0.30 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.45 / caloriesFromCarbs
	default:
		// Default to maintenance if goal type is invalid
		targetProtein = float64(calorieGoal) * 0.25 / caloriesFromProtein
		targetFats = float64(calorieGoal) * 0.25 / caloriesFromFats
		targetCarbs = float64(calorieGoal) * 0.50 / caloriesFromCarbs
	}

	checkQuery := `SELECT 1 FROM user_goals WHERE user_id = ?`
	var exists bool
	err = tx.GetContext(ctx, &exists, checkQuery, userID)

	if err != nil && errors.Is(err, sql.ErrNoRows) {
		var weight float64
		weightQuery := `SELECT weight FROM users WHERE id = ?`
		err = tx.GetContext(ctx, &weight, weightQuery, userID)
		if err != nil {
			return wrapDatabaseError(err)
		}

		insertQuery := `
			INSERT INTO user_goals (
				user_id, target_calories, target_protein, target_carbs, target_fats, target_weight
			) VALUES (?, ?, ?, ?, ?, ?)
		`
		_, err = tx.ExecContext(ctx, insertQuery, userID, calorieGoal, targetProtein, targetCarbs, targetFats, weight)
	} else {
		updateQuery := `
			UPDATE user_goals 
			SET target_calories = ?, target_protein = ?, target_carbs = ?, target_fats = ?
			WHERE user_id = ?
		`
		_, err = tx.ExecContext(ctx, updateQuery, calorieGoal, targetProtein, targetCarbs, targetFats, userID)
	}

	if err != nil {
		return wrapDatabaseError(err)
	}

	if err = tx.Commit(); err != nil {
		return wrapDatabaseError(err)
	}

	return nil
}

func (r *userRepository) GetAllUsers(ctx context.Context) ([]models.User, error) {
	var users []models.User
	query := `SELECT * FROM users`
	err := r.db.SelectContext(ctx, &users, query)
	if err != nil {
		return nil, wrapDatabaseError(err)
	}
	return users, nil
}

func (r *userRepository) GetSubscribedUsers(ctx context.Context, dietitianID int) ([]models.User, error) {
	query := `
		SELECT u.* 
		FROM users u 
		JOIN user_dietitian ud ON u.id = ud.user_id 
		WHERE ud.dietitian_id = ?
	`
	var users []models.User
	err := r.db.SelectContext(ctx, &users, query, dietitianID)
	if err != nil {
		return nil, errors.Join(ErrDatabaseOperation, err)
	}

	if users == nil {
		users = []models.User{}
	}

	return users, nil
}

func (r *userRepository) IsUserSubscribedToDietitian(ctx context.Context, userID string, dietitianID int) (bool, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return false, err
	}

	query := `
		SELECT EXISTS(
			SELECT 1 
			FROM user_dietitian 
			WHERE user_id = ? AND dietitian_id = ?
		)
	`
	var exists bool
	err = r.db.GetContext(ctx, &exists, query, userIDInt, dietitianID)
	if err != nil {
		return false, ErrDatabaseOperation
	}
	return exists, nil
}

func (r *userRepository) SubscribeUserToDietitian(ctx context.Context, userID int, dietitianID int) error {
	dietitianQuery := `SELECT EXISTS(SELECT 1 FROM users WHERE id = ? AND role = 'dietitian')`
	var dietitianExists bool
	err := r.db.GetContext(ctx, &dietitianExists, dietitianQuery, dietitianID)
	if err != nil {
		fmt.Printf("Error checking if dietitian exists: %v\n", err)
		return errors.Join(ErrDatabaseOperation, err)
	}

	if !dietitianExists {
		return errors.New("dietitian not found")
	}

	query := `
		SELECT EXISTS(
			SELECT 1 
			FROM user_dietitian 
			WHERE user_id = ? AND dietitian_id = ?
		)
	`
	var exists bool
	err = r.db.GetContext(ctx, &exists, query, userID, dietitianID)
	if err != nil {
		fmt.Printf("Error checking if subscription exists: %v\n", err)
		return errors.Join(ErrDatabaseOperation, err)
	}

	if exists {
		return nil
	}

	createTableQuery := `
		CREATE TABLE IF NOT EXISTS user_dietitian (
			user_id INT NOT NULL,
			dietitian_id INT NOT NULL,
			created_at TIMESTAMP NOT NULL,
			PRIMARY KEY (user_id, dietitian_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (dietitian_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`
	_, err = r.db.ExecContext(ctx, createTableQuery)
	if err != nil {
		fmt.Printf("Error creating user_dietitian table: %v\n", err)
		return errors.Join(ErrDatabaseOperation, err)
	}

	columnCheckQuery := `
		SELECT COUNT(*) 
		FROM information_schema.COLUMNS 
		WHERE 
			TABLE_SCHEMA = DATABASE() AND 
			TABLE_NAME = 'user_dietitian' AND 
			COLUMN_NAME = 'created_at'
	`
	var createdAtExists int
	err = r.db.GetContext(ctx, &createdAtExists, columnCheckQuery)
	if err != nil {
		fmt.Printf("Error checking if created_at column exists: %v\n", err)
		return errors.Join(ErrDatabaseOperation, err)
	}

	if createdAtExists == 0 {
		fmt.Println("Adding created_at column to user_dietitian table...")
		alterTableQuery := `ALTER TABLE user_dietitian ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
		_, err = r.db.ExecContext(ctx, alterTableQuery)
		if err != nil {
			fmt.Printf("Error adding created_at column: %v\n", err)
			simpleInsertQuery := `INSERT INTO user_dietitian (user_id, dietitian_id) VALUES (?, ?)`
			_, err = r.db.ExecContext(ctx, simpleInsertQuery, userID, dietitianID)
			if err != nil {
				fmt.Printf("Error inserting subscription without created_at: %v\n", err)
				return errors.Join(ErrDatabaseOperation, err)
			}
			return nil
		}
	}

	if createdAtExists > 0 {
		insertQuery := `INSERT INTO user_dietitian (user_id, dietitian_id, created_at) VALUES (?, ?, ?)`
		_, err = r.db.ExecContext(ctx, insertQuery, userID, dietitianID, time.Now())
	} else {
		insertQuery := `INSERT INTO user_dietitian (user_id, dietitian_id) VALUES (?, ?)`
		_, err = r.db.ExecContext(ctx, insertQuery, userID, dietitianID)
	}

	if err != nil {
		fmt.Printf("Error inserting subscription: %v\n", err)
		return errors.Join(ErrDatabaseOperation, err)
	}

	return nil
}

func (r *userRepository) UnsubscribeUserFromDietitian(ctx context.Context, userID int, dietitianID int) error {
	deleteQuery := `DELETE FROM user_dietitian WHERE user_id = ? AND dietitian_id = ?`
	result, err := r.db.ExecContext(ctx, deleteQuery, userID, dietitianID)
	if err != nil {
		return ErrDatabaseOperation
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ErrDatabaseOperation
	}

	if rowsAffected == 0 {
		return nil
	}

	return nil
}

func (r *userRepository) GetAvailableDietitians(ctx context.Context) ([]models.User, error) {
	query := `SELECT * FROM users WHERE role = 'dietitian'`
	var dietitians []models.User
	err := r.db.SelectContext(ctx, &dietitians, query)
	if err != nil {
		return nil, ErrDatabaseOperation
	}

	if dietitians == nil {
		dietitians = []models.User{}
	}

	return dietitians, nil
}

func (r *userRepository) GetUserProgress(ctx context.Context, userID string) (map[string]interface{}, error) {
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		return nil, err
	}

	nutritionQuery := `
		SELECT 
			DATE(entry_date) as date,
			SUM(calories) as total_calories,
			SUM(protein) as total_protein,
			SUM(carbs) as total_carbs,
			SUM(fats) as total_fats
		FROM consumed_foods
		WHERE user_id = ?
		GROUP BY DATE(entry_date)
		ORDER BY DATE(entry_date) ASC
		LIMIT 30
	`

	type NutritionData struct {
		Date     string  `db:"date"`
		Calories float64 `db:"total_calories"`
		Protein  float64 `db:"total_protein"`
		Carbs    float64 `db:"total_carbs"`
		Fats     float64 `db:"total_fats"`
	}

	var nutritionHistory []NutritionData
	err = r.db.SelectContext(ctx, &nutritionHistory, nutritionQuery, userIDInt)
	if err != nil {
		return nil, errors.Join(ErrDatabaseOperation, err)
	}

	if len(nutritionHistory) == 0 {
		dailyEntriesQuery := `
			SELECT 
				entry_date as date,
				total_calories,
				total_protein,
				total_carbs,
				total_fats
			FROM daily_entries
			WHERE user_id = ?
			ORDER BY entry_date ASC
			LIMIT 30
		`

		type DailyEntryData struct {
			Date     string  `db:"date"`
			Calories int     `db:"total_calories"`
			Protein  float64 `db:"total_protein"`
			Carbs    float64 `db:"total_carbs"`
			Fats     float64 `db:"total_fats"`
		}

		var dailyEntries []DailyEntryData
		err = r.db.SelectContext(ctx, &dailyEntries, dailyEntriesQuery, userIDInt)
		if err != nil {
			return map[string]interface{}{
				"nutritionHistory": map[string]interface{}{
					"dates":    []string{},
					"calories": []float64{},
					"protein":  []float64{},
					"carbs":    []float64{},
					"fats":     []float64{},
				},
			}, nil
		}

		if len(dailyEntries) > 0 {
			nutritionHistory = make([]NutritionData, len(dailyEntries))
			for i, de := range dailyEntries {
				nutritionHistory[i] = NutritionData{
					Date:     de.Date,
					Calories: float64(de.Calories),
					Protein:  de.Protein,
					Carbs:    de.Carbs,
					Fats:     de.Fats,
				}
			}
		}
	}

	if len(nutritionHistory) == 0 {
		return map[string]interface{}{
			"nutritionHistory": map[string]interface{}{
				"dates":    []string{},
				"calories": []float64{},
				"protein":  []float64{},
				"carbs":    []float64{},
				"fats":     []float64{},
			},
		}, nil
	}

	dates := make([]string, len(nutritionHistory))
	calories := make([]float64, len(nutritionHistory))
	protein := make([]float64, len(nutritionHistory))
	carbs := make([]float64, len(nutritionHistory))
	fats := make([]float64, len(nutritionHistory))

	for i, nh := range nutritionHistory {
		dates[i] = nh.Date
		calories[i] = nh.Calories
		protein[i] = nh.Protein
		carbs[i] = nh.Carbs
		fats[i] = nh.Fats
	}

	return map[string]interface{}{
		"nutritionHistory": map[string]interface{}{
			"dates":    dates,
			"calories": calories,
			"protein":  protein,
			"carbs":    carbs,
			"fats":     fats,
		},
	}, nil
}

func wrapDatabaseError(err error) error {
	return errors.Join(ErrDatabaseOperation, err)
}
