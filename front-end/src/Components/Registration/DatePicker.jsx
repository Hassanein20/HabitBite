import { Row, Col, Form } from "react-bootstrap";
import { useState, useEffect } from "react";

export const DatePicker = ({ date, error, onDateChange }) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 2015 - 1900 + 1 },
    (_, i) => 1900 + i
  ).reverse();

  const [days, setDays] = useState(Array.from({ length: 31 }, (_, i) => i + 1));

  useEffect(() => {
    if (date.month && date.year) {
      const daysInMonth = new Date(date.year, date.month, 0).getDate();
      setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    }
  }, [date.month, date.year]);

  return (
    <div className='my-4'>
      <Row className='g-2'>
        {["day", "month", "year"].map((field) => (
          <Col key={field} md={4}>
            <Form.Select
              value={date[field]}
              onChange={(e) => onDateChange(field, e.target.value)}
              isInvalid={!!error}
              style={{
                backgroundColor: "var(--color-lighter)",
                color: "var(--color-text)",
              }}
            >
              <option value=''>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </option>
              {(field === "month"
                ? months
                : field === "year"
                ? years
                : days
              ).map((item) => (
                <option
                  key={item}
                  value={field === "month" ? months.indexOf(item) + 1 : item}
                >
                  {field === "month" ? item : item}
                </option>
              ))}
            </Form.Select>
          </Col>
        ))}
      </Row>
      {error && <div className='text-danger mt-2'>{error}</div>}
    </div>
  );
};
