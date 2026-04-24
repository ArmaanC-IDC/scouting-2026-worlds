// src/pages/Strategy/Team.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Grid, Card, CardContent, Chip, CircularProgress, Alert, Paper, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getReports } from '../../requests/ApiRequests';

const Team = ({ eventKey, initialTeam }) => {
    const [activeTeam, setActiveTeam] = useState(initialTeam || "");
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sync state if a user clicks a different team from the Summary tab
    useEffect(() => {
        if (initialTeam) setActiveTeam(initialTeam);
    }, [initialTeam]);

    useEffect(() => {
        if (activeTeam && eventKey) fetchTeamData(activeTeam);
    }, [activeTeam, eventKey]);

    const fetchTeamData = async (teamNum) => {
        setLoading(true); setError(null);
        try {
            const response = await getReports({ eventKey, robot: teamNum });
            const payload = response.data?.reports || response.data?.data || response.data || response;
            setReports(Array.isArray(payload) ? payload : []);
        } catch (err) {
            setError(`Failed to load data for team ${teamNum}.`);
        } finally {
            setLoading(false);
        }
    };

    const validDriver = reports.filter(r => !isNaN(parseInt(r.driverSkill || r.driver_skill)));
    const avgDriver = validDriver.length ? (validDriver.reduce((sum, r) => sum + parseInt(r.driverSkill || r.driver_skill), 0) / validDriver.length).toFixed(1) : "N/A";

    const validDef = reports.filter(r => !isNaN(parseInt(r.defenseSkill || r.defense_skill)));
    const avgDef = validDef.length ? (validDef.reduce((sum, r) => sum + parseInt(r.defenseSkill || r.defense_skill), 0) / validDef.length).toFixed(1) : "N/A";

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'flex-end', bgcolor: 'background.paper' }}>
                <SearchIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
                <TextField
                    fullWidth
                    label="Lookup Team Number"
                    variant="standard"
                    value={activeTeam}
                    onChange={(e) => setActiveTeam(e.target.value)}
                />
            </Paper>

            {!eventKey && <Alert severity="info">Please enter an Event Key above.</Alert>}
            {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && activeTeam && reports.length > 0 && (
                <>
                    <Paper sx={{ p: 3, mb: 4, bgcolor: '#1a1a1a', borderLeft: '6px solid #d32f2f' }}>
                        <Typography variant="h4" color="white" gutterBottom fontWeight="bold">Team {activeTeam}</Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={4}><Typography color="text.secondary">Matches</Typography><Typography variant="h5" color="#0ff">{reports.length}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Avg Driver</Typography><Typography variant="h5" color="#0ff">{avgDriver}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Avg Defense</Typography><Typography variant="h5" color="#0ff">{avgDef}</Typography></Grid>
                        </Grid>
                    </Paper>

                    <Grid container spacing={3}>
                        {reports.map((report, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Card elevation={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box display="flex" justifyContent="space-between" mb={2}>
                                            <Typography variant="h6" fontWeight="bold">Match {report.matchNumber || report.match_number}</Typography>
                                            <Chip label={`Scout: ${report.scoutName || report.scout_name}`} size="small" />
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box display="flex" justifyContent="space-between" mb={2}>
                                            <Typography variant="body2" color="text.secondary">Driver: <b>{report.driverSkill || report.driver_skill || "N/A"}</b></Typography>
                                            <Typography variant="body2" color="text.secondary">Defense: <b>{report.defenseSkill || report.defense_skill || "N/A"}</b></Typography>
                                        </Box>
                                        <Box sx={{ bgcolor: '#111', p: 1.5, borderRadius: 1, mt: 'auto', minHeight: '60px' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">Comments</Typography>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#ccc' }}>
                                                {report.comments ? `"${report.comments}"` : "No comments."}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
            {!loading && activeTeam && reports.length === 0 && <Typography align="center" color="text.secondary">No reports found for Team {activeTeam}.</Typography>}
        </Box>
    );
};

export default Team;