import React, { useState, useEffect } from "react";
import { foodEntryAPI, fetchCSRFToken } from "../API/api";
import { CSRF } from "../utils/csrf";

const FoodEntryList = ({ date, onEntryDeleted }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchEntries = async () => {
    try {
      const data = await foodEntryAPI.getDailyEntries(date);
      setEntries(data);
    } catch (err) {
      setError("Failed to fetch food entries");
      console.error("Error fetching food entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchEntries();
  }, [date]);

  const handleDelete = async (entryId) => {
    try {
      const csrfToken = CSRF.getToken();
      if (!csrfToken) {
        await fetchCSRFToken();
      }
      await foodEntryAPI.deleteFoodEntry(entryId);
      setEntries(entries.filter((entry) => entry.id !== entryId));
      if (onEntryDeleted) {
        onEntryDeleted();
      }
    } catch (err) {
      setError("Failed to delete food entry");
      console.error("Error deleting food entry:", err);
    }
  };

  if (loading) {
    return <div>Loading food entries...</div>;
  }

  if (error) {
    return <div className='text-red-500'>{error}</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white p-4 rounded-lg shadow'>
        <h3 className='text-lg font-semibold mb-4'>Food Entries</h3>

        {entries.length > 0 ? (
          <div className='space-y-4'>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div>
                  <h4 className='font-medium'>{entry.name}</h4>
                  <p className='text-sm text-gray-600'>
                    {entry.amount}g • {Math.round(entry.calories)} calories
                  </p>
                  <p className='text-xs text-gray-500'>
                    P: {Math.round(entry.protein)}g • C:{" "}
                    {Math.round(entry.carbs)}g • F: {Math.round(entry.fat)}g
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(entry.id)}
                  className='text-red-500 hover:text-red-700'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-500 text-sm'>No food entries for this date</p>
        )}
      </div>
    </div>
  );
};

export default FoodEntryList;
