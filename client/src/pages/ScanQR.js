import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar, Toolbar, Typography, Container, Box, Button, Paper,
    createTheme, ThemeProvider, CssBaseline, Snackbar, Alert, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { QrReader } from 'react-qr-reader';
import { submitMatch } from '../requests/ApiRequests';

//update in ScoutMatch/QRGeneratorDialog.jsx as well
const order = ["eventKey", "matchNumber", "teamNumber", "scoutName", "driverSkill", "defenseSkill", "comments"]

// --- THEME DEFINITION ---
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#d32f2f' }, // Core Red
        background: { default: '#121212', paper: '#1e1e1e' },
    },
    typography: { fontFamily: "'Roboto', sans-serif" },
});

const ScanQR = () => {
    const navigate = useNavigate();
    const [alert, setAlert] = useState({ open: false, type: "info", message: "" });
    const [isUIProcessing, setIsUIProcessing] = useState(false); // Used only for the "Processing..." visual overlay

    // THE FIX: A mutable ref that updates instantly, bypassing React's async state batching
    const scanLockRef = useRef(false);

    const handleResult = async (result, error) => {
        // If we get a result AND the lock is currently open
        if (result && !scanLockRef.current) {

            // Instantly slam the gate shut so subsequent micro-scans fail the if statement
            scanLockRef.current = true;

            // Trigger the UI to show the "Processing..." overlay
            setIsUIProcessing(true);

            try {
                const parsedData = result?.text.split("|").reduce((acc, val, i) => {
                    acc[order[i]] = val;
                    return acc;
                }, {});

                // Submit the scanned data to the database
                await submitMatch(parsedData);

                setAlert({ open: true, type: "success", message: `Successfully synced match ${parsedData.matchNumber} for team ${parsedData.teamNumber}!` });
            } catch (err) {
                console.error(err);
                setAlert({ open: true, type: "error", message: "Failed to sync. Ensure QR is valid." });
            } finally {
                // Resume scanning after 3 seconds, regardless of success or failure
                setTimeout(() => {
                    scanLockRef.current = false; // Re-open the gate
                    setIsUIProcessing(false); // Remove the UI overlay
                }, 3000);
            }
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />

            <AppBar position="fixed">
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Master Scanner
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ minHeight: "100vh", pt: '80px', pb: '40px', display: "flex", flexDirection: "column", alignItems: "center", bgcolor: 'background.default' }}>
                <Container maxWidth="sm">
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Scan Match Data
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Point this camera at a scout's tablet to sync their match to the database.
                        </Typography>

                        <Box sx={{ border: '4px solid #d32f2f', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                            {isUIProcessing && (
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="h5" color="success.main" fontWeight="bold">Processing...</Typography>
                                </Box>
                            )}
                            <QrReader
                                onResult={handleResult}
                                constraints={{ facingMode: 'environment' }}
                                containerStyle={{ width: '100%' }}
                            />
                        </Box>
                    </Paper>
                </Container>
            </Box>

            <Snackbar
                open={alert.open}
                autoHideDuration={4000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={alert.type} variant="filled" sx={{ width: '100%', fontSize: '1.1rem' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default ScanQR;