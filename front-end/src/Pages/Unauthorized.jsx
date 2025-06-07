import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container className='py-5'>
      <Row className='justify-content-center text-center'>
        <Col md={6}>
          <div className='py-5'>
            <h1 className='display-1'>403</h1>
            <h2 className='mb-4'>Access Denied</h2>
            <p className='mb-4'>
              You do not have permission to access this page. This area is
              restricted to authorized personnel only.
            </p>
            <Button variant='primary' onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Unauthorized;
