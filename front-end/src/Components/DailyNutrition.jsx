import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { foodEntryAPI } from "../API/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.scale.linear = LinearScale;

const DailyNutrition = () => {
  const [nutrition, setNutrition] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const chartRef = useRef(null);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (history.length > 0) {
      setChartKey((prev) => prev + 1);
    }
  }, [history]);

  const fetchDailyNutrition = async () => {
    try {
      const data = await foodEntryAPI.getDailyNutrition(date);
      setNutrition(data);
    } catch (err) {
      setError("Failed to fetch daily nutrition");
      console.error("Error fetching daily nutrition:", err);
    }
  };

  const fetchNutritionHistory = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const data = await foodEntryAPI.getNutritionHistory(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      setHistory(data);
    } catch (err) {
      setError("Failed to fetch nutrition history");
      console.error("Error fetching nutrition history:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDailyNutrition(), fetchNutritionHistory()])
      .catch((err) => {
        setError("Failed to fetch nutrition data");
        console.error("Error fetching nutrition data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [date]);
  const chartData = {
    labels: history.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: "Calories",
        data: history.map((entry) => entry.calories),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Goal",
        data: history.map((entry) => entry.goal),
        borderColor: "rgb(255, 99, 132)",
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Calorie Intake vs Goal (Last 7 Days)",
      },
    },
    scales: {
      y: {
        type: "linear",
        beginAtZero: true,
        title: {
          display: true,
          text: "Calories",
        },
        ticks: {
          callback: (value) => `${value} kcal`,
        },
      },
    },
  };

  if (loading) {
    return <div>Loading nutrition data...</div>;
  }

  if (error) {
    return <div className='text-red-500'>{error}</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Date Selector */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Select Date
        </label>
        <input
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </div>

      {/* Daily Summary */}
      {nutrition && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-700'>Calories</h3>
            <p className='text-2xl font-bold text-blue-600'>
              {Math.round(nutrition.calories)} / {nutrition.goal}
            </p>
            <p className='text-sm text-gray-500'>
              {Math.round((nutrition.calories / nutrition.goal) * 100)}% of goal
            </p>
          </div>

          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-700'>Protein</h3>
            <p className='text-2xl font-bold text-green-600'>
              {Math.round(nutrition.protein)}g
            </p>
          </div>

          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-700'>Carbs</h3>
            <p className='text-2xl font-bold text-yellow-600'>
              {Math.round(nutrition.carbs)}g
            </p>
          </div>

          <div className='bg-white p-4 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-700'>Fat</h3>
            <p className='text-2xl font-bold text-red-600'>
              {Math.round(nutrition.fat)}g
            </p>
          </div>
        </div>
      )}

      {/* Nutrition History Chart */}
      <div className='bg-white p-4 rounded-lg shadow'>
        <Line
          key={chartKey}
          data={chartData}
          options={chartOptions}
          ref={chartRef}
        />
      </div>
    </div>
  );
};

export default DailyNutrition;
