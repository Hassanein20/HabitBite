package models

import (
	"context"
	"log"
)

type UserService struct {
	userRepo UserRepository
}

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	FindByID(ctx context.Context, id int) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id int) error
	GetUserGoals(ctx context.Context, userID int) (*UserGoals, error)
	UpdateUserGoals(ctx context.Context, goals *UserGoals) error
	SyncUserCalorieGoal(ctx context.Context, userID int, calorieGoal int) error
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{
		userRepo: repo,
	}
}

func (s *UserService) CreateUser(ctx context.Context, user *User) error {
	return s.userRepo.CreateUser(ctx, user)
}

func (s *UserService) UpdateUser(ctx context.Context, user *User) error {
	existingUser, err := s.userRepo.FindByID(ctx, user.ID)
	if err != nil {
		return err
	}

	if existingUser.DailyCalorieGoal != user.DailyCalorieGoal {
		log.Printf("Calorie goal changed from %d to %d for user %d",
			existingUser.DailyCalorieGoal, user.DailyCalorieGoal, user.ID)

		if err := s.userRepo.UpdateUser(ctx, user); err != nil {
			return err
		}

		return s.userRepo.SyncUserCalorieGoal(ctx, user.ID, user.DailyCalorieGoal)
	}

	return s.userRepo.UpdateUser(ctx, user)
}

func (s *UserService) GetUserWithGoals(ctx context.Context, userID int) (*User, *UserGoals, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	goals, err := s.userRepo.GetUserGoals(ctx, userID)
	if err != nil {
		return user, nil, err
	}

	if user.DailyCalorieGoal != goals.TargetCalories {
		log.Printf("Calorie goal mismatch detected: user=%d, goals=%d for user %d",
			user.DailyCalorieGoal, goals.TargetCalories, userID)

		goals.TargetCalories = user.DailyCalorieGoal

		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			log.Printf("Failed to synchronize calorie goals: %v", err)
		}
	}

	return user, goals, nil
}

func (s *UserService) UpdateUserGoals(ctx context.Context, goals *UserGoals) error {
	existingGoals, err := s.userRepo.GetUserGoals(ctx, goals.UserID)
	if err != nil {
		return s.userRepo.UpdateUserGoals(ctx, goals)
	}

	if existingGoals.TargetCalories != goals.TargetCalories {
		log.Printf("Target calories changed from %d to %d for user %d",
			existingGoals.TargetCalories, goals.TargetCalories, goals.UserID)

		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			return err
		}

		return s.userRepo.SyncUserCalorieGoal(ctx, goals.UserID, goals.TargetCalories)
	}

	return s.userRepo.UpdateUserGoals(ctx, goals)
}

func (s *UserService) UpdateCalorieGoal(ctx context.Context, userID int, calorieGoal int) error {
	return s.userRepo.SyncUserCalorieGoal(ctx, userID, calorieGoal)
}

func (s *UserService) GetUserGoals(ctx context.Context, userID int) (*UserGoals, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	goals, err := s.userRepo.GetUserGoals(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user.DailyCalorieGoal != goals.TargetCalories {
		log.Printf("Calorie goal mismatch detected: user=%d, goals=%d for user %d",
			user.DailyCalorieGoal, goals.TargetCalories, userID)

		goals.TargetCalories = user.DailyCalorieGoal

		if err := s.userRepo.UpdateUserGoals(ctx, goals); err != nil {
			log.Printf("Failed to synchronize calorie goals: %v", err)
		}
	}

	return goals, nil
}

func (s *UserService) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return s.userRepo.FindByEmail(ctx, email)
}

func (s *UserService) FindByID(ctx context.Context, id int) (*User, error) {
	return s.userRepo.FindByID(ctx, id)
}
