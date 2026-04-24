// src/pages/Strategy/Summary.js
import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Box, Typography
} from '@mui/material';
import { getReports } from '../../requests/ApiRequests';

const Summary = ({ eventKey, onTeamClick }) => {
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndProcess = async () => {
      if (!eventKey) return;
      setLoading(true); setError(null);
      try {
        const response = await getReports({ eventKey });
        const payload = response.data?.reports || response.data?.data || response.data || response;
        const reports = Array.isArray(payload) ? payload : [];

        const teamMap = {};
        reports.forEach(report => {
          const team = report.teamNumber || report.team_number;
          if (!team) return;

          if (!teamMap[team]) {
            teamMap[team] = { teamNumber: team, matches: 0, driverSum: 0, driverCount: 0, defenseSum: 0, defenseCount: 0 };
          }
          teamMap[team].matches += 1;

          const dSkill = parseInt(report.driverSkill || report.driver_skill);
          if (!isNaN(dSkill)) { teamMap[team].driverSum += dSkill; teamMap[team].driverCount += 1; }

          const defSkill = parseInt(report.defenseSkill || report.defense_skill);
          if (!isNaN(defSkill)) { teamMap[team].defenseSum += defSkill; teamMap[team].defenseCount += 1; }
        });

        const processed = Object.values(teamMap).map(team => ({
          ...team,
          avgDriver: team.driverCount > 0 ? (team.driverSum / team.driverCount).toFixed(1) : "N/A",
          avgDefense: team.defenseCount > 0 ? (team.defenseSum / team.defenseCount).toFixed(1) : "N/A"
        })).sort((a, b) => parseInt(a.teamNumber) - parseInt(b.teamNumber));

        setTeamStats(processed);
      } catch (err) {
        setError("Failed to load event data. Check connection or event key.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcess();
  }, [eventKey]);

  if (!eventKey) return <Alert severity="info">Please enter an Event Key in the top bar to load data.</Alert>;
  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress color="primary" /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" color="white">Event Overview</Typography>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#d32f2f' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>Team</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#fff' }}>Matches</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#fff' }}>Avg Driver</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#fff' }}>Avg Defense</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamStats.map((team) => (
              <TableRow
                key={team.teamNumber} hover
                onClick={() => onTeamClick(team.teamNumber)}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#333 !important' } }}
              >
                <TableCell sx={{ color: '#0ff', fontWeight: 'bold', fontSize: '1.1rem' }}>{team.teamNumber}</TableCell>
                <TableCell align="center">{team.matches}</TableCell>
                <TableCell align="center">{team.avgDriver}</TableCell>
                <TableCell align="center">{team.avgDefense}</TableCell>
              </TableRow>
            ))}
            {teamStats.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">No data found for this event.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Summary;