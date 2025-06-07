import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Row, Col, Nav } from "react-bootstrap";
import { FormInput } from "../Components/Registration/FormInput";
import {
  emailSchema,
  passwordSchema,
} from "../Components/Registration/Validators";
import Background from "../Assets/RegistrationBG.webp";
import { Link } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const validationResult = {
      email: "",
      password: "",
    };

    try {
      emailSchema.parse(formData.email);
    } catch (emailError) {
      validationResult.email = emailError.errors[0].message;
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (passwordError) {
      validationResult.password = passwordError.errors[0].message;
    }

    setErrors(validationResult);
    return !validationResult.email && !validationResult.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      if (user) {
        switch (user.role) {
          case "admin":
            navigate("/Admin");
            break;
          case "dietitian":
            navigate("/Dietitian");
            break;
          default:
            navigate("/User");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className='RegistrationContainer d-flex align-items-center'
        style={{ backgroundImage: `url(${Background})` }}
      >
        <Container className='mb-5'>
          <Row className='justify-content-center'>
            <Col md={6} lg={5} xl={4}>
              <Card
                className='p-4 shadow'
                style={{ backgroundColor: "var(--color-card)" }}
              >
                <Form onSubmit={handleSubmit}>
                  {error && <div className='alert alert-danger'>{error}</div>}
                  <h3 className='text-center mb-4'>Sign In</h3>

                  <FormInput
                    label='Email'
                    type='email'
                    name='email'
                    value={formData.email}
                    error={errors.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder=' '
                  />

                  <FormInput
                    label='Password'
                    type='password'
                    name='password'
                    value={formData.password}
                    error={errors.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder=' '
                  />

                  <Form.Check
                    type='checkbox'
                    label='Remember Me?'
                    className='my-2 fs-7'
                  />

                  <Col
                    md={6}
                    lg={5}
                    xl={4}
                    className=' d-flex flex-column align-items-center justify-content-center gap-2 w-100'
                  >
                    <p className='m-0' style={{ fontSize: "0.7rem" }}>
                      Don't Have an account?
                    </p>
                    <Nav.Link
                      as={Link}
                      to={"/SignUp/GettingInfo"}
                      style={{
                        color: "var(--color-primary)",
                        fontSize: "0.8rem",
                      }}
                    >
                      SignUp
                    </Nav.Link>
                  </Col>

                  <Button
                    type='submit'
                    className='w-100 mt-3 button'
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default SignIn;
