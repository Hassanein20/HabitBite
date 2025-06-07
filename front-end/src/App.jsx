import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";

import Admin from "./Pages/Admin/Admin";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import Unauthorized from "./Pages/Unauthorized";


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          <Route path='/Admin' element={<Admin />}>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path='/unauthorized' element={<Unauthorized />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
