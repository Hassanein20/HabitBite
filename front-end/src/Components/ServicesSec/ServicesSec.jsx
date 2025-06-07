import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import style from "./ServicesSec.module.css";
import Tracking from "../../Assets/Tracking.png";

const ServicesSec = () => {
  return (
    <>
      <Container
        fluid
        className={`${style.Screen}`}
        style={{ overflow: "auto"}}
      >
        <Row className='justify-content-end'>
          <div className={`${style.Content}`}>
            <h6
              style={{
                color: "var(--color-primary)",
                fontWeight: "bolder",
                borderBottom: "solid var(--color-secondary) 2px",
                marginBottom: "2vh",
              }}
              className='d-inline-block'
            >
              Our Services
            </h6>
          </div>
        </Row>
        <Row className='justify-content-end'>
          <div className={`${style.Content}`}>
            <h3 style={{ color: "var(--color-secondary)" }}>
              Tools Designed for Your Success
            </h3>
          </div>
        </Row>
        <Row>
          <Col className={`d-flex justify-content-end ${style.column}`}>
            <img src={Tracking} alt='Traking' style={{ width: "15vw" }} />
          </Col>
          <Col className={`d-flex justify-content-center align-items-center`}>
            <p style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
              Your Goals, Your Body, Your Plan - Calculated in Seconds.
            </p>
          </Col>
        </Row>
        <Row className='justify-content-end'>
          <p
            className={`${style.Content}`}
            style={{ color: "var(--color-light)" }}
          >
            Get a tailored calorie goal based on your age, weight, activity
            level, and goals (weight loss, muscle gain, maintenance). See your
            daily protein, carb, and fat targets broken down.
          </p>
        </Row>
        <Row className='justify-content-end'>
          <p
            className={`${style.Content}`}
            style={{ color: "var(--color-light)" }}
          >
            Track daily calories, micronutrients, and weight trends with
            interactive graphs.
          </p>
        </Row>
        <Row className='justify-content-end'>
          <p
            className={`${style.Content}`}
            style={{ color: "var(--color-light)" }}
          >
            Log meals in seconds with our 40,000+ food API. No more guesswork!
          </p>
        </Row>
      </Container>
    </>
  );
};

export default ServicesSec;
