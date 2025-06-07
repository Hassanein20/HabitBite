import React, { useState } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Style from "./MenuSec.module.css";
import CircleChart from "../CircleChart/CircleChart";

const MenuSec = () => {
  const [chartData] = useState([
    { value: 13, color: "#ff6384", label: "Protein" },
    { value: 74.7, color: "#36a2eb", label: "Carbs" },
    { value: 1.51, color: "#ffce56", label: "Fats" },
  ]);

  return (
    <Container fluid className={`${Style.Screen}`}>
      <Row className={` justify-content-center`}>
        <h2
          className={`d-inline-block`}
          style={{
            width: "auto",
            marginTop: "2vh",
            color: "var(--color-primary)",
            borderBottom: "solid var(--color-secondary) 2px",
          }}
        >
          Menu
        </h2>
      </Row>
      <Row>
        <Col className={`${Style.Statistics}`}>
          <Card
            className='shadow d-flex align-items-center justify-content-center'
            style={{
              width: "auto",
              height: "auto",
              margin: "2vw",
              padding: "2vh",
              backgroundColor: "var(--color-card)",
              border: "0",
            }}
          >
            <h6 style={{ color: "var(--color-primary)" }}>Dry Pasta</h6>
            <CircleChart
              data={chartData}
              thickness={5}
              gapSize={8}
              grams={100}
              onGramsChange={100}
            />
          </Card>
        </Col>
        <Col>
          <p style={{ color: "var(--color-secondary)", fontWeight: "bold" }}>
            Explore nutritional intelligence at scale - from a single almond to
            complex recipes. Our ingredient analysis card transform 10,000+ food
            data points into actionable kitchen wisdom, helping professionals
            and home cooks alike make informed dietary decisions through
            beautiful data visualization.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default MenuSec;
