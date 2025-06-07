import { React, useState } from "react";
import { Card, Button } from "react-bootstrap";
import CircleChart from "../CircleChart/CircleChart";

const ICard = ({ title, chartData, onAdd }) => {
  const [grams, setGrams] = useState(100);
  return (
    <Card
      className='shadow d-flex align-items-center justify-content-center Icard'
      style={{
        margin: "2vw",
        padding: "2vh",
        backgroundColor: "var(--color-card)",
        border: "0",
      }}
    >
      <h6 style={{ color: "var(--color-primary)" }}>{title}</h6>
      <CircleChart
        data={chartData}
        thickness={5}
        gapSize={8}
        grams={grams}
        onGramsChange={setGrams}
      />
      <Button className='button' onClick={() => onAdd(grams)}>
        Add
      </Button>
    </Card>
  );
};

export default ICard;
