import { FloatingLabel, Form } from "react-bootstrap";
import { PasswordInput } from "./PasswordInput";

export const FormInput = ({
  label,
  type = "text",
  name,
  value,
  error,
  onChange,
  ...props
}) => {
  if (type === "password") {
    return (
      <PasswordInput
        label={label}
        name={name}
        value={value}
        error={error}
        onChange={onChange}
        {...props}
      />
    );
  }

  return (
    <FloatingLabel
      label={label}
      style={{ color: "var(--color-text)" }}
      data-bs-theme='var(--color-theme)'
      className='mb-3'
    >
      <Form.Control
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        isInvalid={!!error}
        style={{
          backgroundColor: "var(--color-lighter)",
        }}
        {...props}
      />
      <Form.Control.Feedback type='invalid'>{error}</Form.Control.Feedback>
    </FloatingLabel>
  );
};
