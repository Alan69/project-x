import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { store } from "./store";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout/Layout";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import SelfAssessment from "./components/SelfAssessment/SelfAssessment";
import PeerReview from "./components/PeerReview/PeerReview";

import CommitteeReview from "./components/CommitteeReview/CommitteeReview";
import EmployeeList from "./components/EmployeeList/EmployeeList";
import ReviewList from "./components/ReviewList/ReviewList";
import Profile from "./components/Profile/Profile";

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Routes component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="self-assessment" element={<SelfAssessment />} />
        <Route path="peer-review" element={<PeerReview />} />
        <Route path="committee-review" element={<CommitteeReview />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="reviews" element={<ReviewList />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
