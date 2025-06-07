import React, { useState, useEffect } from "react";
import { foodEntryAPI, fetchCSRFToken } from "../API/api";
import { CSRF } from "../utils/csrf";
import { useAuth } from "../Context/AuthContext";

const AddFoodEntry = ({ onEntryAdded }) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const searchFoods = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=YOUR_API_KEY&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (err) {
      setError("Failed to search foods");
      console.error("Error searching foods:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setSearchResults([]);
    setSearchQuery(food.description);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFood) return;

    setLoading(true);
    setError(null);

    try {
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        await fetchCSRFToken();
      }

      const proteinPer100g =
        selectedFood.foodNutrients.find((n) => n.nutrientName === "Protein")
          ?.value || 0;
      const carbsPer100g =
        selectedFood.foodNutrients.find(
          (n) => n.nutrientName === "Carbohydrate, by difference"
        )?.value || 0;
      const fatsPer100g =
        selectedFood.foodNutrients.find(
          (n) => n.nutrientName === "Total lipid (fat)"
        )?.value || 0;

      const protein = (proteinPer100g * amount) / 100;
      const carbs = (carbsPer100g * amount) / 100;
      const fats = (fatsPer100g * amount) / 100;
      const calories = protein * 4 + carbs * 4 + fats * 9;

      const foodEntry = {
        foodId: selectedFood.fdcId,
        name: selectedFood.description,
        amount: parseFloat(amount),
        date: new Date().toISOString().split("T")[0],
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fats,
      };


      const response = await foodEntryAPI.addFoodEntry(foodEntry);
      onEntryAdded(response);

      setSelectedFood(null);
      setSearchQuery("");
      setAmount(100);
    } catch (err) {
      setError("Failed to add food entry");
      console.error("Error adding food entry:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-2xl font-semibold mb-4'>Add Food Entry</h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Search Food
          </label>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchFoods(e.target.value);
            }}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Search USDA food database...'
          />

          {searchResults.length > 0 && (
            <div className='mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md'>
              {searchResults.map((food) => (
                <div
                  key={food.fdcId}
                  onClick={() => handleFoodSelect(food)}
                  className='px-3 py-2 hover:bg-gray-100 cursor-pointer'
                >
                  {food.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Amount (g)
          </label>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min='1'
            step='1'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        {error && <div className='text-red-500 text-sm'>{error}</div>}

        <button
          type='submit'
          disabled={!selectedFood || loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !selectedFood || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Adding..." : "Add Food Entry"}
        </button>
      </form>
    </div>
  );
};

export default AddFoodEntry;
