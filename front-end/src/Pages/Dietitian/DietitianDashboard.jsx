import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Table,
  Button,
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Modal,
  Form,
  InputGroup
} from "react-bootstrap";
import { dietitianAPI, foodEntryAPI } from "../../API/api";
import NutritionCard from "../../Components/Graph/NutritionCard";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./DietitianDashboard.css";

const DietitianDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nutritionHistoryData, setNutritionHistoryData] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(Date.now());
  const [unsubscribeLoading, setUnsubscribeLoading] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState("");
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);
  
  const [userGoals, setUserGoals] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatedGoals, setUpdatedGoals] = useState({});
  const [goalUpdateLoading, setGoalUpdateLoading] = useState(false);
  const [goalUpdateSuccess, setGoalUpdateSuccess] = useState(false);
  const [goalUpdateError, setGoalUpdateError] = useState("");
  
  const originalGetNutritionHistory = useRef(foodEntryAPI.getNutritionHistory);
  const originalHandlePreviousWeek = useRef(null);
  const originalHandleNextWeek = useRef(null);
  
  useEffect(() => {
    const originalMethod = originalGetNutritionHistory.current;
    
    if (nutritionHistoryData && nutritionHistoryData.length > 0) {
      foodEntryAPI.getNutritionHistory = async (startDate, endDate) => {
                if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          return nutritionHistoryData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
          });
        }
        
        return nutritionHistoryData;
      };
    }
    
    return () => {
      foodEntryAPI.getNutritionHistory = originalMethod;
    };
  }, [nutritionHistoryData, weekOffset]);
  useEffect(() => {
    fetchSubscribedUsers();
  }, []);

  const fetchSubscribedUsers = async () => {
    try {
      const data = await dietitianAPI.getSubscribedUsers();
      setSubscribedUsers(data);
      setLoading(false);
    } catch (err) {
      setError(
        "Failed to fetch subscribed users: " + (err.message || "Unknown error")
      );
      setLoading(false);
    }
  };
  
  const handleUnsubscribe = async (userId) => {
    try {
      setUnsubscribeLoading(true);
      setUnsubscribeError("");
      setUnsubscribeSuccess(false);
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
        setUserProgress(null);
        setUserGoals(null);
      }
      
      await dietitianAPI.unsubscribeFromDietitian(userId);
      
      setUnsubscribeSuccess(true);
      fetchSubscribedUsers();
      
      setTimeout(() => {
        setUnsubscribeSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to unsubscribe user:", err);
      setUnsubscribeError("Failed to unsubscribe user. Please try again.");
    } finally {
      setUnsubscribeLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev + 1);
    setForceRefresh(Date.now());
  };
  
  const handleNextWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(prev => prev - 1);
      setForceRefresh(Date.now());
    }
  };
  
  useEffect(() => {
    const previousWeekHandler = handlePreviousWeek;
    const nextWeekHandler = handleNextWeek;
    
    if (window.nutritionCardNavigation) {
      if (!originalHandlePreviousWeek.current) {
        originalHandlePreviousWeek.current = window.nutritionCardNavigation.handlePreviousWeek;
      }
      if (!originalHandleNextWeek.current) {
        originalHandleNextWeek.current = window.nutritionCardNavigation.handleNextWeek;
      }
      
      window.nutritionCardNavigation.handlePreviousWeek = previousWeekHandler;
      window.nutritionCardNavigation.handleNextWeek = nextWeekHandler;
    } else {
      window.nutritionCardNavigation = {
        handlePreviousWeek: previousWeekHandler,
        handleNextWeek: nextWeekHandler
      };
    }
    
    const origPrevWeek = originalHandlePreviousWeek.current;
    const origNextWeek = originalHandleNextWeek.current;
        return () => {
      if (window.nutritionCardNavigation) {
        if (origPrevWeek) {
          window.nutritionCardNavigation.handlePreviousWeek = origPrevWeek;
        }
        if (origNextWeek) {
          window.nutritionCardNavigation.handleNextWeek = origNextWeek;
        }
      }
    };
  }, [handlePreviousWeek, handleNextWeek]);
  
  const fetchUserProgress = async (userId) => {
    try {
      setWeekOffset(0);
      
      const data = await dietitianAPI.getUserProgress(userId);
      
      if (data && data.nutritionHistory) {
        const historyData = data.nutritionHistory.dates.map((date, index) => ({
          date: date,
          total_calories: data.nutritionHistory.calories[index],
          total_protein: data.nutritionHistory.protein[index],
          total_carbs: data.nutritionHistory.carbs[index],
          total_fats: data.nutritionHistory.fats[index]
        }));
        
        setNutritionHistoryData(historyData);
        
        setUserProgress(data);
        
        setForceRefresh(Date.now());
      } else {
        setUserProgress(data);
        setNutritionHistoryData([]);
      }
      
      setSelectedUser(subscribedUsers.find((user) => user.id === userId));
      
      fetchUserGoals(userId);
    } catch (err) {
      setError(
        "Failed to fetch user progress: " + (err.message || "Unknown error")
      );
    }
  };
  
  const fetchUserGoals = async (userId) => {
    try {
      const goals = await dietitianAPI.getUserGoals(userId);
      setUserGoals(goals);
      setUpdatedGoals({
        ...goals,
        dailyCalorieGoal: goals.dailyCalorieGoal || 2000,
        proteinGoal: goals.proteinGoal || 100,
        carbsGoal: goals.carbsGoal || 250,
        fatsGoal: goals.fatsGoal || 70,
        goalType: goals.goalType || 'maintain',
        activityLevel: goals.activityLevel || 'moderate'
      }); 
      setGoalUpdateSuccess(false);
      setGoalUpdateError("");
    } catch (err) {
      console.error("Failed to fetch user goals:", err);
      setUserGoals(null);
    }
  };
  
  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    
    const numericFields = ['dailyCalorieGoal', 'proteinGoal', 'carbsGoal', 'fatsGoal', 'targetWeight'];
    const newValue = numericFields.includes(name) ? parseFloat(value) : value;
    
    setUpdatedGoals(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const saveUserGoals = async () => {
    if (!selectedUser) return;
    
    setGoalUpdateLoading(true);
    setGoalUpdateSuccess(false);
    setGoalUpdateError("");
    
    const goalsToSend = {
      ...updatedGoals,
      dailyCalorieGoal: Number(updatedGoals.dailyCalorieGoal),
      proteinGoal: Number(updatedGoals.proteinGoal),
      carbsGoal: Number(updatedGoals.carbsGoal),
      fatsGoal: Number(updatedGoals.fatsGoal),
      targetWeight: updatedGoals.targetWeight ? Number(updatedGoals.targetWeight) : null
    };
    
    
    try {
      const updatedUserGoals = await dietitianAPI.updateUserGoals(selectedUser.id, goalsToSend);
            
      setUserGoals(updatedUserGoals);
      setShowEditModal(false);
      setGoalUpdateSuccess(true);
      
      setSelectedUser(prev => ({
        ...prev,
        dailyCalorieGoal: goalsToSend.dailyCalorieGoal,
        goalType: goalsToSend.goalType,
        activityLevel: goalsToSend.activityLevel
      }));
      
      fetchUserGoals(selectedUser.id);
    } catch (err) {
      console.error('Error details:', err);
      setGoalUpdateError(err.message || "Failed to update user goals");
    } finally {
      setGoalUpdateLoading(false);
    }
  };
  
  const openEditModal = () => {
    if (userGoals) {
      setUpdatedGoals({
        ...userGoals,
        dailyCalorieGoal: userGoals.dailyCalorieGoal || 2000,
        proteinGoal: userGoals.proteinGoal || 100,
        carbsGoal: userGoals.carbsGoal || 250,
        fatsGoal: userGoals.fatsGoal || 70
      });
    }
    setShowEditModal(true);
    setGoalUpdateError("");
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setGoalUpdateError("");
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  if (loading) {
    return (
      <Container
        className='d-flex justify-content-center align-items-center'
        style={{ minHeight: "80vh" }}
      >
        <Spinner animation='border' />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant='danger'>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className='dietitian-dashboard py-4'>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dietitian Dashboard</h2>
        <Button 
          variant="outline-danger" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      <Row>
        <Col md={6}>
          <Card className='mb-4'>
            <Card.Header>
              <h5 className='mb-0'>Your Subscribed Users</h5>
            </Card.Header>
            <Card.Body>
              {unsubscribeSuccess && (
                <Alert variant="success" className="mb-3">
                  User has been successfully unsubscribed.
                </Alert>
              )}
              
              {unsubscribeError && (
                <Alert variant="danger" className="mb-3">
                  {unsubscribeError}
                </Alert>
              )}
              
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Goal Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={
                        selectedUser?.id === user.id ? "selected-user" : ""
                      }
                    >
                      <td>{user.fullName}</td>
                      <td>{user.goalType}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant='primary'
                            size='sm'
                            onClick={() => fetchUserProgress(user.id)}
                          >
                            View Progress
                          </Button>
                          <Button
                            variant='danger'
                            size='sm'
                            onClick={() => handleUnsubscribe(user.id)}
                            disabled={unsubscribeLoading}
                          >
                            {unsubscribeLoading ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          {selectedUser && userProgress && (
            <Card>
              <Card.Header>
                <h5 className='mb-0'>{selectedUser.fullName}'s Progress</h5>
              </Card.Header>
              <Card.Body>
                <div className='mb-3'>
                  <h6>Current Stats</h6>
                  <p>
                    Weight:{" "}
                    {userProgress.userDetails?.weight || selectedUser.weight} kg
                  </p>
                  <p>
                    Height:{" "}
                    {userProgress.userDetails?.height || selectedUser.height} cm
                  </p>
                  <p>
                    Goal Type:{" "}
                    {userProgress.userDetails?.goalType ||
                      selectedUser.goalType}
                  </p>
                  <p>
                    Daily Calorie Goal:{" "}
                    {userProgress.userDetails?.dailyCalorieGoal ||
                      selectedUser.dailyCalorieGoal}{" "}
                    kcal
                  </p>
                </div>
                
                <div className='mb-3 mt-4 pt-3 border-top'>
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <h6 className='mb-0'>User Targets</h6>
                    <Button 
                      variant='outline-primary' 
                      size='sm'
                      onClick={openEditModal}
                    >
                      Edit Targets
                    </Button>
                  </div>
                  
                  {goalUpdateSuccess && (
                    <Alert variant='success' className='mt-2 mb-3'>
                      User targets updated successfully!
                    </Alert>
                  )}
                  
                  {userGoals ? (
                    <div>
                      <div className='row'>
                        <div className='col-md-6'>
                          <p><strong>Goal Type:</strong> {userGoals.goalType === 'lose' ? 'Lose Weight' : userGoals.goalType === 'gain' ? 'Gain Weight' : 'Maintain Weight'}</p>
                          <p><strong>Activity Level:</strong> {userGoals.activityLevel?.charAt(0).toUpperCase() + userGoals.activityLevel?.slice(1).replace('_', ' ')}</p>
                          {userGoals.targetWeight && <p><strong>Target Weight:</strong> {userGoals.targetWeight} kg</p>}
                        </div>
                        <div className='col-md-6'>
                          <p><strong>Daily Calorie Goal:</strong> {userGoals.dailyCalorieGoal} kcal</p>
                          <p><strong>Protein Goal:</strong> {userGoals.proteinGoal || 'Not set'} g</p>
                          <p><strong>Carbs Goal:</strong> {userGoals.carbsGoal || 'Not set'} g</p>
                          <p><strong>Fats Goal:</strong> {userGoals.fatsGoal || 'Not set'} g</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>No target information available for this user.</p>
                  )}
                </div>
                
                {/* Nutritional Targets Section */}
                <div className='mb-3 mt-4 pt-3 border-top'>
                  <div className='d-flex justify-content-between align-items-center mb-3'>
                    <h6 className='mb-0'>Nutritional Targets</h6>
                  </div>
                  
                  {userGoals ? (
                    <Card className="bg-light">
                      <Card.Body>
                        <Row>
                          <Col md={12} className="mb-3">
                            <h6 className="text-primary">Daily Calorie Distribution</h6>
                            <div className="progress mb-2" style={{ height: '25px' }}>
                              <div 
                                className="progress-bar bg-danger" 
                                role="progressbar" 
                                style={{ width: `${userGoals.proteinGoal ? (userGoals.proteinGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0}%` }}
                                aria-valuenow={userGoals.proteinGoal ? (userGoals.proteinGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                Protein
                              </div>
                              <div 
                                className="progress-bar bg-warning" 
                                role="progressbar" 
                                style={{ width: `${userGoals.carbsGoal ? (userGoals.carbsGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0}%` }}
                                aria-valuenow={userGoals.carbsGoal ? (userGoals.carbsGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                Carbs
                              </div>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${userGoals.fatsGoal ? (userGoals.fatsGoal * 9 / userGoals.dailyCalorieGoal * 100) : 0}%` }}
                                aria-valuenow={userGoals.fatsGoal ? (userGoals.fatsGoal * 9 / userGoals.dailyCalorieGoal * 100) : 0} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                Fats
                              </div>
                            </div>
                            <div className="d-flex justify-content-between small text-muted">
                              <span>0 kcal</span>
                              <span>{userGoals.dailyCalorieGoal} kcal</span>
                            </div>
                          </Col>
                        </Row>
                        
                        <Row className="mt-3">
                          <Col md={4}>
                            <Card className="text-center h-100">
                              <Card.Body>
                                <h6 className="text-danger">Protein</h6>
                                <h3>{userGoals.proteinGoal || '0'} g</h3>
                                <p className="text-muted small mb-0">{userGoals.proteinGoal ? Math.round(userGoals.proteinGoal * 4) : 0} kcal</p>
                                <p className="text-muted small mb-0">{userGoals.proteinGoal && userGoals.dailyCalorieGoal ? Math.round(userGoals.proteinGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0}% of total</p>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={4}>
                            <Card className="text-center h-100">
                              <Card.Body>
                                <h6 className="text-warning">Carbohydrates</h6>
                                <h3>{userGoals.carbsGoal || '0'} g</h3>
                                <p className="text-muted small mb-0">{userGoals.carbsGoal ? Math.round(userGoals.carbsGoal * 4) : 0} kcal</p>
                                <p className="text-muted small mb-0">{userGoals.carbsGoal && userGoals.dailyCalorieGoal ? Math.round(userGoals.carbsGoal * 4 / userGoals.dailyCalorieGoal * 100) : 0}% of total</p>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={4}>
                            <Card className="text-center h-100">
                              <Card.Body>
                                <h6 className="text-success">Fats</h6>
                                <h3>{userGoals.fatsGoal || '0'} g</h3>
                                <p className="text-muted small mb-0">{userGoals.fatsGoal ? Math.round(userGoals.fatsGoal * 9) : 0} kcal</p>
                                <p className="text-muted small mb-0">{userGoals.fatsGoal && userGoals.dailyCalorieGoal ? Math.round(userGoals.fatsGoal * 9 / userGoals.dailyCalorieGoal * 100) : 0}% of total</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                        
                        <Row className="mt-3">
                          <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0">Total Daily Calorie Goal</h6>
                                <p className="text-muted mb-0 small">Based on {userGoals.goalType === 'lose' ? 'weight loss' : userGoals.goalType === 'gain' ? 'weight gain' : 'weight maintenance'} goal</p>
                              </div>
                              <h3 className="mb-0">{userGoals.dailyCalorieGoal} kcal</h3>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ) : (
                    <p>No nutritional target information available for this user.</p>
                  )}
                </div>
                {userProgress.nutritionHistory && (
                  <div className='progress-chart'>
                    <div className="nutrition-card-wrapper">
                      <NutritionCard
                        key={`nutrition-${selectedUser.id}-${forceRefresh}`}
                        title={`${selectedUser.fullName}'s Nutrition History (${weekOffset === 0 ? 'Current Week' : `${weekOffset} ${weekOffset === 1 ? 'Week' : 'Weeks'} Ago`})`}
                        dataKey="calories"
                        color="rgb(75, 192, 192)"
                        unit="kcal"
                        foodEntriesChanged={forceRefresh}
                      />
                    </div>
                    <div className='mt-4'>
                      <h6>Nutrition Summary</h6>
                      <div className='d-flex flex-wrap'>
                        {userProgress.nutritionHistory.dates.map((date, index) => (
                          <div key={date} className='me-4 mb-3 p-3 border rounded'>
                            <p className='mb-1'><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
                            <p className='mb-1'><strong>Calories:</strong> {userProgress.nutritionHistory.calories[index]} kcal</p>
                            <p className='mb-1'><strong>Protein:</strong> {userProgress.nutritionHistory.protein[index]} g</p>
                            <p className='mb-1'><strong>Carbs:</strong> {userProgress.nutritionHistory.carbs[index]} g</p>
                            <p className='mb-1'><strong>Fats:</strong> {userProgress.nutritionHistory.fats[index]} g</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
            <Modal show={showEditModal} onHide={closeEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser ? `Edit Targets for ${selectedUser.fullName}` : 'Edit User Targets'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {goalUpdateError && (
            <Alert variant='danger' className='mb-3'>
              {goalUpdateError}
            </Alert>
          )}
          
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Goal Type</Form.Label>
                  <Form.Select 
                    name="goalType"
                    value={updatedGoals.goalType || ''}
                    onChange={handleGoalChange}
                  >
                    <option value="lose">Lose Weight</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Gain Weight</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Level</Form.Label>
                  <Form.Select 
                    name="activityLevel"
                    value={updatedGoals.activityLevel || ''}
                    onChange={handleGoalChange}
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                    <option value="very_active">Very Active</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Daily Calorie Goal</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number"
                      name="dailyCalorieGoal"
                      value={updatedGoals.dailyCalorieGoal || ''}
                      onChange={handleGoalChange}
                      min="1000"
                      max="5000"
                      step="50"
                    />
                    <InputGroup.Text>kcal</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Weight</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number"
                      name="targetWeight"
                      value={updatedGoals.targetWeight || ''}
                      onChange={handleGoalChange}
                      min="30"
                      max="200"
                      step="0.1"
                    />
                    <InputGroup.Text>kg</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <h5 className="mt-4 mb-3">Macro Nutrient Goals</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Protein Goal</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number"
                      name="proteinGoal"
                      value={updatedGoals.proteinGoal || ''}
                      onChange={handleGoalChange}
                      min="0"
                      max="300"
                      step="5"
                    />
                    <InputGroup.Text>g</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Carbs Goal</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number"
                      name="carbsGoal"
                      value={updatedGoals.carbsGoal || ''}
                      onChange={handleGoalChange}
                      min="0"
                      max="500"
                      step="5"
                    />
                    <InputGroup.Text>g</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Fats Goal</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="number"
                      name="fatsGoal"
                      value={updatedGoals.fatsGoal || ''}
                      onChange={handleGoalChange}
                      min="0"
                      max="200"
                      step="5"
                    />
                    <InputGroup.Text>g</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal} disabled={goalUpdateLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveUserGoals} disabled={goalUpdateLoading}>
            {goalUpdateLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DietitianDashboard;
