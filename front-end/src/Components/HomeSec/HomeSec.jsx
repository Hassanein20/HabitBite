import React from "react";
import { Button, Container, Row } from "react-bootstrap";
import style from "./HomeSec.module.css";
import { Link } from "react-router-dom";

const HomeSec = () => {
  return (
    <>
      <Container
        fluid
        className={`${style.Home}`}
        style={{ overflow: "auto", scrollbarWidth: "none", paddingTop: "8vh" }}
      >
        <Row>
          <div
            className={`justify-content-start ${style.Content}`}
            style={{
              marginTop: "7vh",
              marginLeft: "3vw",
            }}
          >
            <h6
              style={{
                color: "var(--color-primary)",
              }}
            >
              Your Journey to Better Health Starts Here
            </h6>
            <h2
              style={{
                color: "var(--color-secondary)",
                padding: "2vh",
                fontFamily: "DM Serif Display, serif",
              }}
            >
              Track Smarter. Eat Better. Acheive Your Goals.
            </h2>
            <p
              style={{
                color: "var(--color-white)",
                paddingLeft: "2vw",
              }}
            >
              Whether you're aiming to lose weight, build muscles, our platform calculates your exact
              calorie needs and simplifies tracking with instant micronutrient
              insights. Log meals effortlessly, visualize progress with daily
              graphs, and get personalized advice from certified dietitians.
              Start today - your goals are just a click away.
            </p>
          </div>
        </Row>
        <Button
          className='button'
          style={{ marginTop: "5vh", marginLeft: "5vw", marginBottom: "2vh" }}
          as={Link}
          to='/SignUp/GettingInfo'
        >
          Lets Start!
        </Button>
      </Container>
    </>
  );
};

export default HomeSec;
