import { Typography } from "@mui/material";
import {
  COLORS,
  CYCLE_TYPES,
  GAME_LOCATIONS,
  PHASES,
  AUTO_MAX_TIME
} from "./Constants";
import { StartingPositionSlider } from "./CustomFieldComponents";

const exists = (val) => {
  return val !== null && val !== undefined
}

// Helper to ensure no two timed cycles (scoring, defense, etc.) run at once.
const startNewCycle = (match, cycleType, currentTime) => {
  // End any currently unfinished cycle before starting a new one.
  finishUnfinished(match);

  // Start the new cycle.
  match.setActiveCycle({
    type: cycleType,
    startTime: currentTime,
    phase: match.phase,
  }, `Start ${cycleType} cycle`);
};

const finishUnfinished = (match) => {
  // This function is now simplified. If there's an active cycle,
  // we effectively cancel it by resetting the state.
  // The sidebar logic will handle proper cycle completion.
  if (exists(match.activeCycle.startTime)) {
    match.setActiveCycle({});
  }
};

export const SCOUTING_CONFIG = {
  STARTING_LINE: {
    phases: [PHASES.PRE_MATCH],
    positions: { PRELOAD: [880, 650] },
    dimensions: { width: 0, height: 1410 },
    componentFunction: (match, key) => {
      return <StartingPositionSlider match={match} />
    },
  },

  MOVEMENT: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { 
      ALL_TRENCH: [1030, 210], 
      ALL_BUMP: [1030, 500], 
      OPP_TRENCH: [2500, 210],
      OPP_BUMP: [2500, 500]
    },
    dimensions: { width: 250, height: 250 },
    onClick: (match, key, currentTime) => match.setCycles([...match.cycles, {
      location: key,
      type: CYCLE_TYPES.AUTO_MOVEMENT,
      phase: match.phase,
      startTime: currentTime,
    }], `Move through ${key}`),
    textFunction: (match, key) => {
      return `${key.includes("TRENCH") ? "TRENCH" : "BUMP"}: ${match.cycles.filter(c =>
        c.type === CYCLE_TYPES.AUTO_MOVEMENT &&
        c.location === key
      ).length}`
    },
    color: COLORS.UNDO,
    showFunction: (match, key) => match.phase===PHASES.TELE || key.startsWith("ALL")
  },

  //feed
  FEED: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {[GAME_LOCATIONS.ALLIANCE_ZONE]: [1030, 1200], [GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE]: [2500, 1200]},
    dimensions: { width: 250, height: 600 },
    onClick: (match, key, currentTime) => match.setActiveCycle({
      type: CYCLE_TYPES.FEED,
      startTime: currentTime,
      phase: match.phase,
      location: key,
    }),
    textFunction: () => "Feed",
    color: COLORS.FEED,
    showFunction: () => true,
    isSelected: (match, key) => match.activeCycle.type===CYCLE_TYPES.FEED && match.activeCycle.location===key
  },

  HUB: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { SHOOT: [450, 800]},
    dimensions: { width: 700, height: 1300 },
    textFunction: (match, key) => (
      <Typography sx={{marginRight: match.isScoutingRed ? "-40%" : "40%"}}>
        {key}
      </Typography>
    ),
    color: COLORS.SHOOT,
    fontSize: 10,
    sx: (match) => {
      return {
        fontWeight: 500,
      }
    },
    showFunction: (match, key) => match.cycles.filter(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT).length % 2 === 1,
    onClick: (match, key, currentTime) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.SHOOTING,
        phase: match.phase,
        startTime: currentTime,
        endTime: null,
      });
    },
    onClickEnd: (match, key, currentTime) => {
      match.setActiveCycle({
        ...match.activeCycle,
        endTime: currentTime,
      }, "Shooting Cycle")
    },
    onClickCancel: (match, key, currentTime) => {
      match.setActiveCycle({
        type: null,
        phase: null,
        startTime: null,
        endTime: null
      });
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.SHOOTING && exists(match.activeCycle?.startTime),
  },

  TOWER: {
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: { TOWER: [225, 800] },
    dimensions: { width: 350, height: 300 },
    showFunction: (match, key) => match.cycles.filter(c => c.type === CYCLE_TYPES.AUTO_MOVEMENT).length % 2 === 1,
    textFunction: (match, key) => "HANG",
    color: COLORS.HANG_DEFENSE,
    onClick: (match, key, currentTime) => {
      match.setActiveCycle({
        type: CYCLE_TYPES.HANG,
        phase: match.phase,
        startTime: currentTime,
      });
    },
    isSelected: (match, key) =>
      match.activeCycle?.type === CYCLE_TYPES.HANG,
    fontSize: 90,
    sx: (match) => {
      return {
        fontWeight: 400,
      }
    }
  },

  HISTORY_CONTROLS: {
    // These buttons are available during both Auto and TeleOp
    phases: [PHASES.AUTO, PHASES.TELE],
    positions: {
      UNDO: [1400, 1250],
      REDO: [1900, 1250],
    },
    dimensions: { width: 450, height: 450 },
    textFunction: (match, key) => {
      if (key === 'UNDO' && match.canUndo()) {
        return `Undo: ${match.lastUndoMessage}`; // <-- Displays the message
      }
      else if (key === 'REDO' && match.canRedo()) {
        return (`Redo: ${match.redoMessage}`)
      }
      return key;
    },

    onClick: (match, key) => {
      if (key === "UNDO") {
        match.undo();
      } else {
        match.redo();
      }
    },
    color: COLORS.UNDO,
    showFunction: (match, key) => {
      return key === "UNDO" ? match.canUndo() : match.canRedo();
      // return false;
    },
  },

  // DEFENSE_STEAL: {
  //   phases: [PHASES.TELE],
  //   // New interaction
  //   positions: { STEAL: [2800, 500] },
  //   dimensions: { width: 800, height: 400 },
  //   showFunction: (match, key) => match.isDefending(),
  //   textFunction: (match, key) => "STEAL",
  //   color: COLORS.INTAKE,
  //   fontSize: 70,
  //   onClick: (match, key, currentTime) => {
  //     match.setActiveCycle({
  //       type: CYCLE_TYPES.INTAKE,
  //       phase: match.phase,
  //       location: GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE,
  //       startTime: currentTime
  //     }, `Start Intake (Steal) Cycle`);
  //   },
  //   isSelected: (match, key) =>
  //     match.activeCycle?.type === CYCLE_TYPES.INTAKE && match.activeCycle?.location === GAME_LOCATIONS.OPPONENT_ALLIANCE_ZONE,
  // },

  // DEFENSE_CONTACT: {
  //   phases: [PHASES.TELE],
  //   positions: { CONTACT: [2800, 1200] }, // Replaces BYPASS position
  //   dimensions: { width: 800, height: 400 },
  //   showFunction: (match, key) => match.isDefending(),
  //   textFunction: (match, key) => "CONTACT",
  //   color: COLORS.HANG_DEFENSE,
  //   fontSize: 90,
  //   onClick: (match, key, currentTime) => {
  //     startNewCycle(match, CYCLE_TYPES.CONTACT, currentTime);
  //   },
  //   isSelected: (match, key) =>
  //     match.activeCycle?.type === CYCLE_TYPES.CONTACT,
  // },
};

