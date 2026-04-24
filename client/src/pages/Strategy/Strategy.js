// src/pages/Strategy/Strategy.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Container, Box, Tabs, Tab,
  createTheme, ThemeProvider, CssBaseline, IconButton, TextField, InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';

// Sub-components
import Summary from './Summary';
import Team from './Team';
import MultipleTeams from './MultipleTeams';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d32f2f' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  typography: { fontFamily: "'Roboto', sans-serif" },
});

const Strategy = ({ eventKey, setEventKey }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [targetTeam, setTargetTeam] = useState("");

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Called by Summary.js when a row is clicked
  const jumpToTeam = (teamNumber) => {
    setTargetTeam(teamNumber);
    setActiveTab(1); // Jump to the Team tab
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {/* Unified Top Bar with Event Key Selector */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1a1a1a' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Strategy
          </Typography>

          <TextField
            size="small"
            variant="outlined"
            placeholder="Event Key"
            value={eventKey || ""}
            onChange={(e) => setEventKey(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon sx={{ color: '#aaa' }} />
                </InputAdornment>
              ),
              sx: { color: '#0ff', fontWeight: 'bold', bgcolor: '#333', borderRadius: 1 }
            }}
            sx={{ width: '200px' }}
          />
        </Toolbar>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="primary"
          sx={{ bgcolor: '#1e1e1e' }}
        >
          <Tab label="Summary" />
          <Tab label="Team" />
          <Tab label="Compare" />
        </Tabs>
      </AppBar>

      <Box sx={{ minHeight: "100vh", pt: '130px', pb: '40px', bgcolor: 'background.default' }}>
        {/* Use a wider container for the Alliance Compare so cards aren't squished */}
        <Container maxWidth={activeTab === 2 ? "xl" : "lg"}>
          {activeTab === 0 && <Summary eventKey={eventKey} onTeamClick={jumpToTeam} />}
          {activeTab === 1 && <Team eventKey={eventKey} initialTeam={targetTeam} />}
          {activeTab === 2 && <MultipleTeams eventKey={eventKey} />}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Strategy;