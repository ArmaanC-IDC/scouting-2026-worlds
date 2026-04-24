// server/database/reports.js
import { USER_ROLES } from "./auth.js";
import { pgClient, protectOperation } from "./PgClient.js";

export const storeReportInternal = async (report) => {
  const client = await pgClient();
  try {
    // Updated table schema with unpacked endgame fields.
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scout_reports (
        id TEXT,
        team_number INT,
        event_key TEXT,
        scout_name TEXT,
        driver_skill TEXT,
        defense_skill TEXT,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        match_number INT
      );
    `;
    await client.query(createTableQuery);

    const insertQuery = `
      INSERT INTO scout_reports 
        (id, team_number, event_key, scout_name, driver_skill, defense_skill, comments, match_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [
      `report_${report.eventKey}_${report.teamNumber}_${report.matchNumber}_${report.scoutName}_${report.driverSkill}_${report.defenseSkill}_${report.comments}`,
      report.teamNumber,
      report.eventKey,
      report.scoutName,
      report.driverSkill,
      report.defenseSkill,
      report.comments,
      report.matchNumber,
    ];

    const result = await client.query(insertQuery, values);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error("DUPLICATE_REPORT");
    }
    throw error;
  } finally {
    await client.release();
  }
};

export const getReportsInternal = async (eventKey, matchNumber, teamNumber) => {
  const tableName = `scout_reports`;
  const client = await pgClient();
  try {
    let query = `
      SELECT *
      FROM ${tableName}
      WHERE event_key = $1
    `;
    let values = [eventKey];
    if (matchNumber) {
      query += ` AND match_number = $2`;
      values.push(matchNumber);
    }
    if (teamNumber) {
      query += ` AND team_number = $${values.length + 1}`;
      values.push(teamNumber);
    }
    const result = await client.query(query, values);
    return result.rows;
  } finally {
    await client.release();
  }
};

export const getReports = protectOperation(getReportsInternal, [USER_ROLES.USER]);
export const storeReport = protectOperation(storeReportInternal, [
  USER_ROLES.USER,
]);
