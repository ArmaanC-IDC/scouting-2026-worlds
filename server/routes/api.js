import express from "express";
import { customAlphabet } from "nanoid";
import { fetchMatches, fetchTeams } from "../services/tba.js";
import { verifyToken } from "./auth.js";
import { getTeams, storeTeams } from "../database/team.js";

// no underscores vs default alphabet
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 12);

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.post("/matches", verifyToken, async (req, res) => {
  const { event_code } = req.body;
  if (!event_code || !/^[a-zA-Z0-9_]+$/.test(event_code)) {
    return res.status(400).json({ message: "Invalid or missing event code" });
  }

  try {
    const matches = await fetchMatches(event_code);
    await storeOrUpdateMatches(req, event_code, matches);

    const teams = await fetchTeams(event_code);
    await storeTeams(req, event_code, teams);
    res.json({
      message: "Matches stored/updated successfully",
      count: matches.length,
    });
  } catch (error) {
    console.error("Error processing match data:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.get("/teams", verifyToken, async (req, res) => {
  const { eventKey, teams } = req.body;
  if (!eventKey) return res.status(400).json({ message: "Missing event key" });

  try {
    const teamsData = await getTeams(req, eventKey, teams);
    return res.json(teamsData.rows);
  } catch (error) {
    console.error("Error getting teams", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;