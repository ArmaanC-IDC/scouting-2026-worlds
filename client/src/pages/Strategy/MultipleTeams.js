// src/pages/Strategy/MultipleTeams.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Grid, Card, CardContent, Divider, Alert, CircularProgress, Paper, IconButton, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { getReports } from '../../requests/ApiRequests';

const TeamCard = ({ eventKey, teamNumber, color, onRemove }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            if (!teamNumber || !eventKey) return;

            setLoading(true);
            try {
                const response = await getReports({ eventKey, robot: teamNumber });
                const payload = response.data?.reports || response.data?.data || response.data || response;
                setReports(Array.isArray(payload) ? payload : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, [teamNumber, eventKey]);

    if (!teamNumber) return null;

    // Base card styling
    const cardStyle = {
        borderTop: `6px solid ${color}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative' // Required for the absolute close button
    };

    if (loading) {
        return (
            <Card elevation={3} sx={{ ...cardStyle, alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                <CircularProgress sx={{ color: color }} />
            </Card>
        );
    }

    if (reports.length === 0) {
        return (
            <Card elevation={3} sx={{ ...cardStyle, alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                <IconButton size="small" onClick={onRemove} sx={{ position: 'absolute', top: 4, right: 4, color: 'text.secondary' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
                <Typography color="text.secondary">No data for Team {teamNumber}</Typography>
            </Card>
        );
    }

    const validDriver = reports.filter(r => !isNaN(parseInt(r.driverSkill || r.driver_skill)));
    const avgDriver = validDriver.length ? (validDriver.reduce((sum, r) => sum + parseInt(r.driverSkill || r.driver_skill), 0) / validDriver.length).toFixed(1) : "N/A";

    const validDef = reports.filter(r => !isNaN(parseInt(r.defenseSkill || r.defense_skill)));
    const avgDef = validDef.length ? (validDef.reduce((sum, r) => sum + parseInt(r.defenseSkill || r.defense_skill), 0) / validDef.length).toFixed(1) : "N/A";

    return (
        <Card elevation={4} sx={cardStyle}>
            <IconButton size="small" onClick={onRemove} sx={{ position: 'absolute', top: 4, right: 4, color: 'text.secondary' }}>
                <CloseIcon fontSize="small" />
            </IconButton>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 3 }}>
                <Typography variant="h4" fontWeight="bold" align="center" gutterBottom color={color}>
                    {teamNumber}
                </Typography>

                <Box display="flex" justifyContent="space-around" mb={2} p={1} sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                    {[["Reports", reports.length], ["Driver Skill", avgDriver], ["Defense Skill", avgDef]].map(e => (
                        <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">
                                {e[0]}
                            </Typography>
                            <Typography variant="h6">
                                {e[1]}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="caption" color="text.secondary" gutterBottom>Strategy Comments:</Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '250px', pr: 1 }}>
                    {reports.map((r, i) => r.comments && (
                        <Paper key={i} sx={{ p: 1.5, mb: 1, bgcolor: '#111', fontSize: '0.85rem', borderLeft: `2px solid ${color}` }}>
                            <strong style={{ color: '#ccc' }}>Q{r.matchNumber || r.match_number}:</strong> "{r.comments}"
                        </Paper>
                    ))}
                    {reports.filter(r => r.comments).length === 0 && (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">No comments recorded.</Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const MultipleTeams = ({ eventKey }) => {
    const [teams, setTeams] = useState([]);
    const [inputTeam, setInputTeam] = useState("");

    const handleAddTeam = (e) => {
        e.preventDefault();
        const cleanInput = inputTeam.trim();
        if (cleanInput && !teams.includes(cleanInput)) {
            setTeams([...teams, cleanInput]);
            setInputTeam(""); // Clear input after adding
        }
    };

    const handleRemoveTeam = (teamToRemove) => {
        setTeams(teams.filter(t => t !== teamToRemove));
    };

    if (!eventKey) return <Alert severity="info">Please enter an Event Key above to load data.</Alert>;

    // DYNAMIC SIZING LOGIC
    // If exactly 4 teams are entered, switch to 2-wide columns (md={6}) to make a 2x2 grid.
    // Otherwise, default to 3-wide columns (md={4}).
    const cardWidth = teams.length === 4 ? 6 : 4;

    return (
        <Box>
            {/* HEADER WITH INLINE ADD BUTTON */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight="bold" color="white">
                    Team Comparison
                </Typography>

                <Paper component="form" onSubmit={handleAddTeam} sx={{ p: '4px 8px', display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
                    <TextField
                        size="small"
                        placeholder="Team #"
                        value={inputTeam}
                        onChange={(e) => setInputTeam(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: '80px', mr: 1, input: { textAlign: 'center', fontWeight: 'bold' } }}
                    />
                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <Button type="submit" color="primary" sx={{ minWidth: 'auto', px: 2, fontWeight: 'bold' }} startIcon={<AddIcon />}>
                        Add
                    </Button>
                </Paper>
            </Box>

            {/* DYNAMIC GRID */}
            <Grid container spacing={3} justifyContent="center">
                {teams.map((team, idx) => {
                    // Subtly keep Red/Blue coloring for the first 6 cards for alliance matchups, 
                    // then default to the primary theme color for picklists.
                    const cardColor = idx < 3 ? "#ff5252" : idx < 6 ? "#448aff" : "#d32f2f";

                    return (
                        <Grid item xs={12} sm={6} md={cardWidth} key={team}>
                            <TeamCard
                                eventKey={eventKey}
                                teamNumber={team}
                                color={cardColor}
                                onRemove={() => handleRemoveTeam(team)}
                            />
                        </Grid>
                    );
                })}
            </Grid>

            {teams.length === 0 && (
                <Typography align="center" color="text.secondary" sx={{ mt: 10 }}>
                    Enter a team number in the top right to start comparing.
                </Typography>
            )}
        </Box>
    );
};

export default MultipleTeams;