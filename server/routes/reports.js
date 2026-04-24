// reports.js
import express from "express";
import {
  getReports,
  storeReport
} from "../database/reports.js";
import { verifyToken } from "./auth.js";

const router = express.Router();

/**
 * GET /api/reports
 *
 * Query parameters:
 *   - eventKey (required)
 *   - matchKey (optional)
 *   - robot (optional)
 *
 * Returns a list of reports (each with attached cycles) filtered by the provided parameters,
 * and averages as a map of robot -> calculateAverageMetrics(reportsForRobot).
 * If a robot is provided, also returns that robot’s pit scouting data.
 */
router.get("/", verifyToken, async (req, res) => {
  const { eventKey, matchKey, robot } = req.query;
  if (!eventKey) {
    return res.status(400).json({ error: "Missing eventKey query parameter" });
  }
  try {
    // Get filtered reports (this may already filter by robot/matchKey)
    const reports = await getReports(
      req,
      eventKey,
      matchKey,
      robot
    );

    if (reports.length === 0) {
      return res.status(204).json({ data: [] });
    }

    // Group reports by robot
    const reportsByRobot = {};
    reports.forEach((report) => {
      const robotId = report.team_number; // assuming the report object has a "robot" field
      if (!reportsByRobot[robotId]) {
        reportsByRobot[robotId] = [];
      }
      reportsByRobot[robotId].push(report);
    });

    res.json({ reports });
  } catch (error) {
    console.error("Error fetching filtered reports:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// New route to submit a match, storing both report and cycles
router.post("/submit", verifyToken, async (req, res) => {
  const { eventKey, matchNumber, teamNumber, scoutName, driverSkill, defenseSkill, comments } = req.body;

  // Validate required parameters
  if (!eventKey || !matchNumber || !teamNumber || !scoutName || !driverSkill || !defenseSkill || !comments) {
    return res
      .status(400)
      .json({ message: "Missing required parameters" });
  }

  try {
    // Store report and cycles in sequence.
    await storeReport(req, { eventKey, matchNumber, teamNumber, scoutName, driverSkill, defenseSkill, comments });

    res.status(200).json({
      message: "Match submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting match:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
