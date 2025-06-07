import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Pagination,
  InputGroup,
} from "react-bootstrap";
import { useAuth } from "../../Context/AuthContext";
import api, { adminAPI } from "../../API/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    fullName: "",
    password: "",
    birthdate: "",
    gender: "male",
    height: "",
    weight: "",
    goalType: "maintain",
    activityLevel: "moderate",
    role: "user",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(
        "Failed to fetch users. " + (err.response?.data?.error || err.message)
      );
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      setError("Access denied. Admin privileges required.");
      return;
    }
    fetchUsers();
  }, [currentUser, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = () => {
    setFormData({
      email: "",
      username: "",
      fullName: "",
      password: "",
      birthdate: "",
      gender: "male",
      height: "",
      weight: "",
      goalType: "maintain",
      activityLevel: "moderate",
      role: "user",
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setCurrentUserData(user);
    setFormData({
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      password: "",
      birthdate: user.birthdate,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      goalType: user.goalType,
      activityLevel: user.activityLevel,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleDeletePrompt = (user) => {
    setCurrentUserData(user);
    setShowDeleteModal(true);
  };
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(formData);
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setError(
        "Failed to add user. " + (err.response?.data?.error || err.message)
      );
      console.error("Error adding user:", err);
    }
  };
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateUser(currentUserData.id, formData);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(
        "Failed to update user. " + (err.response?.data?.error || err.message)
      );
      console.error("Error updating user:", err);
    }
  };
  const handleDeleteUser = async () => {
    try {
      await adminAPI.deleteUser(currentUserData.id);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setError(
        "Failed to delete user. " + (err.response?.data?.error || err.message)
      );
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter((user) =>
    Object.values(user).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => setCurrentPage(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  return (
    <Container className='py-5'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2>Admin Dashboard - User Management</h2>
        <Button variant='primary' onClick={handleAddUser}>
          Add New User
        </Button>
      </div>

      {error && <Alert variant='danger'>{error}</Alert>}

      <Form.Group className='mb-3'>
        <InputGroup>
          <InputGroup.Text>Search Users</InputGroup.Text>
          <Form.Control
            type='text'
            placeholder='Search by name, email, role...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </Form.Group>

      {loading ? (
        <div className='text-center'>Loading users...</div>
      ) : (
        <>
          <Table
            striped
            bordered
            hover
            responsive
            className='admin-table'
            style={{ tableLayout: "fixed" }}
          >
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("id")}
                  style={{ cursor: "pointer" }}
                >
                  ID{" "}
                  {sortField === "id" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("username")}
                  style={{ cursor: "pointer" }}
                >
                  Username{" "}
                  {sortField === "username" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("email")}
                  style={{ cursor: "pointer" }}
                >
                  Email{" "}
                  {sortField === "email" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("fullName")}
                  style={{ cursor: "pointer" }}
                >
                  Full Name{" "}
                  {sortField === "fullName" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("role")}
                  style={{ cursor: "pointer" }}
                >
                  Role{" "}
                  {sortField === "role" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.fullName}</td>
                  <td>{user.role}</td>
                  <td className='action-buttons'>
                    <Button
                      variant='info'
                      size='sm'
                      className='me-2'
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() => handleDeletePrompt(user)}
                      disabled={user.id === currentUser?.id}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className='d-flex justify-content-between align-items-center'>
            <div>
              Showing {indexOfFirstUser + 1} to{" "}
              {Math.min(indexOfLastUser, sortedUsers.length)} of{" "}
              {sortedUsers.length} users
            </div>
            <Pagination>{paginationItems}</Pagination>
          </div>
        </>
      )}

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitAdd}>
            <Form.Group className='mb-3'>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Username</Form.Label>
              <Form.Control
                type='text'
                name='username'
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type='text'
                name='fullName'
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Birthdate</Form.Label>
              <Form.Control
                type='date'
                name='birthdate'
                value={formData.birthdate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name='gender'
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value='other'>Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control
                type='number'
                name='height'
                value={formData.height}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control
                type='number'
                name='weight'
                value={formData.weight}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Goal Type</Form.Label>
              <Form.Select
                name='goalType'
                value={formData.goalType}
                onChange={handleInputChange}
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Weight</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Activity Level</Form.Label>
              <Form.Select
                name='activityLevel'
                value={formData.activityLevel}
                onChange={handleInputChange}
              >
                <option value='sedentary'>Sedentary</option>
                <option value='light'>Light</option>
                <option value='moderate'>Moderate</option>
                <option value='active'>Active</option>
                <option value='very_active'>Very Active</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Role</Form.Label>
              <Form.Select
                name='role'
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value='user'>User</option>
                <option value='dietitian'>Dietitian</option>
                <option value='admin'>Admin</option>
              </Form.Select>
            </Form.Group>

            <div className='d-flex justify-content-end'>
              <Button
                variant='secondary'
                className='me-2'
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit'>
                Add User
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitEdit}>
            <Form.Group className='mb-3'>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Username</Form.Label>
              <Form.Control
                type='text'
                name='username'
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type='text'
                name='fullName'
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                placeholder='Leave blank to keep current password'
              />
              <Form.Text className='text-muted'>
                Leave blank to keep the current password.
              </Form.Text>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Birthdate</Form.Label>
              <Form.Control
                type='date'
                name='birthdate'
                value={formData.birthdate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name='gender'
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value='other'>Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control
                type='number'
                name='height'
                value={formData.height}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control
                type='number'
                name='weight'
                value={formData.weight}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Goal Type</Form.Label>
              <Form.Select
                name='goalType'
                value={formData.goalType}
                onChange={handleInputChange}
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Weight</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Activity Level</Form.Label>
              <Form.Select
                name='activityLevel'
                value={formData.activityLevel}
                onChange={handleInputChange}
              >
                <option value='sedentary'>Sedentary</option>
                <option value='light'>Light</option>
                <option value='moderate'>Moderate</option>
                <option value='active'>Active</option>
                <option value='very_active'>Very Active</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Role</Form.Label>
              <Form.Select
                name='role'
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value='user'>User</option>
                <option value='dietitian'>Dietitian</option>
                <option value='admin'>Admin</option>
              </Form.Select>
            </Form.Group>

            <div className='d-flex justify-content-end'>
              <Button
                variant='secondary'
                className='me-2'
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button variant='primary' type='submit'>
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the user "{currentUserData?.username}
          "? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
