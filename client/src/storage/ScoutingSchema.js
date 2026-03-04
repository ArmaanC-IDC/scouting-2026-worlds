import { CYCLE_TYPES, HANG_LEVELS } from "../pages/ScoutMatch/Constants";

// We create arrays from your constants so the DTO can use their index as the ID
const cycleTypeMap = Object.values(CYCLE_TYPES);
const hangLevelMap = Object.keys(HANG_LEVELS);

export const MATCH_SCHEMA = [
  { key: "schemaVersion", type: "uint8" }, // Always start with a version!
  { key: "reportId", type: "uint16" },
  { key: "robot", type: "uint16" },
  { key: "scoutId", type: "uint8" },
  
  // Flattening the Endgame Object
  { key: "endgame_hangLevel", type: "uint8", map: hangLevelMap },
  { key: "endgame_snowballRate", type: "uint8" },
  { key: "endgame_shotRate", type: "uint8" },

  // The Repeating Cycles
  { 
    key: "cycles", 
    type: "array", 
    itemSchema: [
       { key: "type", type: "uint8", map: cycleTypeMap },
       { key: "success", type: "bool" },
       { key: "location", type: "uint8" }, // Used for starting pos or hang level
       { key: "pinCount", type: "uint8" },
       { key: "foulCount", type: "uint8" },
       { key: "rate", type: "uint8" }
    ]
  }
];