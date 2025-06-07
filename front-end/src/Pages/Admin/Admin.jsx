import React, { useEffect } from "react";
import { Container, Row, Col, Nav, Button } from "react-bootstrap";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import { FaSignOutAlt } from "react-icons/fa";

const Admin = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }

    if (currentUser.role !== "admin") {
      navigate("/unauthorized");
    }
  }, [currentUser, navigate]);

  return (
    <Container fluid>
      <Row>
        <Col md={2} className='bg-dark text-white py-5 min-vh-100'>
          <h3 className='mb-4 ps-3'>Admin Panel</h3>
          <Nav className='flex-column'>
            <Nav.Link as={Link} to='/Admin' className='text-white'>
              User Management
            </Nav.Link>
            <Nav.Link as={Link} to='/Admin/reports' className='text-white'>
              Reports
            </Nav.Link>
            <Nav.Link as={Link} to='/Admin/settings' className='text-white'>
              System Settings
            </Nav.Link>
            <Nav.Link as={Link} to='/User' className='text-white mt-5'>
              Back to App
            </Nav.Link>
            <div className='mt-auto pt-5 pb-3 ps-3'>
              <Button
                variant='outline-danger'
                size='sm'
                onClick={handleLogout}
                className='d-flex align-items-center'
              >
                <FaSignOutAlt className='me-2' />
                Logout
              </Button>
            </div>
          </Nav>
        </Col>

        <Col md={10} className='py-3'>
          <AdminDashboard />
        </Col>
      </Row>
    </Container>
  );
};

export default Admin;
