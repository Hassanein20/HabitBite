import { React, useState, useEffect, useRef, useLayoutEffect } from "react";
import Style from "./Standard.module.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import NutritionCard from "../Graph/NutritionCard";
import ICard from "../IngredientCard/ICard";
import { searchFoods } from "../../API/FoodDataCentral";
import { authAPI, foodEntryAPI, dietitianAPI } from "../../API/api";
import { fetchCSRFToken } from "../../API/api";
import { CSRF } from "../../utils/csrf";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";

import { 
  FaFire, 
  FaWeight, 
  FaAppleAlt, 
  FaList, 
  FaPlus, 
  FaSignOutAlt, 
  FaEdit, 
  FaUtensils, 
  FaCalendarAlt, 
  FaBolt, 
  FaDrumstickBite, 
  FaBreadSlice, 
  FaBacon, 
  FaTrashAlt, 
  FaUserMd,  
} from "react-icons/fa";

const Standard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const Goal = currentUser?.goalType || "Maintain Weight";
  const CurrentWeight = currentUser?.weight || 0;
  const [show, setShow] = useState(false);
  const [showDietitianModal, setShowDietitianModal] = useState(false);
  const [dietitians, setDietitians] = useState([]);
  const [dietitianSearchTerm, setDietitianSearchTerm] = useState("");
  const [loadingDietitians, setLoadingDietitians] = useState(false);
  const [dietitianError, setDietitianError] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editGoals, setEditGoals] = useState({
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFats: 0,
    targetWeight: 0,
  });
  const [goalUpdateLoading, setGoalUpdateLoading] = useState(false);
  const [goalUpdateError, setGoalUpdateError] = useState("");
  const [goalUpdateSuccess, setGoalUpdateSuccess] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [addedIngredients, setAddedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [foodEntriesChanged, setFoodEntriesChanged] = useState(0);
  const [userGoals, setUserGoals] = useState({
    targetCalories: 2000,
    targetProtein: 0,
    targetCarbs: 0,
    targetFats: 0,
    targetWeight: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const modalIngredientsRef = useRef(null);

  const cardRef = useRef(null);
  const addedIngredientsCardRef = useRef(null);

  const goalRowRefs = useRef([]);
  const headerRef = useRef(null);
  const progressBarRefs = useRef([]);

  const [displayedAddedIngredients, setDisplayedAddedIngredients] = useState(
    []
  );
  const [addedIngredientsPage, setAddedIngredientsPage] = useState(1);
  const [hasMoreAddedIngredients, setHasMoreAddedIngredients] = useState(true);
  const addedIngredientsContainerRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  useLayoutEffect(() => {
    if (cardRef.current) {
      const root = document.documentElement;

      root.style.setProperty("--color-primary-rgb", "75, 192, 192");
      root.style.setProperty("--color-protein-rgb", "255, 99, 132");
      root.style.setProperty("--color-carbs-rgb", "54, 162, 235");
      root.style.setProperty("--color-fats-rgb", "255, 206, 86");

      const card = cardRef.current;
      card.style.setProperty("--protein-color", "#ff6384");
      card.style.setProperty("--carbs-color", "#36a2eb");
      card.style.setProperty("--fats-color", "#ffce56");
      card.style.setProperty("--calories-color", "#4bc0c0");
    }
  }, []);

  const handleIngredientsCardMouseMove = (e) => {
    if (!addedIngredientsCardRef.current) return;

    const card = addedIngredientsCardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    card.style.setProperty("--x", `${xPercent}%`);
    card.style.setProperty("--y", `${yPercent}%`);

    const light = card.querySelector(`.${Style.cursorLight}`);
    if (light) {
      light.style.setProperty("--x", `${xPercent}%`);
      light.style.setProperty("--y", `${yPercent}%`);
      light.style.opacity = "1";
    }
  };

  const handleAddedIngredientsMouseMove = (e) => {
    if (!addedIngredientsContainerRef.current) return;

    const container = addedIngredientsContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    container.style.setProperty("--x", `${xPercent}%`);
    container.style.setProperty("--y", `${yPercent}%`);
  };

  const handleIngredientItemMouseMove = (e) => {
    const item = e.currentTarget;
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    item.style.setProperty("--x", `${xPercent}%`);
    item.style.setProperty("--y", `${yPercent}%`);

    const bg = item.querySelector(`.${Style.ingredientItemBg}`);
    if (bg) {
      bg.style.setProperty("--x", `${xPercent}%`);
      bg.style.setProperty("--y", `${yPercent}%`);
      bg.style.opacity = "1";
    }
  };

  const handleIngredientItemMouseLeave = (e) => {
    const item = e.currentTarget;
    if (!item) return;

    const bg = item.querySelector(`.${Style.ingredientItemBg}`);
    if (bg) {
      bg.style.opacity = "0";
    }
  };

  const handleIngredientsCardMouseLeave = (e) => {
    if (!addedIngredientsCardRef.current) return;

    const card = addedIngredientsCardRef.current;

    const light = card.querySelector(`.${Style.cursorLight}`);
    if (light) {
      light.style.opacity = "0";
    }
  };

  const caloriesGoal =
    userGoals.targetCalories || currentUser?.calorieGoal || 2000;
  const caloriesLeft = Number((caloriesGoal - dailyTotals.calories).toFixed(2));

  useEffect(() => {
    const fetchToken = async () => {
      try {
        await fetchCSRFToken();
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };

    fetchToken();
  }, []);

  const handleShowDietitianModal = async () => {
    setShowDietitianModal(true);
    setDietitianSearchTerm("");
    setDietitianError("");
    setSubscribeSuccess(false);
    await fetchDietitians();
  };

  const fetchDietitians = async () => {
    try {
      setLoadingDietitians(true);
      setDietitianError("");
      const availableDietitians = await dietitianAPI.getAvailableDietitians();
      setDietitians(availableDietitians || []);
    } catch (err) {
      console.error("Failed to fetch dietitians:", err);
      setDietitianError("Could not fetch available dietitians. Please try again.");
    } finally {
      setLoadingDietitians(false);
    }
  };

  const handleSubscribeToDietitian = async (dietitianId) => {
    try {
      setLoadingDietitians(true);
      setDietitianError("");
      await dietitianAPI.subscribeToDietitian(dietitianId);
      setSubscribeSuccess(true);
      
      setTimeout(() => {
        setShowDietitianModal(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to subscribe to dietitian:", err);
      setDietitianError("Failed to subscribe to dietitian. Please try again.");
    } finally {
      setLoadingDietitians(false);
    }
  };

  useEffect(() => {
    const fetchUserGoals = async () => {
      try {
        const goals = await authAPI.getUserGoals();
        setUserGoals(goals);
      } catch (err) {
        console.error("Failed to fetch user goals:", err);
        setError("Could not fetch user goals. Using default values.");
      }
    };

    if (currentUser) {
      fetchUserGoals();
    }
  }, [currentUser]);

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };
  
  const getTodayFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) return;
      try {
        setInitialLoading(true);
        setError("");

        const today = new Date();
        const todayStr = getTodayFormattedDate();

        await refreshNutritionData();

        try {
          const entries = await foodEntryAPI.getDailyEntries(todayStr);
          setAddedIngredients(entries);
        } catch (err) {
          console.error("Error fetching daily entries:", err);
          setError("Could not fetch daily entries: " + err.message);
          setAddedIngredients([]);
        }

        try {
          const nutrition = await foodEntryAPI.getDailyNutrition(todayStr);
          setDailyTotals({
            protein: nutrition.total_protein || 0,
            carbs: nutrition.total_carbs || 0,
            fats: nutrition.total_fats || 0,
            calories: nutrition.total_calories || 0,
          });
        } catch (err) {
          setError("Could not fetch daily nutrition: " + err.message);
          setDailyTotals({
            protein: 0,
            carbs: 0,
            fats: 0,
            calories: 0,
          });
        }
      } catch (err) {
        setError("Some features may not be available. Please try again later.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser]);

  const refreshNutritionData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);

      const todayStr = formatDateForAPI(new Date());

      try {
        const dailyNutrition = await foodEntryAPI.getDailyNutrition(todayStr);

        if (dailyNutrition) {
          setDailyTotals({
            protein: dailyNutrition.total_protein || 0,
            carbs: dailyNutrition.total_carbs || 0,
            fats: dailyNutrition.total_fats || 0,
            calories: dailyNutrition.total_calories || 0,
          });
        }
      } catch (err) {
        console.error("Error refreshing daily nutrition:", err);
      }

      const history = await foodEntryAPI.getNutritionHistory(
        formattedStartDate,
        formattedEndDate
      );
      if (history && Array.isArray(history)) {
        const formattedData = [];
        const dayOrder = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        const processedDates = new Map();
        history.forEach((entry) => {
          try {
            let date;
            if (typeof entry.date === "string") {
              date = new Date(entry.date);
            } else if (entry.date instanceof Date) {
              date = entry.date;
            } else {
              console.warn("Unknown date format:", entry.date);
              return; 
            }

            const dayOfWeek = date.toLocaleDateString("en-US", {
              weekday: "long",
            });

            const dateStr = date.toISOString().split("T")[0];
            const isToday = dateStr === todayStr;

            const existingData = processedDates.get(dayOfWeek);

            const newData = {
              day: dayOfWeek,
              calories: Number(entry.total_calories || 0),
              protein: Number(entry.total_protein || 0),
              carbs: Number(entry.total_carbs || 0),
              fats: Number(entry.total_fats || 0),
            };

            if (!existingData || isToday) {
              processedDates.set(dayOfWeek, newData);

              if (isToday) {
              }
            }
          } catch (err) {
            console.error("Error processing history entry:", err, entry);
          }
        });

        dayOrder.forEach((day) => {
          if (processedDates.has(day)) {
            formattedData.push(processedDates.get(day));
          } else {
            formattedData.push({
              day: day,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
            });
          }
        });

        formattedData.sort(
          (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );

        setWeeklyData(formattedData);
        return true;
      } else {
        console.warn("History response is not an array or is empty:", history);
        const emptyWeekData = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((day) => ({
          day,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        }));
        setWeeklyData(emptyWeekData);
        return false;
      }
    } catch (err) {
      console.error("Could not fetch weekly data:", err);
      setError("Could not fetch weekly data: " + err.message);
      const emptyWeekData = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ].map((day) => ({
        day,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }));
      setWeeklyData(emptyWeekData);
      return false;
    }
  };

  const handleScroll = () => {
    if (!modalIngredientsRef.current || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      modalIngredientsRef.current;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreIngredients();
    }
  };

  const loadMoreIngredients = async () => {
    if (loadingMore || !hasMore || searchTerm.length < 3) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const result = await searchFoods(searchTerm, nextPage);

      setCurrentPage(nextPage);
      setTotalPages(result.totalPages);
      setHasMore(nextPage < result.totalPages);

      if (result.foods && result.foods.length > 0) {
        const formattedNewIngredients = result.foods.map((food) => ({
          id: food.fdcId,
          name: food.description,
          chartData: formatNutrients(food),
        }));

        setIngredients((prev) => [...prev, ...formattedNewIngredients]);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more ingredients:", err);
      setError("Failed to load more ingredients. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        try {
          setCurrentPage(1);
          setHasMore(true);

          const result = await searchFoods(searchTerm, 1);

          setTotalPages(result.totalPages);
          setHasMore(result.currentPage < result.totalPages);

          const formattedIngredients = result.foods.map((food) => ({
            id: food.fdcId,
            name: food.description,
            chartData: formatNutrients(food),
          }));
          setIngredients(formattedIngredients);
          setError("");
        } catch (err) {
          setError("Failed to fetch data");
          setIngredients([]);
          setHasMore(false);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm]);

  const formatNutrients = (food) => {
    const nutrients = {
      Protein:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find((n) => n.nutrientName === "Protein")
              ?.value || 0
          ) * 100
        ) / 100,
      Carbs:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find(
              (n) => n.nutrientName === "Carbohydrate, by difference"
            )?.value || 0
          ) * 100
        ) / 100,
      Fat:
        Math.round(
          Math.max(
            0,
            food.foodNutrients.find(
              (n) => n.nutrientName === "Total lipid (fat)"
            )?.value || 0
          ) * 100
        ) / 100,
    };

    return [
      { value: nutrients.Protein, color: "#ff6384", label: "Protein" },
      { value: nutrients.Carbs, color: "#36a2eb", label: "Carbs" },
      { value: nutrients.Fat, color: "#ffce56", label: "Fat" },
    ];
  };

  const refreshNutritionDataWithRetry = async () => {
    try {
      let success = false;
      await new Promise((resolve) => setTimeout(resolve, 300));
      success = await refreshNutritionData();
      return success;
    } catch (refreshError) {
      console.error("Error refreshing nutrition data:", refreshError);
      return false;
    }
  };

  const refreshTodayData = async () => {
    try {
      const todayStr = getTodayFormattedDate();
      const entries = await foodEntryAPI.getDailyEntries(todayStr);
      setAddedIngredients(entries);
      const nutrition = await foodEntryAPI.getDailyNutrition(todayStr);
      setDailyTotals({
        protein: nutrition.total_protein || 0,
        carbs: nutrition.total_carbs || 0,
        fats: nutrition.total_fats || 0,
        calories: nutrition.total_calories || 0,
      });

      const weeklySuccess = await refreshNutritionDataWithRetry();
      setFoodEntriesChanged(Date.now());

      return true;
    } catch (err) {
      console.error("Error refreshing today's data:", err);
      return false;
    }
  };

  const handleAddIngredient = async (ingredient, grams) => {
    try {
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        await fetchCSRFToken();
      }

      const proteinPer100g = ingredient.chartData.find(
        (d) => d.label === "Protein"
      ).value;
      const carbsPer100g = ingredient.chartData.find(
        (d) => d.label === "Carbs"
      ).value;
      const fatsPer100g = ingredient.chartData.find(
        (d) => d.label === "Fat"
      ).value;

      const protein = Number(((proteinPer100g * grams) / 100).toFixed(2));
      const carbs = Number(((carbsPer100g * grams) / 100).toFixed(2));
      const fats = Number(((fatsPer100g * grams) / 100).toFixed(2));
      const calories = Number((protein * 4 + carbs * 4 + fats * 9).toFixed(2));

      const today = new Date();
      const todayFormatted = getTodayFormattedDate();
      
      const todayMidnight = new Date();
      todayMidnight.setHours(12, 0, 0, 0);       
      todayMidnight.setMilliseconds(
        todayMidnight.getMilliseconds() + Math.floor(Math.random() * 1000)
      );
      const fullISODate = todayMidnight.toISOString();

      const foodEntry = {
        foodId: ingredient.id.toString(),
        name: ingredient.name,
        amount: Number(grams.toFixed(2)),
        date: fullISODate,
        calories: Math.max(0.01, Number(calories.toFixed(2))),
        protein: Math.max(0.01, Number(protein.toFixed(2))),
        carbs: Math.max(0.01, Number(carbs.toFixed(2))),
        fat: Math.max(0.01, Number(fats.toFixed(2))),
      };

      const response = await foodEntryAPI.addFoodEntry(foodEntry);

      if (response) {
        const entryTime = response.entry_date || response.date || fullISODate;
        const timestamp = new Date(entryTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const newIngredient = {
          id: response.id,
          name: ingredient.name,
          grams: Math.round(grams),
          protein: Number(protein.toFixed(2)),
          carbs: Number(carbs.toFixed(2)),
          fat: Number(fats.toFixed(2)),
          calories: Number(calories.toFixed(2)),
          timestamp: timestamp,
          isNew: true,
        };

        setAddedIngredients((prev) => [newIngredient, ...prev]);
        setDailyTotals((prev) => ({
          protein: Number((prev.protein + protein).toFixed(2)),
          carbs: Number((prev.carbs + carbs).toFixed(2)),
          fats: Number((prev.fats + fats).toFixed(2)),
          calories: Number((prev.calories + calories).toFixed(2)),
        }));

        setTimeout(async () => {
          try {
            const refreshSuccess = await refreshTodayData();            
            setFoodEntriesChanged(Date.now());
          } catch (refreshError) {
            console.error("Error during refresh after adding ingredient:", refreshError);
          }

          setTimeout(() => {
            setAddedIngredients((prevIngredients) =>
              prevIngredients.map((item) =>
                item.id === newIngredient.id ? { ...item, isNew: false } : item
              )
            );
          }, 3000);
        }, 500);

        setShow(false);
      }
    } catch (err) {
      console.error("Error adding food entry:", err);
      setError("Failed to add food entry. Please try again.");
    }
  };

  const handleDeleteIngredient = async (id) => {
    try {
      const itemToDelete = addedIngredients.find((item) => item.id === id);
      
      if (!itemToDelete) {
        console.error("Could not find item to delete with ID:", id);
        return;
      }

      await foodEntryAPI.deleteFoodEntry(id);
      setAddedIngredients((prev) => prev.filter((item) => item.id !== id));

      setDailyTotals((prevTotals) => ({
        protein: Math.max(0, prevTotals.protein - itemToDelete.protein),
        carbs: Math.max(0, prevTotals.carbs - itemToDelete.carbs),
        fats: Math.max(0, prevTotals.fats - itemToDelete.fat),
        calories: Math.max(0, prevTotals.calories - itemToDelete.calories),
      }));

      setTimeout(async () => {
        try {
          const refreshSuccess = await refreshTodayData();          
          setFoodEntriesChanged(Date.now());
        } catch (refreshErr) {
          console.error("Error refreshing data after deletion:", refreshErr);
        }
      }, 500);
    } catch (err) {
      console.error("Error deleting food entry:", err);
      setError("Failed to delete food entry. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/SignIn");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  const renderError = (msg) => {
    if (!msg) return null;
    if (msg.includes("Rate limit exceeded")) {
      return (
        <Alert variant='danger' className='mb-3'>
          Too many requests. Please wait a few seconds and try again.
          <br />
          If this happens repeatedly, please contact support or try again later.
        </Alert>
      );
    }
    return (
      <Alert variant='warning' className='mb-3'>
        {msg}
      </Alert>
    );
  };

  useEffect(() => {
    if (!goalRowRefs.current.length) return;

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateX(0)";
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const currentGoalRowRefs = [...goalRowRefs.current];
    const currentProgressBarRefs = [...progressBarRefs.current];

    currentGoalRowRefs.forEach((row, index) => {
      if (row) {
        row.style.opacity = "0";
        row.style.transform = "translateX(-20px)";
        row.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(row);
      }
    });

    currentProgressBarRefs.forEach((bar) => {
      if (bar) {
        const fill = bar.querySelector(`.${Style.progressFill}`);
        if (fill) {
          fill.style.width = "0%";
          observer.observe(bar);
        }
      }
    });

    return () => {
      currentGoalRowRefs.forEach((row) => {
        if (row) observer.unobserve(row);
      });
      currentProgressBarRefs.forEach((bar) => {
        if (bar) observer.unobserve(bar);
      });
    };
  }, [addedIngredients]); 
  const handleAddedIngredientsScroll = () => {
    if (!addedIngredientsContainerRef.current || !hasMoreAddedIngredients)
      return;

    const { scrollTop, scrollHeight, clientHeight } =
      addedIngredientsContainerRef.current;

    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreAddedIngredients();
    }
  };

  const loadMoreAddedIngredients = () => {
    if (!hasMoreAddedIngredients) return;

    const nextPage = addedIngredientsPage + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    if (startIndex >= addedIngredients.length) {
      setHasMoreAddedIngredients(false);
      return;
    }

    const nextBatch = addedIngredients.slice(startIndex, endIndex);
    setDisplayedAddedIngredients((prev) => [...prev, ...nextBatch]);
    setAddedIngredientsPage(nextPage);

    setHasMoreAddedIngredients(endIndex < addedIngredients.length);
  };

  useEffect(() => {
    setAddedIngredientsPage(1);
    const initialItems = addedIngredients.slice(0, ITEMS_PER_PAGE);
    setDisplayedAddedIngredients(initialItems);

    setHasMoreAddedIngredients(addedIngredients.length > ITEMS_PER_PAGE);
  }, [addedIngredients]);

  const handleShowGoalsModal = () => {
    setEditGoals({
      targetCalories: userGoals.targetCalories,
      targetProtein: userGoals.targetProtein,
      targetCarbs: userGoals.targetCarbs,
      targetFats: userGoals.targetFats,
      targetWeight: userGoals.targetWeight,
    });
    setGoalUpdateError("");
    setGoalUpdateSuccess(false);
    setShowGoalsModal(true);
  };

  const handleSaveGoals = async () => {
    try {
      setGoalUpdateLoading(true);
      setGoalUpdateError("");
      setGoalUpdateSuccess(false);

      const goals = {
        targetCalories: Number(editGoals.targetCalories) || 0,
        targetProtein: Number(editGoals.targetProtein) || 0,
        targetCarbs: Number(editGoals.targetCarbs) || 0,
        targetFats: Number(editGoals.targetFats) || 0,
        targetWeight: Number(editGoals.targetWeight) || 0,
      };

      if (goals.targetCalories <= 0) {
        setGoalUpdateError("Calories must be greater than 0");
        setGoalUpdateLoading(false);
        return;
      }

      const updatedGoals = await authAPI.updateUserGoals(goals);
      setUserGoals(updatedGoals || goals);
      setGoalUpdateSuccess(true);

      setTimeout(() => {
        setShowGoalsModal(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to update goals:", err);
      setGoalUpdateError(err.message || "Failed to update goals");
    } finally {
      setGoalUpdateLoading(false);
    }
  };

  const handleGoalInputChange = (e) => {
    const { name, value } = e.target;
    setEditGoals((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (initialLoading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        size='xl'
        show={show}
        onHide={() => setShow(false)}
        backdrop='static'
        keyboard={false}
        className={Style.fadeInModal}
      >
        <Modal.Header className={Style.modalHeader}>
          <Modal.Title className={Style.modalTitle}>
            <div className={Style.modalIconWrapper}>
              <FaAppleAlt className={Style.modalIcon} />
            </div>
            Search Items
          </Modal.Title>
          <Button
            variant='link'
            className={Style.modalCloseButton}
            onClick={() => setShow(false)}
            aria-label='Close'
          >
            <span aria-hidden='true'>&times;</span>
          </Button>
        </Modal.Header>

        <Modal.Body className={Style.modalBody}>
          <Form.Control
            type='text'
            placeholder='Search items...'
            className={`mb-3 ${Style.searchInput}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loading && (
              <Spinner animation='border' className={Style.spinner} />
            )}
            {renderError(error)}
          </div>

          <Row
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              position: "relative",
            }}
            className={`${Style.ingredientGrid} ${Style.smoothScroll}`}
            ref={modalIngredientsRef}
            onScroll={handleScroll}
          >
            <div className={Style.scrollFadeTop}></div>
            {ingredients.map((ingredient, index) => (
              <Col
                xs={12}
                sm={6}
                md={6}
                lg={6}
                key={`${ingredient.id}-${index}`}
                className={Style.ingredientCol}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ICard
                  title={ingredient.name}
                  chartData={ingredient.chartData}
                  onAdd={(grams) => handleAddIngredient(ingredient, grams)}
                  style={{ width: "100%" }}
                />
              </Col>
            ))}
            {loadingMore && (
              <Col xs={12} className={Style.loadingMoreContainer}>
                <Spinner
                  animation='border'
                  size='sm'
                  className={Style.spinner}
                />
                <span className='ms-2'>Loading more...</span>
              </Col>
            )}
            {!hasMore && ingredients.length > 0 && (
              <Col xs={12} className='text-center my-3'>
                <span className={Style.noMoreItemsText}>
                  No more items to load
                </span>
              </Col>
            )}
            <div className={Style.scrollFadeBottom}></div>
          </Row>
        </Modal.Body>
      </Modal>

      <Modal
        show={showGoalsModal}
        onHide={() => setShowGoalsModal(false)}
        backdrop='static'
        keyboard={false}
        className={Style.fadeInModal}
        centered
      >
        <Modal.Header className={Style.modalHeader}>
          <Modal.Title className={Style.modalTitle}>
            <div className={Style.modalIconWrapper}>
              <FaEdit className={Style.modalIcon} />
            </div>
            Edit Nutrition Goals
          </Modal.Title>
          <Button
            variant='link'
            className={Style.modalCloseButton}
            onClick={() => setShowGoalsModal(false)}
            aria-label='Close'
          >
            <span aria-hidden='true'>&times;</span>
          </Button>
        </Modal.Header>

        <Modal.Body className={Style.modalBody}>
          {goalUpdateError && (
            <Alert variant='danger' className='mb-3'>
              {goalUpdateError}
            </Alert>
          )}
          {goalUpdateSuccess && (
            <Alert variant='success' className='mb-3'>
              Goals updated successfully!
            </Alert>
          )}

          <Form>
            <Form.Group className='mb-3'>
              <Form.Label>
                <FaFire className={Style.formLabelIcon} /> Daily Calories (kcal)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetCalories'
                value={editGoals.targetCalories}
                onChange={handleGoalInputChange}
                min='0'
                placeholder='Daily calorie goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaDrumstickBite className={Style.formLabelIcon} /> Protein (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetProtein'
                value={editGoals.targetProtein}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily protein goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaBreadSlice className={Style.formLabelIcon} /> Carbohydrates
                (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetCarbs'
                value={editGoals.targetCarbs}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily carbohydrates goal'
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>
                <FaBacon className={Style.formLabelIcon} /> Fats (g)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetFats'
                value={editGoals.targetFats}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Daily fats goal'
              />
            </Form.Group>

            <Form.Group className='mb-4'>
              <Form.Label>
                <FaWeight className={Style.formLabelIcon} /> Target Weight (kg)
              </Form.Label>
              <Form.Control
                type='number'
                name='targetWeight'
                value={editGoals.targetWeight}
                onChange={handleGoalInputChange}
                min='0'
                step='0.1'
                placeholder='Target weight'
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowGoalsModal(false)}
            disabled={goalUpdateLoading}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSaveGoals}
            disabled={goalUpdateLoading}
          >
            {goalUpdateLoading ? (
              <>
                <Spinner animation='border' size='sm' className='me-2' />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Container
        fluid
        className={`${Style.Screen}`}
        style={{ padding: "5vh", overflow: "auto", zIndex: "1" }}
      >
        {renderError(error)}
        <Row className='header-row align-items-center mb-4'>
          <Col xs={12} md={6} className='mb-3 mb-md-0'>
            <h2
              style={{ color: "var(--color-primary)" }}
              className={Style.welcomeText}
            >
              Welcome, {currentUser?.username || "User"}
            </h2>
          </Col>
          <Col
            xs={12}
            md={6}
            className='d-flex flex-wrap justify-content-md-end justify-content-center align-items-center'
          >
            <div className={`${Style.dateDisplayContainer} me-2 mb-2 mb-md-0`}>
              <p className={Style.dateDisplay}>
                {new Date().toString().slice(0, 15)}
              </p>
            </div>
            <Button
              variant='outline-danger'
              onClick={handleLogout}
              className={Style.logoutBtn}
              size='sm'
            >
              <FaSignOutAlt className={`${Style.btnIcon} me-1`} />
              <span className='d-none d-sm-inline'>Logout</span>
            </Button>
          </Col>
        </Row>
        <Row className='g-3'>
          <Col
            md={12}
            lg={4}
            className='d-flex flex-column align-items-center justify-content-center'
          >
            <Card
              className={Style.goalsCard}
              ref={cardRef}
            >
              <div className={Style.cardDecoration}>
                <div className={Style.circle1}></div>
                <div className={Style.circle2}></div>
                <div className={Style.circle3}></div>
              </div>

              <div className={Style.goalsHeader} ref={headerRef}>
                <h4>
                  <div className={Style.headerIcon}>
                    <FaFire className={Style.fireIcon} />
                  </div>
                  Nutrition Goals
                </h4>
                <p className='mb-0'>
                  <span style={{ fontWeight: "bolder" }}>{Goal}</span>
                </p>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[0] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.caloriesIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaFire className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaFire className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Daily Calories</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.caloriesColor}`}>
                      {caloriesGoal}{" "}
                      <span className={Style.unitLabel}>kcal</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[0] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.calories / caloriesGoal) * 100
                      )}%`,
                      backgroundColor: "var(--calories-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round((dailyTotals.calories / caloriesGoal) * 100)
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.calories.toFixed(0)} / {caloriesGoal}
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p
                    className={`${Style.remainingValue} ${Style.caloriesColor}`}
                  >
                    {caloriesLeft > 0 ? caloriesLeft : 0}{" "}
                    <span className={Style.unitLabel}>kcal</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[1] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.proteinIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaDrumstickBite className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaDrumstickBite className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Protein</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.proteinColor}`}>
                      {userGoals.targetProtein}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[1] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.protein / (userGoals.targetProtein || 1)) *
                          100
                      )}%`,
                      backgroundColor: "var(--protein-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.protein / (userGoals.targetProtein || 1)) *
                          100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.protein.toFixed(1)} / {userGoals.targetProtein}
                    g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p
                    className={`${Style.remainingValue} ${Style.proteinColor}`}
                  >
                    {userGoals.targetProtein - dailyTotals.protein > 0
                      ? (userGoals.targetProtein - dailyTotals.protein).toFixed(
                          1
                        )
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[2] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.carbsIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaBreadSlice className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaBreadSlice className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Carbohydrates</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.carbsColor}`}>
                      {userGoals.targetCarbs}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[2] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.carbs / (userGoals.targetCarbs || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--carbs-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.carbs / (userGoals.targetCarbs || 1)) * 100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.carbs.toFixed(1)} / {userGoals.targetCarbs}g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p className={`${Style.remainingValue} ${Style.carbsColor}`}>
                    {userGoals.targetCarbs - dailyTotals.carbs > 0
                      ? (userGoals.targetCarbs - dailyTotals.carbs).toFixed(1)
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div
                className={Style.goalRow}
                ref={(el) => (goalRowRefs.current[3] = el)}
              >
                <div className={Style.goalHeader}>
                  <div className={Style.goalLabelWrapper}>
                    <div
                      className={`${Style.goalIconWrapper} ${Style.fatsIconWrapper}`}
                    >
                      <div className={Style.goalIcon3D}>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceFront}`}
                        >
                          <FaBacon className={Style.goalIcon} />
                        </div>
                        <div
                          className={`${Style.iconFace} ${Style.iconFaceBack}`}
                        >
                          <FaBacon className={Style.goalIcon} />
                        </div>
                      </div>
                    </div>
                    <p className={Style.goalLabel}>Fats</p>
                  </div>
                  <div className={Style.valueDisplay3D}>
                    <p className={`${Style.goalValue} ${Style.fatsColor}`}>
                      {userGoals.targetFats}
                      <span className={Style.unitLabel}>g</span>
                    </p>
                  </div>
                </div>

                <div
                  className={Style.progressBar3D}
                  ref={(el) => (progressBarRefs.current[3] = el)}
                >
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyTotals.fats / (userGoals.targetFats || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--fats-color)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    {Math.min(
                      100,
                      Math.round(
                        (dailyTotals.fats / (userGoals.targetFats || 1)) * 100
                      )
                    )}
                    %
                  </span>
                  <span className={Style.progressCurrent}>
                    {dailyTotals.fats.toFixed(1)} / {userGoals.targetFats}g
                  </span>
                </div>

                <div className={Style.remainingSection}>
                  <p className={Style.remainingLabel}>Remaining Today</p>
                  <p className={`${Style.remainingValue} ${Style.fatsColor}`}>
                    {userGoals.targetFats - dailyTotals.fats > 0
                      ? (userGoals.targetFats - dailyTotals.fats).toFixed(1)
                      : 0}
                    <span className={Style.unitLabel}>g</span>
                  </p>
                </div>

                <div className={Style.goalProgress}></div>
              </div>

              <div className={Style.targetGoal}>
                <div className={Style.targetGoalHeader}>
                  <div
                    className={`${Style.goalIconWrapper} ${Style.weightIconWrapper}`}
                  >
                    <div className={Style.goalIcon3D}>
                      <div
                        className={`${Style.iconFace} ${Style.iconFaceFront}`}
                      >
                        <FaWeight className={Style.goalIcon} />
                      </div>
                      <div
                        className={`${Style.iconFace} ${Style.iconFaceBack}`}
                      >
                        <FaWeight className={Style.goalIcon} />
                      </div>
                    </div>
                  </div>
                  <p className={Style.targetGoalTitle}>Weight Goal</p>
                </div>

                <div className={Style.targetGoalValue}>
                  {userGoals.targetWeight}kg
                </div>

                <div className={Style.progressBar3D}>
                  <div
                    className={Style.progressFill3D}
                    style={{
                      width: `${Math.min(
                        100,
                        (CurrentWeight / (userGoals.targetWeight || 1)) * 100
                      )}%`,
                      backgroundColor: "var(--weight-color, #9966ff)",
                    }}
                  ></div>
                </div>

                <div className={Style.progressInfo}>
                  <span className={Style.progressPercent}>
                    Current: {CurrentWeight}kg
                  </span>
                  <span className={Style.progressCurrent}>
                    {userGoals.targetWeight > CurrentWeight ? "Gain" : "Lose"}:{" "}
                    {Math.abs(userGoals.targetWeight - CurrentWeight).toFixed(
                      1
                    )}
                    kg
                  </span>
                </div>

                <div
                  className={Style.decorativeSphere + " " + Style.sphere1}
                ></div>
                <div
                  className={Style.decorativeSphere + " " + Style.sphere2}
                ></div>
              </div>

              <div className={Style.editGoalsBtnContainer}>
                <Button
                  variant='outline-primary'
                  size='sm'
                  className={Style.editGoalsBtn}
                  onClick={handleShowGoalsModal}
                >
                  <FaEdit className={Style.btnIcon} /> Edit Nutrition Goals
                </Button>
              </div>

              <div className={Style.cardDecoration}>
                <div className={Style.circle1}></div>
                <div className={Style.circle2}></div>
                <div className={Style.circle3}></div>
              </div>
            </Card>
            <div className="d-flex flex-column gap-2 mt-3 mb-3" style={{ width: "100%" }}>
              <Button
                className={Style.addButton}
                style={{ width: "100%" }}
                onClick={() => setShow(true)}
              >
                <FaPlus className={Style.btnIcon} /> Add Ingredients
              </Button>
              <Button
                variant="outline-primary"
                className={Style.subscribeButton}
                style={{ width: "100%" }}
                onClick={handleShowDietitianModal}
              >
                <FaUserMd className={Style.btnIcon} /> Subscribe to Dietitian
              </Button>
            </div>
          </Col>
          <Col md={12} lg={8}>
            <NutritionCard
              title='Calories'
              dataKey='calories'
              color='#8884d8'
              unit='kcal'
              foodEntriesChanged={foodEntriesChanged}
            />
          </Col>
        </Row>

        <Row className='mt-4'>
          <Card
            className={Style.addedIngredientsCard}
            style={{ padding: 0 }}
            onMouseMove={handleIngredientsCardMouseMove}
            onMouseLeave={handleIngredientsCardMouseLeave}
            ref={addedIngredientsCardRef}
          >
            <div className={Style.cursorLight}></div>
            <div className={Style.addedIngredientsHeader}>
              <div className={Style.addedIngredientsTitleWrapper}>
                <FaList className={Style.addedIngredientsIcon} />
                <h5 className={Style.addedIngredientsTitle}>
                  Added Ingredients
                </h5>
              </div>
            </div>
            <div
              className={`${Style.addedIngredientsContainer} ${Style.smoothScroll}`}
              onScroll={handleAddedIngredientsScroll}
              ref={addedIngredientsContainerRef}
              onMouseMove={handleAddedIngredientsMouseMove}
            >
              <div className={Style.scrollFadeTop}></div>
              {displayedAddedIngredients.length > 0 ? (
                displayedAddedIngredients.map((item) => (
                  <div
                    key={item.id}
                    className={`${Style.ingredientItem} ${
                      item.isNew ? Style.new : ""
                    }`}
                    onMouseMove={handleIngredientItemMouseMove}
                    onMouseLeave={handleIngredientItemMouseLeave}
                    data-item-id={item.id}
                  >
                    <div className={Style.ingredientItemBg}></div>
                    <div className={Style.ingredientDetails}>
                      <div className={Style.ingredientName}>{item.name}</div>
                      <div className={Style.ingredientMeta}>
                        <FaUtensils
                          style={{ marginRight: "5px", fontSize: "0.7rem" }}
                        />
                        {item.grams}g
                        <FaCalendarAlt
                          style={{
                            marginLeft: "10px",
                            marginRight: "5px",
                            fontSize: "0.7rem",
                          }}
                        />
                        {item.timestamp}
                      </div>
                      <div className={Style.ingredientNutrition}>
                        <span
                          className={`${Style.nutritionBadge} ${Style.caloriesBadge}`}
                        >
                          <FaBolt className={Style.nutritionIcon} />
                          {item.calories.toFixed(1)} kcal
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.proteinBadge}`}
                        >
                          <FaDrumstickBite className={Style.nutritionIcon} />
                          {item.protein.toFixed(1)}g
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.carbsBadge}`}
                        >
                          <FaBreadSlice className={Style.nutritionIcon} />
                          {item.carbs.toFixed(1)}g
                        </span>
                        <span
                          className={`${Style.nutritionBadge} ${Style.fatsBadge}`}
                        >
                          <FaBacon className={Style.nutritionIcon} />
                          {item.fat.toFixed(1)}g
                        </span>
                      </div>
                    </div>
                    <div className={Style.ingredientActions}>
                      <button
                        className={Style.deleteButton}
                        onClick={() => handleDeleteIngredient(item.id)}
                      >
                        <FaTrashAlt className={Style.deleteIcon} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={Style.emptyMessage}>
                  <FaAppleAlt className={Style.emptyIcon} />
                  <p>No ingredients added yet.</p>
                </div>
              )}
              {hasMoreAddedIngredients && addedIngredients.length > 0 && (
                <div className={Style.loadingAnim}>
                  <div className={Style.loadingDots}>
                    <div className={Style.loadingDot}></div>
                    <div className={Style.loadingDot}></div>
                    <div className={Style.loadingDot}></div>
                  </div>
                  <span className={Style.noMoreItemsText}>
                    Scroll for more...
                  </span>
                </div>
              )}
              <div className={Style.scrollFadeBottom}></div>
            </div>
          </Card>
        </Row>
      </Container>

      <Modal
        size="lg"
        show={showDietitianModal}
        onHide={() => setShowDietitianModal(false)}
        backdrop="static"
        keyboard={false}
        className={Style.fadeInModal}
      >
        <Modal.Header className={Style.modalHeader}>
          <Modal.Title className={Style.modalTitle}>
            <div className={Style.modalIconWrapper}>
              <FaUserMd className={Style.modalIcon} />
            </div>
            Subscribe to Dietitian
          </Modal.Title>
          <Button
            variant="link"
            className={Style.modalCloseButton}
            onClick={() => setShowDietitianModal(false)}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </Button>
        </Modal.Header>

        <Modal.Body className={Style.modalBody}>
          {dietitianError && (
            <Alert variant="danger" className="mb-3">
              {dietitianError}
            </Alert>
          )}
          
          {subscribeSuccess && (
            <Alert variant="success" className="mb-3">
              Successfully subscribed to dietitian!
            </Alert>
          )}
          
          <Form.Control
            type="text"
            placeholder="Search dietitians..."
            className={`mb-3 ${Style.searchInput}`}
            value={dietitianSearchTerm}
            onChange={(e) => setDietitianSearchTerm(e.target.value)}
            disabled={loadingDietitians}
          />
          
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loadingDietitians && (
              <Spinner animation="border" className={Style.spinner} />
            )}
          </div>
          
          {!loadingDietitians && dietitians.length === 0 && (
            <div className={Style.emptyMessage}>
              <FaUserMd className={Style.emptyIcon} />
              <p>No dietitians available.</p>
            </div>
          )}
          
          {!loadingDietitians && dietitians.length > 0 && (
            <div className={Style.dietitianList}>
              {dietitians
                .filter(dietitian => 
                  dietitian.fullName.toLowerCase().includes(dietitianSearchTerm.toLowerCase()) ||
                  dietitian.username.toLowerCase().includes(dietitianSearchTerm.toLowerCase())
                )
                .map((dietitian) => (
                  <Card key={dietitian.id} className={Style.dietitianCard}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className={Style.dietitianName}>{dietitian.fullName}</h5>
                          <p className={Style.dietitianUsername}>@{dietitian.username}</p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSubscribeToDietitian(dietitian.id)}
                          disabled={loadingDietitians}
                        >
                          Subscribe
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDietitianModal(false)}
            disabled={loadingDietitians}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default Standard;
