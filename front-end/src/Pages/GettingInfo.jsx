import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { FormInput } from "../Components/Registration/FormInput";
import { RadioGroup } from "../Components/Registration/RadioGroup";
import { DatePicker } from "../Components/Registration/DatePicker";
import Background from "./../Assets/GettingInfo.webp";
import {
  emailSchema,
  passwordSchema,
} from "../Components/Registration/Validators";
import { useAuth } from "../Context/AuthContext";

const GettingInfo = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    date: { day: "", month: "", year: "" },
    weight: "",
    height: "",
    gender: "male",
    activityLevel: 0,
    goal: 1,
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    date: "",
  });

  const activityLevels = [
    "Sedentary: No or little exercise",
    "Light: Sports 1-3 days/week",
    "Moderate: Sports 3-5 days/week",
    "Active: Sports 6-7 days/week",
    "Very Active: Training twice a day",
  ];

  const goalLevels = ["Lose Weight", "Maintain Weight", "Gain Weight"];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      date: { ...prev.date, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, date: "" }));
  };

  const validateCredentials = () => {
    const newErrors = { email: "", password: "", username: "" };
    let isValid = true;

    try {
      emailSchema.parse(formData.email);
    } catch (error) {
      newErrors.email = error.errors[0].message;
      isValid = false;
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (error) {
      newErrors.password = error.errors[0].message;
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (!/^[a-zA-Z0-9]{3,50}$/.test(formData.username)) {
      newErrors.username =
        "Username must be 3-50 characters and contain only letters and numbers";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateUserInfo = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s]{2,}$/.test(formData.fullName)) {
      newErrors.fullName = "Invalid name format";
    }

    if (!formData.date.day || !formData.date.month || !formData.date.year) {
      newErrors.date = "Please select complete birthdate";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    if (validateCredentials()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (validateUserInfo()) {
      setError("");
      setLoading(true);

      try {
        const goalMap = {
          0: "lose",
          1: "maintain",
          2: "gain",
        };

        const activityMap = {
          0: "sedentary",
          1: "light",
          2: "moderate",
          3: "active",
          4: "very_active",
        };

        const birthdate = `${formData.date.year}-${String(
          formData.date.month
        ).padStart(2, "0")}-${String(formData.date.day).padStart(2, "0")}`;

        const formattedData = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          fullName: formData.fullName,
          birthdate: birthdate,
          gender: formData.gender.toLowerCase(),
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          goalType: goalMap[formData.goal],
          activityLevel: activityMap[formData.activityLevel],
        };

        const response = await register(formattedData);
        if (response && response.user) {
          setTimeout(() => {
            navigate("/User", { replace: true });
          }, 100);
        } else {
          console.error("Registration response missing user data:", response);
          throw new Error("Registration failed: No user data received");
        }
      } catch (err) {
        console.error("Registration error:", err);
        console.error("Error response:", err.response?.data);

        if (
          err.response?.status === 403 &&
          err.response?.data?.error === "CSRF token invalid"
        ) {
          setError("Session expired. Please refresh the page and try again.");
        } else {
          const errorMessage =
            err.response?.data?.error ||
            err.response?.data?.details ||
            err.message ||
            "Registration failed. Please try again.";
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className='GettingInfoContainer d-flex align-items-center'
      style={{ backgroundImage: `url(${Background})` }}
    >
      {step === 1 && (
        <Modal
          show
          onHide={() => navigate(-1)}
          backdrop='static'
          keyboard={false}
          centered
        >
          <Form onSubmit={handleCredentialSubmit}>
            <Modal.Header className='d-flex justify-content-center align-items-center'>
              <Modal.Title>Create a New Account</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {error && <div className='alert alert-danger'>{error}</div>}
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
                label='Username'
                type='text'
                name='username'
                value={formData.username}
                error={errors.username}
                onChange={(e) => handleChange("username", e.target.value)}
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
            </Modal.Body>
            <Modal.Footer className='d-flex justify-content-center align-items-center'>
              <Button className='button' type='submit'>
                Next
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}

      {step === 2 && (
        <Container>
          <Row className='justify-content-center'>
            <Col md={8} lg={6}>
              <Card
                className='p-4 form-shadow'
                style={{
                  backgroundColor: "var(--color-card)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>
                  {`
                    .form-shadow::-webkit-scrollbar {
                      display: none;  /* Chrome, Safari and Opera */
                    }
                  `}
                </style>
                <Form onSubmit={handleFinalSubmit}>
                  {error && <div className='alert alert-danger'>{error}</div>}
                  <FormInput
                    label='Full Name'
                    name='fullName'
                    value={formData.fullName}
                    error={errors.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    autoFocus
                    required
                    placeholder=''
                  />

                  <DatePicker
                    date={formData.date}
                    error={errors.date}
                    onDateChange={handleDateChange}
                  />

                  <Row className='mb-3'>
                    {["weight", "height"].map((field) => (
                      <Col key={field} md={6}>
                        <FormInput
                          label={`${
                            field.charAt(0).toUpperCase() + field.slice(1)
                          } (${field === "weight" ? "kg" : "cm"})`}
                          type='number'
                          name={field}
                          value={formData[field]}
                          onChange={(e) => handleChange(field, e.target.value)}
                          min={field === "weight" ? 40 : 100}
                          max={field === "weight" ? 200 : 300}
                          step='0.1'
                          required
                          placeholder=''
                        />
                      </Col>
                    ))}
                  </Row>

                  <RadioGroup
                    className={"d-flex flex-column align-items-center"}
                    label='Gender'
                    name='gender'
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                    ]}
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  />

                  <Form.Group className='mb-4'>
                    <Form.Label
                      style={{
                        color: "var(--color-text)",
                        fontWeight: "bolder",
                      }}
                    >
                      Activity Level: {activityLevels[formData.activityLevel]}
                    </Form.Label>
                    <Form.Range
                      className='custom-range ActivityLevel'
                      onChange={(e) => {
                        handleChange("activityLevel", e.target.value);
                      }}
                      min='0'
                      max='4'
                      value={formData.activityLevel}
                    />
                  </Form.Group>

                  <Form.Group className='mb-4'>
                    <Form.Label
                      style={{
                        color: "var(--color-text)",
                        fontWeight: "bolder",
                      }}
                    >
                      Goal: {goalLevels[formData.goal]}
                    </Form.Label>
                    <Form.Range
                      className='custom-range ActivityLevel'
                      onChange={(e) => {
                        handleChange("goal", e.target.value);
                      }}
                      min='0'
                      max='2'
                      value={formData.goal}
                    />
                  </Form.Group>

                  <div className='d-grid'>
                    <Button className='button' type='submit' disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </Button>
                  </div>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
};

export default GettingInfo;