export const ENDGAME_CONFIG = [
  // --------------------
  // DRIVER SKILL
  // --------------------
  {
    id: "driverSkill",
    type: "SCALE",
    label: "Driver Skill",

    fieldX: 650,
    fieldY: 150,
    width: 1200,
    height: 200,

    min: 0,
    max: 5,

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 2
    }
  },

  // --------------------
  // DEFENSE SKILL
  // --------------------
  {
    id: "defenseSkill",
    type: "SCALE",
    label: "Defense Skill",

    fieldX: 650,
    fieldY: 550,
    width: 1200,
    height: 200,

    min: 0,
    max: 5,

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 5
    }
  },

  // --------------------
  // ACCURACY
  // --------------------
  // {
  //   id: "accuracy",
  //   type: "TOGGLE",
  //   label: "Accuracy",

  //   fieldX: 650,
  //   fieldY: 950,
  //   width: 1200,
  //   height: 200,

  //   options: ["Low", "Med", "High", ],
  //   values: ["Low", "Med", "High", ],

  //   labelParams: {
  //     height: 150
  //   },

  //   rowParams: {
  //     gap: 5
  //   }
  // },

  // // ---------------------
  // // DISABLED STATUS
  // // ---------------------
  {
    id: "disabled",
    type: "TOGGLE",
    label: "Disabled?",

    fieldX: 1500,
    fieldY: 150,
    width: 1200,
    height: 200,

    options: ["No", "Yes"],
    values: ["No", "Yes"],

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 5
    }
  },

  // --------------------
  // ROLES WITH RATINGS
  // --------------------

  {
    id: "roles",
    type: "OPTIONS",
    label: "Robot Roles",

    fieldX: 1500,
    fieldY: 550,
    width: 1200,
    height: 200,

    options: ["Cycle", "Defense", "Feed", "Steal"],

    labelParams: {
      height: 150
    },

    rowParams: {
      gap: 2
    }
  },

  // --------------------
  // COMMENTS
  // --------------------
  {
    id: "comments",
    type: "TEXT_AREA",
    label: "Comments",

    fieldX: 2050,
    fieldY: 775,
    width: 700,
    height: 1450,

    labelParams: {
      height: 150
    },

    textParams: {
      y: 170
    }
  },
]