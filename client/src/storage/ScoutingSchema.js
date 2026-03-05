import { CYCLE_TYPES, HANG_LEVELS } from "../pages/ScoutMatch/Constants";

/**
 * ENUMS: These dictate the "Order of Bits" in the DTO.
 * ALWAYS add "NONE" at index 0 to prevent ghost data.
 */
export const DTO_MAPS = {
  hangLevels: ["NONE", ...Object.keys(HANG_LEVELS)], // ["NONE", "LEVEL_1", "LEVEL_2", "LEVEL_3"]
  cycleTypes: ["NONE", ...Object.values(CYCLE_TYPES)],
  rates: [0, 1, 3, 6, 9], // Mapping BPS_RANGES values to simple indices
};

/**
 * THE MASTER SCHEMA: This dictates exactly what the BinaryDTO packs.
 * We include BOTH Auto Hang and Endgame Hang for the 2026 game.
 */
export const MATCH_SCHEMA = [
  { key: "schemaVersion", type: "uint8" },
  { key: "reportId", type: "uint16" },
  { key: "robot", type: "uint16" },
  { key: "scoutId", type: "uint8" },

  // 2026 Specifics
  { key: "auto_hangLevel", type: "uint8", map: DTO_MAPS.hangLevels },
  { key: "endgame_hangLevel", type: "uint8", map: DTO_MAPS.hangLevels },

  // Rates & Stats
  { key: "snowballRate", type: "uint8", map: DTO_MAPS.rates },
  { key: "shotRate", type: "uint8", map: DTO_MAPS.rates },

  // The Timeline (The "Spaghetti-Proof" Event Stream)
  {
    key: "cycles",
    type: "array",
    itemSchema: [
      { key: "type", type: "uint8", map: DTO_MAPS.cycleTypes },
      { key: "success", type: "bool" },
      { key: "startTime", type: "uint16" }, // Seconds or offset from match start
      { key: "endTime", type: "uint16" },
      { key: "location", type: "uint8" }
    ]
  }
];

export const prepareMatchForDTO = (matchState) => {
  // Find the hangs in the cycle list if they aren't in the endgame object
  const autoHang = matchState.cycles.find(c => c.type === "AUTO_MOVEMENT" && c.isHang)?.location;
  const endHang = matchState.cycles.find(c => c.type === "HANG")?.location;

  return {
    schemaVersion: 1,
    reportId: matchState.scoutData?.reportId || 0,
    robot: matchState.scoutData?.teamNumber || 0,
    scoutId: matchState.userToken?.id || 0,

    // Map the messy data to the clean schema keys
    auto_hangLevel: autoHang || "NONE",
    endgame_hangLevel: endHang || "NONE",

    snowballRate: matchState.endgame?.snowballRate || 0,
    shotRate: matchState.endgame?.shotRate || 0,

    // Keep the raw cycle data for time analysis
    cycles: matchState.cycles.map(c => ({
      type: c.type,
      success: !!c.success,
      startTime: Math.floor(c.startTime / 1000), // Convert ms to seconds to fit uint16
      endTime: Math.floor(c.endTime / 1000),
      location: c.location || 0
    }))
  };
};