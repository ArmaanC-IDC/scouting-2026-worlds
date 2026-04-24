import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Container, Paper, TextField, Typography,
    Select, MenuItem, InputLabel, FormControl, Snackbar, Alert,
    AppBar, Toolbar, IconButton, createTheme, ThemeProvider, CssBaseline
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import QRGeneratorDialog from './QRGeneratorDialog';
import { submitMatch } from '../../requests/ApiRequests';

// --- THEME DEFINITION ---
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#d32f2f' }, // Core Red
        background: { default: '#121212', paper: '#1e1e1e' },
    },
    typography: { fontFamily: "'Roboto', sans-serif" },
});

const initialFormState = {
    eventKey: "",
    matchNumber: "",
    teamNumber: "",
    scoutName: "",
    driverSkill: "N/A",
    defenseSkill: "N/A",
    comments: ""
};

const SubmitReport = ({ eventKey, setEventKey }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormState);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [alert, setAlert] = useState({ open: false, type: "info", message: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await submitMatch({ ...formData, eventKey });
            setAlert({ open: true, type: "success", message: "Report submitted successfully!" });
            setFormData(initialFormState);
        } catch (error) {
            const errorMsg = error?.response?.data?.message || error.message || "Failed to submit report";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />

            {/* Top App Bar to match Home Page */}
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Scout Match
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ pt: '80px', pb: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                <Container maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

                    <Paper elevation={3} sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                                Match Report
                            </Typography>
                            <Button
                                type="button"
                                variant="outlined"
                                color="primary"
                                startIcon={<QrCodeIcon />}
                                onClick={() => setIsGeneratorOpen(true)}
                            >
                                Generate QR
                            </Button>
                        </Box>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>

                                <TextField label="Event Key" name="eventKey" value={eventKey} onChange={(e) => setEventKey(e.target.value)} required fullWidth />
                                <TextField label="Match Number" name="matchNumber" value={formData.matchNumber} onChange={handleChange} required fullWidth />
                                <TextField label="Team Number" name="teamNumber" type="number" value={formData.teamNumber} onChange={handleChange} required fullWidth />
                                <TextField label="Scout Name" name="scoutName" value={formData.scoutName} onChange={handleChange} required fullWidth />

                                <FormControl fullWidth sx={{ gridColumn: { sm: 'span 2' } }}>
                                    <InputLabel>Driver Skill</InputLabel>
                                    <Select name="driverSkill" value={formData.driverSkill} onChange={handleChange} label="Driver Skill">
                                        <MenuItem value="N/A">N/A</MenuItem>
                                        <MenuItem value={1}>1 (Lowest)</MenuItem>
                                        <MenuItem value={2}>2</MenuItem>
                                        <MenuItem value={3}>3</MenuItem>
                                        <MenuItem value={4}>4</MenuItem>
                                        <MenuItem value={5}>5 (Highest)</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth sx={{ gridColumn: { sm: 'span 2' } }}>
                                    <InputLabel>Defense Skill</InputLabel>
                                    <Select name="defenseSkill" value={formData.defenseSkill} onChange={handleChange} label="Defense Skill">
                                        <MenuItem value="N/A">N/A (Did Not Defend)</MenuItem>
                                        <MenuItem value={1}>1 (Lowest)</MenuItem>
                                        <MenuItem value={2}>2</MenuItem>
                                        <MenuItem value={3}>3</MenuItem>
                                        <MenuItem value={4}>4</MenuItem>
                                        <MenuItem value={5}>5 (Highest)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <TextField
                                label="Comments"
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                multiline
                                fullWidth
                                variant="outlined"
                                rows={10}
                                sx={{
                                    mb: 4,
                                    flexGrow: 1,
                                    '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' },
                                    textarea: { height: "100% !important" }
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                fullWidth
                                disabled={isSubmitting}
                                endIcon={<SendIcon />}
                                sx={{ py: 2, fontSize: '1.2rem', fontWeight: 'bold' }}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Report"}
                            </Button>
                        </form>

                    </Paper>

                    <QRGeneratorDialog
                        open={isGeneratorOpen}
                        onClose={() => setIsGeneratorOpen(false)}
                        data={formData}
                    />

                    <Snackbar
                        open={alert.open}
                        autoHideDuration={6000}
                        onClose={() => setAlert({ ...alert, open: false })}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert severity={alert.type} variant="filled" sx={{ width: '100%', fontSize: '1.1rem' }}>
                            {alert.message}
                        </Alert>
                    </Snackbar>

                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default SubmitReport;