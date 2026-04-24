import * as React from "react";
import { lightTheme, darkTheme } from "./AppTheme.js";
import { ThemeProvider } from "@mui/material/styles";
import "./App.css";

import { Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import HomePage from "./pages/Home/HomePage.js";
import SignInPage from "./pages/SignInPage.js";
import SubmitReport from "./pages/ScoutMatch/SubmitReport.jsx";
import AdminPage from "./pages/Admin/Admin.js";
import { ProtectedRoute } from "./TokenUtils.js";
import ScoutRankings from "./pages/Admin/ScoutRankings.js";
import ScanQR from "./pages/ScanQR.js";
import Strategy from "./pages/Strategy/Strategy.js";

function App() {
  const [eventKey, setEventKey] = React.useState("2026oncmp2");
  return (
    <React.Fragment>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <Routes>
          <Route path="/signIn" element={<SignInPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage eventKey={eventKey} setEventKey={setEventKey} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scoutMatch"
            element={
              <SubmitReport key={window.search} eventKey={eventKey} setEventKey={setEventKey} />
            }
          />
          <Route
            path="/strategy"
            element={
              <ProtectedRoute>
                <Strategy eventKey={eventKey} setEventKey={setEventKey} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scoutRankings"
            element={
              <ProtectedRoute>
                <ScoutRankings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanQR />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
