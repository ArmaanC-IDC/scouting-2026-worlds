import { Slider } from "@mui/material";
import { COLORS } from "./Constants";

export const ImageIcon = (imageSrc) => (
  <span
    style={{
      display: "block",
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    <img
      src={imageSrc}
      style={{
        display: "block",
        objectFit: "cover",
        height: "100%",
        width: "100%",
        pointerEvents: "none",
      }}
    />
  </span>
);

export const StartingPositionSlider = (match) => {
  const flipSlider = match.isScoutingRed;

  return (
    <Slider
      orientation="vertical"
      value={flipSlider ? 10 - match.startingPosition : match.startingPosition}
      onChange={(event, value) => match.setStartingPosition(flipSlider ? 10 - value : value)}
      min={1}
      max={10}
      step={1}
      valueLabelDisplay="on"
      valueLabelFormat={(value) => <div>{match.scoutData?.teamNumber}</div>}
      sx={{
        marginTop: `${match.fieldCanvasRef.current?.scaleHeightToActual(
          150
        )}px`,
        marginBottom: `${match.fieldCanvasRef.current?.scaleHeightToActual(
          150
        )}px`,
        padding: 0,
        "& .MuiSlider-thumb": {
          width: match.fieldCanvasRef.current?.scaleWidthToActual(300) || 0,
          height: match.fieldCanvasRef.current?.scaleHeightToActual(300) || 0,
          margin: 0,
          backgroundPosition: "center",
          backgroundSize: "cover",
          borderRadius: 0,
        },
        "& .MuiSlider-track": {
          color: match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
        },
        "& .MuiSlider-rail": {
          color: match.startingPosition == -1 ? COLORS.DISABLED : COLORS.ACTIVE,
        },
      }}
    />
  );
};