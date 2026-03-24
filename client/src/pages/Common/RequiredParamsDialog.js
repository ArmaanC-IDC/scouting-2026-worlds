import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Box,
  ButtonGroup
} from "@mui/material";
import { ATTENDING_EVENTS, PRACTICE_EVENTS } from "../ScoutMatch/Constants";
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';

// Constant configuration for all supported parameters.
export const SUPPORTED_PARAMS = {
  eventKey: {
    label: "Event Key",
    type: "select",
    options: [...ATTENDING_EVENTS, ...PRACTICE_EVENTS],
  },
  matchKey: {
    label: "Match Key",
    type: "select-text",
    // Added "other" (and standard FRC playoff prefixes if you want them!)
    options: ["qm", "pm", "qf", "sf", "f", "other"] 
  },
  robot: {
    label: "Robot",
    type: "text",
    helperText: "Please confirm the robot number is exactly right"
  },
  station: {
    label: "Station",
    type: "select",
    options: ["r1", "r2", "r3", "b1", "b2", "b3"],
  },
  scout: {
    label: "Scout Name",
    type: "text"
  }
};

const RequiredParamsDialog = ({
  open,
  onSubmit,
  searchParams,
  searchParamsError,
  scoutData,
  offlineOption = false,
  offlineRequiredParamKeys = [],
  requiredParamKeys = ["eventKey"],
}) => {
  const requiredParams = requiredParamKeys
    .map((key) => SUPPORTED_PARAMS[key])
    .filter(Boolean); 

  const getInitialValues = () => {
    const initial = {};
    Object.keys(SUPPORTED_PARAMS).forEach(key => {
      initial[key] = "";
    })
    requiredParamKeys.forEach((key) => {
      initial[key] = searchParams.get(key) || scoutData?.[key] || "";
    });
    return initial;
  };

  const navigate = useNavigate();

  const [values, setValues] = useState(getInitialValues());
  const [networkMode, setNetworkMode] = useState(true);

  useEffect(() => {
    setValues(getInitialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (key, newValue) => {
    setValues((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const handleSubmit = () => {
    const allPresent = requiredParamKeys.every(
      (key) => values[key] && values[key].trim() !== ""
    );
    if (allPresent) {
      onSubmit(values, networkMode);
    }
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Enter Required Information</DialogTitle>
      <Box sx={{width: "90%", justifyContent: "center", display: "flex", alignSelf: "center"}}>
        {offlineOption && <ButtonGroup variant="contained" sx={{width: "100%", display: "flex"}}>
          <Button 
            sx={{color: "#222", bgcolor: networkMode ? "#999" : "#777", width: "100%"}}
            onClick={() => setNetworkMode(true)}
          >ONLINE</Button>
          <Button 
            sx={{color: "#222", bgcolor: !networkMode ? "#999" : "#777", width: "100%"}}
            onClick={() => setNetworkMode(false)}
          >OFFLINE</Button>
        </ButtonGroup>}
      </Box>
      <DialogContent sx={{width: "90%", justifyContent: "center", alignSelf: "center"}}>
        {searchParamsError && (
          <Typography variant="body2" color="error">
            {searchParamsError}
          </Typography>
        )}
        {(networkMode ? requiredParamKeys : offlineRequiredParamKeys).map((key) => {
          const param = SUPPORTED_PARAMS[key];
          if (!param) return null;

          if (param.type === "select") {
            return (
              <FormControl fullWidth margin="normal" key={key}>
                <InputLabel id={`${key}-label`}>{param.label}</InputLabel>
                <Select
                  labelId={`${key}-label`}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  label={param.label}
                >
                  {param.options &&
                    param.options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option.toUpperCase()}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            );
          }
          
          if (param.type === "select-text") {
            // 1. Better Parsing Logic (No Regex)
            const { prefix, number } = (() => {
              const value = values[key] || "";
              if (value === "") return { prefix: "", number: "" };

              // See if the string starts with any known prefix (excluding "other")
              const matchedPrefix = param.options.find(
                opt => opt !== "other" && value.startsWith(opt)
              );

              if (matchedPrefix) {
                return { prefix: matchedPrefix, number: value.slice(matchedPrefix.length) };
              }

              // If no standard prefix matches, it's a custom "other" value
              return { prefix: "", number: value };
            })();

            // 2. Handle dropdown changes
            const handlePrefixChange = (e) => {
              const newPrefix = e.target.value;
              if (newPrefix === "other") {
                handleChange(key, number); // Drop the prefix, keep whatever number they had
              } else {
                handleChange(key, `${newPrefix}${number}`);
              }
            };

            // 3. Handle text input changes
            const handleNumberChange = (e) => {
              const newText = e.target.value;
              if (prefix === "other") {
                handleChange(key, newText); // Treat entire input as the match key
              } else {
                handleChange(key, `${prefix}${newText}`);
              }
            };
            
            return (
              <FormControl fullWidth margin="normal" key={key}>
                <InputLabel shrink id={`${key}-label`}>{param.label}</InputLabel>
                <Box sx={{display: "flex", gap: 1, alignItems: "center", pt: 3}}>
                  <Select
                    labelId={`${key}-label`}
                    value={prefix}
                    onChange={handlePrefixChange}
                    sx={{width: "40%"}}
                  >
                    {param.options &&
                      param.options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option === "other" ? "Other" : option}
                        </MenuItem>
                      ))}
                  </Select>
                  <TextField
                    value={number}
                    onChange={handleNumberChange}
                    placeholder={prefix === "other" ? "Custom key..." : "#"}
                    helperText={param.helperText || ""}
                    sx={{width: "60%"}}
                  />
                </Box>
              </FormControl>
            );
          }

          // Default to text field.
          return (
            <TextField
              key={key}
              label={param.label}
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              fullWidth
              margin="normal"
              helperText={param.helperText || ""}
            />
          );
        })}
      </DialogContent>
      <DialogActions sx={{display: "flex", justifyContent: "space-between"}}>
        <Button
          onClick={() => navigate("/")}
          variant="contained"
          sx={{backgroundColor: "#ddd", color: "#676767"}}
        >
          <HomeIcon/>
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={
            !requiredParamKeys.every(
              (key) => values[key] && values[key].trim() !== ""
            )
          }
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequiredParamsDialog;