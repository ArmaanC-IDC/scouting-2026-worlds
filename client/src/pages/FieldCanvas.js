import { Box } from "@mui/material";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import fullField from "../assets/scouting-2025/field/full_field.png"; // Make sure this path is correct
import {
  CYCLE_TYPES,
  FIELD_ASPECT_RATIO,
  FIELD_VIRTUAL_HEIGHT,
  FIELD_VIRTUAL_WIDTH,
  PERSPECTIVE,
  PHASES,
} from "./ScoutMatch/Constants";

const { SCORING_TABLE_FAR } = PERSPECTIVE;

const isScoringTableFar = (perspective) => perspective === SCORING_TABLE_FAR;

// ===================================================================================
// USER DEFINED MATCH OFFSETS
// Implement your logic here to determine the offset based on the match state
// ===================================================================================

export const getMatchOffset = (match, isBlue) => {
  if (!match) return 0;

  let numAllianceCrossings = 0;
  let numOppCrossings = 0;
  match.cycles.forEach(c => {
    //ignore starting position
    if (Number(c.location)) return ;

    if (c.type===CYCLE_TYPES.AUTO_MOVEMENT && c.location.startsWith("ALL")) {
      numAllianceCrossings++;
    } else if (c.type===CYCLE_TYPES.AUTO_MOVEMENT && c.location.startsWith("OPP")) {
      numOppCrossings++;
    }
  });

  numAllianceCrossings %= 2;
  numOppCrossings %= 2;

  //currently in alliance zone, no offset
  if (numAllianceCrossings===0) return 0;

  //currently in opponent alliance zone
  if (numOppCrossings===1) return isBlue ? 0.38 : -0.38

  return isBlue ? 0.2 : -0.2;
};

export const getMatchButtonOffset = (match, isBlue) =>{
  return getMatchOffset(match, isBlue) * 1;
}


// ===================================================================================
// HOW IT WORKS, PART 1: The Coordinate Scaling Functions
// These two functions are the "single source of truth" for all coordinate math.
// ===================================================================================

const SCREEN_FIELD_VIRTUAL_WIDTH = FIELD_VIRTUAL_WIDTH * 0.62;
const imageScaleGlobal = 1;
// This is the static offset to show the correct half of the field for the blue alliance.
const imageOffsetXGlobal = (isBlue) => isBlue ? -0.382 : 0;

