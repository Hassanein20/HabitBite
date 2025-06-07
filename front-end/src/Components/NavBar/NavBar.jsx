import { React } from "react";
import { Container, Navbar, Nav, Button, Row, Col } from "react-bootstrap";
// import logoImage from "../../Assets/Icon.png";
import style from "./NavBar.module.css";
import { Link } from "react-router-dom";
import { useTheme } from "../ThemeContext";

function ThemeToggleButton() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`${style.themetoggle} d-flex`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <i
        className={`bi-sun-fill ${
          !isDark ? "opacity-100" : "opacity-0"
        } transition-all d-flex sun`}
        style={{ color: "rgba(255, 223, 34, 1)" }}
      ></i>
      <i
        className={`bi-moon-fill position-absolute ${
          isDark ? "opacity-100" : "opacity-0"
        } transition-all d-flex`}
      ></i>
    </button>
  );
}

const NavBar = () => (
  <Navbar expand='md' collapseOnSelect className={`${style.navbar}`}>
    <Container>
      <Navbar.Brand href='/Home'>
        <p
          style={{
            margin: "0",
            fontWeight: "600",
            color: "white",
            fontFamily: "DM Serif Display, serif",
          }}
        >
          HabitBite
        </p>
      </Navbar.Brand>

      <Navbar.Toggle
        aria-controls='main-navbar'
        className={`${style.navbarToggle} `}
      />

      <Navbar.Collapse id='main-navbar'>
        <Nav className='mx-auto gap-1'>
          <Nav.Link href='#Home' className={`${style.navlink} `}>
            <i className='bi bi-house-heart-fill fs-5'></i> Home
          </Nav.Link>
          <Nav.Link href='#About' className={`${style.navlink} `}>
            <i className='bi bi-info-lg fs-5'></i> About
          </Nav.Link>
          <Nav.Link href='#Services' className={`${style.navlink} `}>
            <i className='bi bi-clipboard-heart fs-5'></i> Services
          </Nav.Link>
          <Nav.Link href='#Menu' className={`${style.navlink} `}>
            <i className='bi bi-menu-down fs-5'></i> Menu
          </Nav.Link>
          <Nav.Link href='#Contact' className={`${style.navlink} `}>
            <i className='bi bi-globe-europe-africa fs-5'></i> Contact
          </Nav.Link>
        </Nav>

        <Row className='mt-3 mt-md-0 '>
          <Col className='d-flex justify-content-center align-items-center'>
            <Button
              as={Link}
              to='/SignIn'
              className={`button`}
              style={{ whiteSpace: "nowrap" }}
            >
              Sign In
            </Button>
          </Col>
          <Col className='d-flex justify-content-center align-items-center'>
            <ThemeToggleButton />
          </Col>
        </Row>
      </Navbar.Collapse>
    </Container>
  </Navbar>
);

export default NavBar;
