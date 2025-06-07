import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { ReactComponent as Microsvg } from "../../Assets/Illustrations/Dietmeasure.svg";

const AboutSec = () => {
  return (
    <Container
      style={{
        backgroundColor: "var(--color-bf)",
        overflow: "auto",
        height: "calc(100vh)",
        paddingTop: "80px",
      }}
    >
      <Row>
        <Col className={`col-lg-7`}>
          <h6
            style={{
              color: "var(--color-primary)",
              fontWeight: "bolder",
              borderBottom: "solid var(--color-secondary) 2px",
              marginBottom: "5vh",
            }}
            className='d-inline-block'
          >
            About Us
          </h6>
          <h2
            style={{ color: "var(--color-secondary)", marginBottom: "2.5vh" }}
          >
            Where Science Meets Support
          </h2>
          <p>
            We're more than a calorie tracker, we're your nutrition ally.
            Combining cutting-edge tech with expert dietitian guidance, we
            empower you to make informed choices, one meal at a time. Whether
            you're a busy parent, an athlete, or simply curious about micros,
            we're here to turn confusion into clarity and goals into achievments
          </p>
          <p>
            At HabitBite, we believe sustainable health is a team effort. That's
            why we've built a space where users and dietitians callaborate
            seamlessly, sharing insights, celebrating milestones, and refning
            strategies. Join a community where progress is personal, support is
            instant, and every bite brings you closer to your best{" "}
            <span style={{ color: "var(--color-secondary)" }}>self</span>.
          </p>
        </Col>
        <Col
          className={`col-lg-5 d-flex align-items-center justify-content-center`}
        >
          <Microsvg style={{ width: "30vw" }} />
        </Col>
      </Row>
    </Container>
  );
};

export default AboutSec;