const scaleCoordinates = (
  fieldX, fieldY, width, height, actualWidth, actualHeight, perspective, isBlue, match, flip
) => {
  if (!flip) {
    const topLeftX = fieldX - width / 2;
    const topLeftY = fieldY - height / 2;
    const scaledX = (topLeftX / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;
    const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * actualWidth;
    const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;
    return { scaledX, scaledY, scaledWidth, scaledHeight };
  }

  // Determine the final state of the coordinate system based on perspective and alliance.
  let flipX = false;
  let flipY = false;

  if (isBlue) {
    flipX = !flipX;
  }

  // Apply the final flip state ONCE to the canonical coordinates.
  const finalX = flipX ? FIELD_VIRTUAL_WIDTH - fieldX : fieldX;
  const finalY = flipY ? FIELD_VIRTUAL_HEIGHT - fieldY : fieldY;

  // Adjust from center-point to top-left for CSS positioning.
  const topLeftX = finalX - width / 2;
  const topLeftY = finalY - height / 2;

  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // Combine the static alliance offset with the dynamic match offset.
  const baseImageOffsetX = imageOffsetXGlobal(isBlue);
  const dynamicMatchOffset = getMatchOffset(match, isBlue);
  const totalImageOffsetX = baseImageOffsetX + dynamicMatchOffset;

  // Use the combined total offset in the final scaling calculation.
  const scaledX = ((topLeftX / FIELD_VIRTUAL_WIDTH) * imageScaleGlobal + totalImageOffsetX) * expectedWidth + containerOffsetX;
  const scaledY = (topLeftY / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  const scaledWidth = (width / FIELD_VIRTUAL_WIDTH) * expectedWidth * imageScaleGlobal;
  const scaledHeight = (height / FIELD_VIRTUAL_HEIGHT) * actualHeight;

  return { scaledX, scaledY, scaledWidth, scaledHeight };
};

const scaleToFieldCoordinates = (
  x, y, actualWidth, actualHeight, perspective, isBlue, match, phase
) => {
  const imageScale = imageScaleGlobal;
  const expectedWidth = actualHeight * FIELD_ASPECT_RATIO;
  const containerOffsetX = Math.max((actualWidth - expectedWidth) / 2, 0);

  // 1. Calculate the total offset
  const baseImageOffsetX = imageOffsetXGlobal(isBlue);
  const dynamicMatchOffset = getMatchOffset(match, isBlue);
  const totalImageOffsetX = baseImageOffsetX + dynamicMatchOffset;

  // 2. Remove the container offset and scale to get a percentage of the field image.
  const virtualXPercentWithOffset = (x - containerOffsetX) / expectedWidth;
  
  // 3. Remove the total image offset to get the true canonical percentage.
  const virtualXPercent = (virtualXPercentWithOffset - totalImageOffsetX) / imageScale;

  let fieldX = Math.round(virtualXPercent * FIELD_VIRTUAL_WIDTH);
  let fieldY = Math.round((y / actualHeight) * FIELD_VIRTUAL_HEIGHT);

  // Un-apply the flips
  let flipX = false;
  let flipY = false;

  if (isBlue) {
    flipX = !flipX;
  }

  if (flipX) {
    fieldX = FIELD_VIRTUAL_WIDTH - fieldX;
  }
  if (flipY) {
    fieldY = FIELD_VIRTUAL_HEIGHT - fieldY;
  }

  return { fieldX, fieldY };
};

// ===================================================================================
// FieldLocalComponent
// ===================================================================================
const FieldLocalComponent = ({
  fieldX, fieldY, fieldWidth, fieldHeight, perspective, sx, children, match, flip = true, phase
}) => {
  const localRef = useRef(null);
  const [parentSize, setParentSize] = useState({ width: 300, height: 300 });
  const isBlue = new URLSearchParams(window.location.search).get('station')?.startsWith('b');

  useLayoutEffect(() => {
    const updateSize = () => {
      if (localRef.current?.parentElement) {
        const { clientWidth, clientHeight } = localRef.current.parentElement;
        setParentSize({ width: clientWidth, height: clientHeight });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  let { scaledX, scaledY, scaledWidth, scaledHeight } = scaleCoordinates(
    fieldX, fieldY, fieldWidth, fieldHeight,
    parentSize.width, parentSize.height, perspective, isBlue, match, flip
  );

  return (
    <Box ref={localRef} sx={{ position: "absolute", left: scaledX, top: scaledY, width: scaledWidth, height: scaledHeight, ...sx }}>
      {children}
    </Box>
  );
};


// ===================================================================================
// HOW IT WORKS, PART 2: The Canvas Drawing Effect
// ===================================================================================
const FieldCanvas = forwardRef(
  ({ children, onClick, height, perspective, strokes, match }, ref) => {
    const initialSize = { width: height * FIELD_ASPECT_RATIO, height: height };
    const [canvasSize, setCanvasSize] = useState(initialSize);
    const [cursorCoordinates, setCursorCoordinates] = useState(null);
    const canvasRef = useRef(null);

    const isBlue = new URLSearchParams(window.location.search).get('station')?.startsWith('b');
    const isNear = new URLSearchParams(window.location.search).get('perspective')?.startsWith('n');

    useImperativeHandle(ref, () => ({
      scaleWidthToActual: (virtualWidth) => (virtualWidth * canvasSize.width) / FIELD_VIRTUAL_WIDTH,
      scaleHeightToActual: (virtualHeight) => (virtualHeight * canvasSize.height) / FIELD_VIRTUAL_HEIGHT,
    }));

    useLayoutEffect(() => { setCanvasSize({ width: height * FIELD_ASPECT_RATIO, height: height }); }, [height]);

    // Calculate the total offset dynamically to feed into the useEffect dependency array
    const dynamicOffset = getMatchOffset(match, isBlue);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.src = fullField;

      const totalImageOffsetX = imageOffsetXGlobal(isBlue) + dynamicOffset;

      image.onload = () => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isScoringTableFar(perspective)) {
          ctx.translate(canvas.width * 0.62, canvas.height);
          ctx.scale(-1, -1);
        }

        ctx.drawImage(
          image,
          canvas.width * totalImageOffsetX, 
          0,
          canvas.width * imageScaleGlobal,
          canvas.height
        );

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(canvas.width * totalImageOffsetX, 0, canvas.width * imageScaleGlobal, canvas.height);

        ctx.restore();

        if (strokes && strokes.length > 0) {
          // Stroke logic would go here.
        }
      };
    }, [canvasSize, perspective, strokes, isBlue, dynamicOffset]);

    const handleMouseInteraction = (event, isClick = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const coords = scaleToFieldCoordinates(x, y, canvas.width, canvas.height, perspective, isBlue, match);

      if (isClick && onClick != null) {
        onClick(coords.fieldX, coords.fieldY);
      } else {
        setCursorCoordinates({ canvasX: x, canvasY: y, ...coords });
      }
    };

    const keepInside = (coord, boundary, safety) =>
      boundary - coord < safety ? coord - safety : coord;

    return (
      <Box style={{ position: "relative", width: canvasSize.width, height: canvasSize.height, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          onClick={(e) => handleMouseInteraction(e, true)}
          onMouseMove={(e) => handleMouseInteraction(e)}
          onMouseLeave={() => setCursorCoordinates(null)}
        />
        {children}
        {cursorCoordinates && (
          <Box style={{ position: "absolute", left: keepInside(cursorCoordinates.canvasX + 10, canvasSize.width, 200), top: keepInside(cursorCoordinates.canvasY + 10, canvasSize.height, 30), background: "rgba(0,0,0,0.7)", color: "#fff", padding: "2px 4px", borderRadius: "2px", fontSize: "12px", pointerEvents: "none", whiteSpace: "nowrap" }}>
            FieldX: {Math.round(cursorCoordinates.fieldX)}, FieldY: {Math.round(cursorCoordinates.fieldY)}
          </Box>
        )}
      </Box>
    );
  }
);

export { FieldCanvas, FieldLocalComponent };