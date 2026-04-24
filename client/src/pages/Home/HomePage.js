// src/components/HomePage.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Container, Box, Button, Grid, Card,
  CardActionArea, CardContent, IconButton, Menu, MenuItem, Accordion,
  AccordionSummary, AccordionDetails, createTheme, ThemeProvider, CssBaseline,
  TextField // <-- Added TextField to imports
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AccountCircle from "@mui/icons-material/AccountCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventIcon from "@mui/icons-material/Event";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

// Import your components and assets
import UpdatePassword from "./UpdatePassword";
import altf4Logo from "../../assets/scouting-2025/altf4_logo_white.png";

// --- THEME DEFINITION ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d32f2f', // Core Red
    },
    background: {
      default: '#121212', // Deep Black
      paper: '#1e1e1e',   // Slightly Lighter Surfaces
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h2: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
});

// --- STYLED COMPONENTS ---
const HomeContainer = styled("div")({
  minHeight: "100vh",
  paddingTop: "80px",
  paddingBottom: "40px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: darkTheme.palette.background.default,
});

const ScoutMatchButton = styled(Button)(({ theme }) => ({
  padding: "20px 60px",
  fontSize: "1.8rem",
  fontWeight: "bold",
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  margin: "30px 0 50px 0",
  transition: "transform 0.2s, box-shadow 0.3s",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "scale(1.05)",
    boxShadow: `0 8px 25px ${theme.palette.primary.dark}`,
  },
}));

const NavCard = styled(Card)(({ theme }) => ({
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
  color: "#fff",
  transition: "transform 0.2s",
  "&:hover": {
    backgroundColor: '#333333',
    transform: "translateY(-5px)",
  },
}));

const AdminAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: '#424242',
  color: "#fff",
  width: '100%',
  marginTop: '40px'
}));

const LogoImage = styled('img')({
  height: '45px',
  marginRight: '16px',
});

// --- HOME PAGE COMPONENT ---
const HomePage = ({ eventKey, setEventKey }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenUpdatePassword = () => {
    setUpdatePasswordOpen(true);
    handleCloseMenu();
  };
  const handleCloseUpdatePassword = () => setUpdatePasswordOpen(false);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <LogoImage src={altf4Logo} alt="Team Logo" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ALT-F4 Scouting
          </Typography>
          {/* --- NEW EVENT KEY SELECTOR --- */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
            <TextField
              label="Active Event Key"
              variant="outlined"
              value={eventKey || ""} // Fallback to avoid uncontrolled input errors
              onChange={(e) => setEventKey(e.target.value)}
              placeholder="e.g., 2026oncmp2"
              sx={{
                width: '150px',
                bgcolor: 'background.paper',
                borderRadius: 1,
                input: { color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' } // Styled to pop
              }}
            />
          </Box>
          <div>
            <IconButton size="large" onClick={handleMenu} color="inherit">
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUpdatePassword}>Update Password</MenuItem>
              <MenuItem onClick={() => {
                localStorage.setItem("token", "");
                navigate("/signIn");
              }}>Log Out</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <HomeContainer>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom color="white">
              Scouting App
            </Typography>

            <ScoutMatchButton onClick={() => navigate("/scoutMatch")}>
              Scout Match
            </ScoutMatchButton>
          </Box>

          {/* Navigation Cards */}
          <NavCard onClick={() => navigate("/strategy")}>
            <CardActionArea sx={{ p: 3 }}>
              <AssessmentIcon sx={{ fontSize: 60 }} />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Strategy
                </Typography>
              </CardContent>
            </CardActionArea>
          </NavCard>

          <Button variant="contained" fullWidth style={{ marginTop: "20px" }} startIcon={<QrCodeScannerIcon />} onClick={() => navigate("/scan")}>Scan QR</Button>
        </Container>
      </HomeContainer>

      <UpdatePassword open={updatePasswordOpen} onClose={handleCloseUpdatePassword} />
    </ThemeProvider>
  );
};

export default HomePage;