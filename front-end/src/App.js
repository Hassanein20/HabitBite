import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import SignIn from "./Pages/SignIn";
import GettingInfo from "./Pages/GettingInfo";
import Home from "./Pages/Home";
import User from "./Pages/User";
import Admin from "./Pages/Admin/Admin";
import DietitianDashboard from "./Pages/Dietitian/DietitianDashboard";
import Unauthorized from "./Pages/Unauthorized";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeProvider } from "./Components/ThemeContext";
import { AuthProvider, useAuth } from "./Context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to='/SignIn' />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to='/SignIn' />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to='/Unauthorized' />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div>
            <Routes>
              <Route path='/Home' element={<Home />} />
              <Route path='/SignIn' element={<SignIn />} />
              <Route path='/SignUp/GettingInfo' element={<GettingInfo />} />
              <Route path='/Unauthorized' element={<Unauthorized />} />
              <Route
                path='/User'
                element={
                  <RoleProtectedRoute allowedRoles={["user"]}>
                    <User />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/Admin'
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/Dietitian'
                element={
                  <RoleProtectedRoute allowedRoles={["dietitian"]}>
                    <DietitianDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route path='/' element={<Navigate replace to='/Home' />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
