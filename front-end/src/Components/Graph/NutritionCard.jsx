import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, Spinner, Alert, Button } from "react-bootstrap";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Line,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
  Tooltip,
} from "recharts";
import { foodEntryAPI } from "../../API/api";
import { useAuth } from "../../Context/AuthContext";
import "./NutritionGraph.css"; 
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const NutritionCard = ({ title, dataKey, color, unit, foodEntriesChanged }) => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animationActive, setAnimationActive] = useState(true);
  const chartRef = useRef(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [hasNextWeek, setHasNextWeek] = useState(false);

  const [calorieDomain, setCalorieDomain] = useState([0, "auto"]);
  const [macroDomain, setMacroDomain] = useState([0, "auto"]);

  const processNutritionData = useCallback(
    (history, todayData) => {
      if (
        (!history || !Array.isArray(history) || history.length === 0) &&
        !todayData
      ) {
        console.log(
          "No history data or today's data, returning empty week data"
        );
        return getEmptyWeekData();
      }

      if (
        (!history || !Array.isArray(history) || history.length === 0) &&
        todayData
      ) {
        console.log("Only have today's data, creating minimal history");
        const today = new Date();
        history = [
          {
            date: today.toISOString(),
            total_calories: todayData.total_calories,
            total_protein: todayData.total_protein,
            total_carbs: todayData.total_carbs,
            total_fats: todayData.total_fats,
          },
        ];
      }

      try {
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
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const todayDayOfWeek = today.toLocaleDateString("en-US", {
          weekday: "long",
        });
        const todayDayIndex = dayOrder.indexOf(todayDayOfWeek);

        const isCurrentWeek = weekOffset === 0;

        if (todayData) {
          const calories = Number(todayData.total_calories || 0);
          const protein = Number(todayData.total_protein || 0);
          const carbs = Number(todayData.total_carbs || 0);
          const fats = Number(todayData.total_fats || 0);

          console.log("Adding today's data to graph:", {
            day: todayDayOfWeek,
            calories,
            protein,
            carbs,
            fats,
            isToday: true,
          });

          processedDates.set(todayDayOfWeek, {
            day: todayDayOfWeek,
            calories: calories,
            protein: protein,
            carbs: carbs,
            fats: fats,
            isToday: true, 
            entries: todayData.entry_count || 0,
          });
        }

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
            const dayIndex = dayOrder.indexOf(dayOfWeek);

            const dateStr = date.toISOString().split("T")[0];
            const currentDate = new Date();
            const entryDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const isToday = entryDateStr === currentDateStr;
            
            if (isToday) {
              console.log("Found today's data in history:", entry);
            }

            if (isToday && todayData) {
              return;
            }

            if (isCurrentWeek && dayIndex > todayDayIndex) {
              return;
            }

            const existingData = processedDates.get(dayOfWeek);

            const newData = {
              day: dayOfWeek,
              calories: Number(entry.total_calories || 0),
              protein: Number(entry.total_protein || 0),
              carbs: Number(entry.total_carbs || 0),
              fats: Number(entry.total_fats || 0),
              isToday: isToday, 
              entries: entry.entry_count || 0,
            };

            if (!existingData || isToday) {
              processedDates.set(dayOfWeek, newData);
            }
          } catch (err) {
            console.error("Error processing history entry:", err, entry);
          }
        });

        const formattedData = [];
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
              isToday: day === todayDayOfWeek,
              entries: 0, 
            });
          }
        });

        formattedData.sort(
          (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );

        if (isCurrentWeek) {
          formattedData.forEach((dayData, index) => {
            if (index > todayDayIndex) {
              dayData.calories = 0;
              dayData.protein = 0;
              dayData.carbs = 0;
              dayData.fats = 0;
              dayData.entries = 0;
            }
          });
        }

        return formattedData;
      } catch (err) {
        console.error("Error processing nutrition data:", err);
        return getEmptyWeekData();
      }
    },
    [weekOffset]
  );

  const getEmptyWeekData = useCallback(() => {
    const today = new Date();
    const todayDayOfWeek = today.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return [
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
      isToday: day === todayDayOfWeek,
      entries: 0, 
    }));
  }, []);

  const fetchNutritionHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const endDate = new Date();

      if (weekOffset > 0) {
        const currentDayOfWeek = endDate.getDay(); 
        const daysToSaturday = 6 - currentDayOfWeek;
        endDate.setDate(endDate.getDate() + daysToSaturday);

        endDate.setDate(endDate.getDate() - weekOffset * 7);
      }

      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log("Today's date for nutrition data:", todayStr);
      const isCurrentWeek = weekOffset === 0;
      let todayData = null;
      if (isCurrentWeek) {
        try {
          todayData = await foodEntryAPI.getDailyNutrition(todayStr);
        } catch (todayErr) {
        }
      }
      const history = await foodEntryAPI.getNutritionHistory(
        formattedStartDate,
        formattedEndDate
      );
      if (weekOffset > 0) {
        const nextWeekEndDate = new Date(endDate);
        nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 7);

        const nextWeekStartDate = new Date(nextWeekEndDate);
        nextWeekStartDate.setDate(nextWeekEndDate.getDate() - 6);

        const formattedNextWeekStartDate = nextWeekStartDate
          .toISOString()
          .split("T")[0];
        const formattedNextWeekEndDate = nextWeekEndDate
          .toISOString()
          .split("T")[0];

        try {
          const nextWeekHistory = await foodEntryAPI.getNutritionHistory(
            formattedNextWeekStartDate,
            formattedNextWeekEndDate
          );
          setHasNextWeek(
            nextWeekHistory &&
              Array.isArray(nextWeekHistory) &&
              nextWeekHistory.length > 0
          );
        } catch (err) {
          console.error("Error checking next week data:", err);
          setHasNextWeek(false);
        }
      } else {
        setHasNextWeek(false);
      }

      const processedData = processNutritionData(history, todayData);

      if (processedData && processedData.length > 0) {
        const maxCalories = Math.max(
          ...processedData.map((item) => item.calories || 0)
        );
        const maxProtein = Math.max(
          ...processedData.map((item) => item.protein || 0)
        );
        const maxCarbs = Math.max(
          ...processedData.map((item) => item.carbs || 0)
        );
        const maxFats = Math.max(
          ...processedData.map((item) => item.fats || 0)
        );

        const maxMacro = Math.max(maxProtein, maxCarbs, maxFats);

        const calorieMax =
          maxCalories > 0 ? Math.ceil(maxCalories * 1.2) : 2000;
        const macroMax = maxMacro > 0 ? Math.ceil(maxMacro * 1.2) : 100;

        setCalorieDomain([0, calorieMax]);
        setMacroDomain([0, macroMax]);

      } else {
        setCalorieDomain([0, 2000]);
        setMacroDomain([0, 100]);
      }

      setData(processedData);
      setLoading(false);

      setAnimationActive(false);
      setTimeout(() => setAnimationActive(true), 50);
    } catch (err) {
      console.error("Error fetching nutrition history:", err);
      setError("Failed to load nutrition data. Please try again later.");
      setLoading(false);
      setData(getEmptyWeekData());
    }
  }, [processNutritionData, getEmptyWeekData, weekOffset]);

  const fetchTodaysNutritionOnly = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayDayOfWeek = today.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const todayNutrition = await foodEntryAPI.getDailyNutrition(todayStr);

      if (todayNutrition) {

        setData((prevData) => {
          const newData = [...prevData];
          const todayIndex = newData.findIndex(
            (item) => item.day === todayDayOfWeek
          );

          if (todayIndex >= 0) {
            newData[todayIndex] = {
              day: todayDayOfWeek,
              calories: Number(todayNutrition.total_calories || 0),
              protein: Number(todayNutrition.total_protein || 0),
              carbs: Number(todayNutrition.total_carbs || 0),
              fats: Number(todayNutrition.total_fats || 0),
              isToday: true,
              entries: todayNutrition.entry_count || 0,
            };
          }

          return newData;
        });

        setAnimationActive(false);
        setTimeout(() => setAnimationActive(true), 50);
      }
    } catch (err) {
      console.error("Error fetching today's nutrition only:", err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNutritionHistory();
    } else {
      setData(getEmptyWeekData());
      setLoading(false);
    }
  }, [currentUser, fetchNutritionHistory, getEmptyWeekData, weekOffset]);

  useEffect(() => {
    fetchTodaysNutritionOnly();
  }, [foodEntriesChanged, currentUser, fetchTodaysNutritionOnly]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (chartRef.current && !loading) {
        chartRef.current.classList.add("chart-pulse");
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.classList.remove("chart-pulse");
          }
        }, 1000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading]);

  const calorieGoal = currentUser?.calorieGoal || 2000;

  const CustomizedDot = () => {
    return null;
  };

  const customTooltipFormatter = (value, name, props) => {
    let displayName;
    let unit;

    switch (name) {
      case "calories":
        displayName = "Calories";
        unit = "kcal";
        break;
      case "protein":
        displayName = "Protein";
        unit = "g";
        break;
      case "carbs":
        displayName = "Carbs";
        unit = "g";
        break;
      case "fats":
        displayName = "Fats";
        unit = "g";
        break;
      default:
        displayName = name;
        unit = "";
    }

    return [`${value} ${unit}`, displayName];
  };

  const renderTooltip = (props) => {
    const { active, payload, label } = props;

    if (active && payload && payload.length) {
      return (
        <div className='custom-tooltip'>
          <p className='tooltip-day'>{label}</p>
          <div className='tooltip-content'>
            {payload.map((entry, index) => (
              <p key={`item-${index}`} style={{ color: entry.color }}>
                <span className='tooltip-label'>
                  {entry.name === "calories"
                    ? "Calories"
                    : entry.name === "protein"
                    ? "Protein"
                    : entry.name === "carbs"
                    ? "Carbs"
                    : entry.name === "fats"
                    ? "Fats"
                    : entry.name}
                  :{" "}
                </span>
                <span className='tooltip-value'>
                  {entry.name === "calories"
                    ? entry.value.toFixed(0)
                    : entry.value.toFixed(1)}
                  {entry.name === "calories" ? " kcal" : "g"}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const calorieGradientId = "calorieGradient";
  const proteinGradientId = "proteinGradient";
  const carbsGradientId = "carbsGradient";
  const fatsGradientId = "fatsGradient";

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleNextWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const getDateRangeString = () => {
    const endDate = new Date();

    if (weekOffset > 0) {
      const currentDayOfWeek = endDate.getDay();
      const daysToSaturday = 6 - currentDayOfWeek;
      endDate.setDate(endDate.getDate() + daysToSaturday);

      endDate.setDate(endDate.getDate() - weekOffset * 7);
    }

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <Card
      className='nutrition-card shadow-lg'
      style={{
        backgroundColor: "var(--color-card)",
        borderRadius: "15px",
        overflow: "hidden",
        border: "none",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
      }}
    >
      <Card.Header
        className='d-flex flex-rows justify-content-between align-items-center'
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "1rem 1.5rem",
        }}
      >
        <div className='nutrition-summary'>
          <h5 className='mb-0 graph-title'>Weekly Nutrition Overview</h5>
          <p className='text-muted mb-0 small'>
            {weekOffset > 0
              ? `Historical data: ${getDateRangeString()}`
              : "Track your daily progress"}
          </p>
        </div>
      </Card.Header>

      <Card.Body className='graph-body'>
        {error && <Alert variant='warning'>{error}</Alert>}
        {loading ? (
          <div
            className='d-flex justify-content-center align-items-center loading-container'
            style={{ height: "400px" }}
          >
            <Spinner animation='border' className='pulsing-spinner' />
          </div>
        ) : (
          <div className='graph-container' ref={chartRef}>
            <div className='chart-glow-effect'></div>
            <ResponsiveContainer
              width='100%'
              height={400}
              className='chart-responsive-container'
            >
              <ComposedChart
                data={data}
                className={animationActive ? "animate-chart" : ""}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <defs>
                  <linearGradient
                    id={calorieGradientId}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#4bc0c0' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#4bc0c0' stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient
                    id={proteinGradientId}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#ff6384' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#ff6384' stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient
                    id={carbsGradientId}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#36a2eb' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#36a2eb' stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient
                    id={fatsGradientId}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#ffce56' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#ffce56' stopOpacity={0.2} />
                  </linearGradient>

                  <linearGradient
                    id='animatedGradient'
                    x1='0'
                    y1='0'
                    x2='1'
                    y2='1'
                  >
                    <stop offset='0%' stopColor='rgba(75, 192, 192, 0.6)'>
                      <animate
                        attributeName='stop-color'
                        values='rgba(75, 192, 192, 0.6); rgba(255, 99, 132, 0.6); rgba(54, 162, 235, 0.6); rgba(255, 206, 86, 0.6); rgba(75, 192, 192, 0.6)'
                        dur='10s'
                        repeatCount='indefinite'
                      />
                    </stop>
                    <stop offset='100%' stopColor='rgba(54, 162, 235, 0.6)'>
                      <animate
                        attributeName='stop-color'
                        values='rgba(54, 162, 235, 0.6); rgba(255, 206, 86, 0.6); rgba(75, 192, 192, 0.6); rgba(255, 99, 132, 0.6); rgba(54, 162, 235, 0.6)'
                        dur='10s'
                        repeatCount='indefinite'
                      />
                    </stop>
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='rgba(255,255,255,0.1)'
                  className='animated-grid'
                />

                <Tooltip
                  content={renderTooltip}
                  formatter={customTooltipFormatter}
                  wrapperClassName='tooltip-wrapper'
                  cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
                />

                <XAxis
                  dataKey='day'
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const isToday =
                      payload.value ===
                      new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                      });

                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor='middle'
                          fill={
                            isToday
                              ? "var(--color-primary)"
                              : "var(--color-text)"
                          }
                          className={isToday ? "today-label" : ""}
                        >
                          {payload.value.substring(0, 3)}
                        </text>
                        {isToday && (
                          <circle
                            cx={0}
                            cy={-5}
                            r={2}
                            fill='var(--color-primary)'
                          />
                        )}
                      </g>
                    );
                  }}
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  dy={10}
                />

                <YAxis
                  yAxisId='left'
                  orientation='left'
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: "var(--color-text)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  label={{
                    value: "Calories",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--color-text)",
                    style: {
                      textAnchor: "middle",
                      fontSize: "12px",
                      fontWeight: "600",
                      fill: "var(--color-text)",
                    },
                  }}
                  padding={{ top: 20, bottom: 20 }}
                  domain={calorieDomain}
                  width={60}
                  allowDataOverflow={false}
                />

                <YAxis
                  yAxisId='right'
                  orientation='right'
                  tickFormatter={(value) => `${value}`}
                  tick={{ fill: "var(--color-text)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  label={{
                    value: "g",
                    angle: -90,
                    position: "insideRight",
                    fill: "var(--color-text)",
                    style: {
                      textAnchor: "middle",
                      fontSize: "12px",
                      fontWeight: "600",
                      fill: "var(--color-text)",
                    },
                  }}
                  padding={{ top: 20, bottom: 20 }}
                  domain={macroDomain}
                  width={40}
                  allowDataOverflow={false}
                />

                <ReferenceLine
                  y={calorieGoal}
                  yAxisId='left'
                  label={{
                    value: "Goal",
                    position: "insideTopRight",
                    fill: "var(--color-text)",
                    fontSize: 12,
                  }}
                  stroke='#4bc0c0'
                  strokeDasharray='5 5'
                  strokeWidth={2}
                  ifOverflow='extendDomain'
                  className='goal-line'
                />

                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  formatter={(value, entry) => {
                    const { color } = entry;
                    let displayName;
                    let unit;

                    switch (value) {
                      case "calories":
                        displayName = "Calories";
                        unit = "kcal";
                        break;
                      case "protein":
                        displayName = "Protein";
                        unit = "g";
                        break;
                      case "carbs":
                        displayName = "Carbs";
                        unit = "g";
                        break;
                      case "fats":
                        displayName = "Fats";
                        unit = "g";
                        break;
                      default:
                        displayName = value;
                        unit = "";
                    }

                    return (
                      <span
                        style={{ color: color, marginRight: "10px" }}
                        className='legend-item'
                      >
                        <span
                          className='legend-dot'
                          style={{ backgroundColor: color }}
                        ></span>
                        {displayName} ({unit})
                      </span>
                    );
                  }}
                  iconSize={0}
                  verticalAlign='bottom'
                />

                <Area
                  yAxisId='left'
                  type='monotone'
                  dataKey='calories'
                  stroke='#4bc0c0'
                  strokeWidth={3}
                  fill={`url(#${calorieGradientId})`}
                  dot={<CustomizedDot />}
                  animationDuration={1500}
                  animationEasing='ease-out'
                  isAnimationActive={animationActive}
                  className='calories-line'
                />

                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='protein'
                  stroke='#ff6384'
                  strokeWidth={2}
                  dot={<CustomizedDot />}
                  animationDuration={1500}
                  animationEasing='ease-out'
                  isAnimationActive={animationActive}
                  className='protein-line'
                />

                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='carbs'
                  stroke='#36a2eb'
                  strokeWidth={2}
                  dot={<CustomizedDot />}
                  animationDuration={1500}
                  animationEasing='ease-out'
                  isAnimationActive={animationActive}
                  className='carbs-line'
                />

                <Line
                  yAxisId='right'
                  type='monotone'
                  dataKey='fats'
                  stroke='#ffce56'
                  strokeWidth={2}
                  dot={<CustomizedDot />}
                  animationDuration={1500}
                  animationEasing='ease-out'
                  isAnimationActive={animationActive}
                  className='fats-line'
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Body>

      <Card.Footer
        className='d-flex justify-content-between align-items-center'
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "0.75rem 1.5rem",
        }}
      >
        <Button
          variant='outline-primary'
          size='sm'
          className='week-nav-btn'
          onClick={handlePreviousWeek}
          disabled={loading}
        >
          <FaChevronLeft className='me-1' /> Previous Week
        </Button>

        <span className='week-indicator'>
          {weekOffset === 0
            ? "Current Week"
            : `${weekOffset} ${weekOffset === 1 ? "Week" : "Weeks"} Ago`}
        </span>

        <Button
          variant='outline-primary'
          size='sm'
          className='week-nav-btn'
          onClick={handleNextWeek}
          disabled={loading || !hasNextWeek || weekOffset === 0}
        >
          Next Week <FaChevronRight className='ms-1' />
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default NutritionCard;
