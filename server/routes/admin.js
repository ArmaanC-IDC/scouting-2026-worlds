// routes/admin.js
import express from "express";
import { storeTeams } from "../database/team.js";
import { verifyToken } from "./auth.js";

const router = express.Router();

router.post("/addTeamsToEvent", verifyToken, async (req, res) => {
  const { eventKey, teams } = req.body;
  if (!eventKey || !teams) {
    return res.status(400).json({ message: "Missing eventKey or teams" });
  }

  try {
    storeTeams(req, eventKey, teams);
    res.status(200).json({ message: "Stored teams" });
  } catch (error) {
    console.error(error);
    res.status(500), json({ message: "Error saving teams" });
  }
});

export default router;
