import React from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import Style from "./ContactSec.module.css";
import { FormInput } from "../Registration/FormInput";

const ContactSection = () => {
  return (
    <Container
      fluid
      className={`bg-dark text-white py-4 ${Style.Screen}`}
      style={{ overflow: "auto" }}
    >
      <Container>
        <Row className='justify-content-center'>
          <h3
            className='mb-3 d-inline-block'
            style={{
              width: "auto",
              color: "var(--color-primary",
              borderBottom: "solid var(--color-secondary) 2px",
              paddingTop: "80px",
            }}
          >
            Contact Our Nutrition Team
          </h3> 
        </Row>

        <Row className='g-4'>
          <Col md={6}>
            <Card
              className='border-0 shadow'
              style={{ backgroundColor: "var(--color-card)" }}
            >
              <Card.Body className='p-4'>
                <Form>
                  <FormInput
                    label={"Full Name"}
                    type='name'
                    placeholder=' '
                    required
                  />
                  <FormInput
                    label={"Email"}
                    type='email'
                    placeholder=''
                    required
                  />
                  <FormInput
                    label={"Message"}
                    as='textarea'
                    placeholder=' '
                    required
                  />

                  <div className=' d-flex justify-content-center'>
                    <Button
                      className='button d-inline-block'
                      type='submit'
                      size='md'
                    >
                      Send Message
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <div className='ps-lg-5'>
              <h4 className='mb-4'>Connect With Us</h4>

              <Col className='d-inline-block p-1'>
                <div className='d-flex align-items-start mb-4'>
                  <i
                    className='bi bi-geo-alt-fill fs-5 pe-2'
                    style={{ color: "var(--color-primary)" }}
                  ></i>
                  <div>
                    <h5 style={{ color: "var(--color-secondary)" }}>
                      Headquarters
                    </h5>
                    <p className='mb-0' style={{ color: "white" }}>
                      Main Road
                      <br />
                      Baalbeck, Lebanon
                    </p>
                  </div>
                </div>
              </Col>

              <Col className='d-inline-block p-1'>
                <div className='d-flex align-items-start mb-4'>
                  <i
                    className='bi bi-telephone-fill fs-5 pe-2'
                    style={{ color: "var(--color-primary)" }}
                  ></i>
                  <div>
                    <h5 style={{ color: "var(--color-secondary)" }}>
                      Customer Support
                    </h5>
                    <p className='mb-0' style={{ color: "white" }}>
                      +961 76 469 435
                      <br />
                      Mon-Fri: 9AM - 7PM EST
                    </p>
                  </div>
                </div>
              </Col>
              <Col className='d-inline-block p-1'>
                <div className='d-flex align-items-start mb-4'>
                  <i
                    className='bi bi-envelope-fill fs-5 pe-2'
                    style={{ color: "var(--color-primary)" }}
                  ></i>
                  <div>
                    <h5 style={{ color: "var(--color-secondary)" }}>Email</h5>
                    <p className='mb-0' style={{ color: "white" }}>
                      hassanein.sharafaldein.dev@gmail.com
                    </p>
                  </div>
                </div>
              </Col>
            </div>
          </Col>
        </Row>

        <Row>
          <Col className='text-center '>
            <p style={{ color: "whitesmoke", fontWeight: "bold" }}>
              &copy; {new Date().getFullYear()} HabitBite. All rights
              reserved.
              <br />
              Serving 400K+ ingredient profiles to monthly users
            </p>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default ContactSection;
