import { Box, Button, Paper, Typography, TextField } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";
import LZString from 'lz-string';
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScoutMatch, submitMatch } from "../requests/ApiRequests";
import AppAlert from "./Common/AppAlert.js";

import { BinaryDTO } from "../storage/BinaryDTO";
import { MATCH_SCHEMA } from "../storage/ScoutingSchema";

const ScanQR = () => {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    
    // New states for the editable JSON
    const [editableJson, setEditableJson] = useState("");
    const [jsonError, setJsonError] = useState("");

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlert = (message) => {
        setAlertMessage(message);
        setAlertOpen(true);
    };

    const qrInstance = useRef(null);

    useEffect(() => {
        if (!qrInstance.current) {
            qrInstance.current = new Html5Qrcode("reader");
        }
        const html5QrCode = qrInstance.current;

        const stopScanner = async () => {
            if (html5QrCode && html5QrCode.isScanning) {
                try {
                    await html5QrCode.stop();
                    const readerEl = document.getElementById("reader");
                    if (readerEl) readerEl.innerHTML = "";
                } catch (err) {
                    console.error("Failed to stop scanner", err);
                }
            }
        };

        const onScanSuccess = (decodedText) => {
            console.log("Binary String Scanned:", decodedText);
            setResult(decodedText);
            stopScanner();
            tryUnpack(decodedText);
        };

        const startScanner = async () => {
            try {
                if (html5QrCode.isScanning) return;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 280, height: 280 } },
                    onScanSuccess
                );
            } catch (err) {
                console.error("Scanner start error:", err);
            }
        };

        startScanner();
        return () => stopScanner();
    }, []);

    const tryUnpack = async (str) => {
        try {
            let workingStr = str;
            // 1. Try LZ Decompression
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(str);
                if (decompressed) workingStr = decompressed;
            } catch (lzErr) { /* ignore */ }

            const dto = new BinaryDTO(MATCH_SCHEMA);
            const data = dto.unpack(workingStr);

            // 2. Reconstruct Time
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const fullMatchStart = startOfToday + data.matchStart;

            // 3. Cycle Reconstruction
            const processedCycles = (data.cycles || []).map(cycle => {
                let rateValue = 0;
                if (cycle.type === "SHOOT") rateValue = data.shotRate || 0;
                if (cycle.type === "SNOWBALL") rateValue = data.snowballRate || 0;

                return {
                    ...cycle,
                    startTime: cycle.startTime * 100,
                    endTime: (cycle.startTime + cycle.duration) * 100,
                    phase: (cycle.phase || "TELE").toLowerCase(),
                    rate: rateValue
                };
            });

            // 4. Match Key handling
            data.matchKey = `${data.matchType}${data.matchNumber}`;

            // 5. Fetch Metadata from Server
            showAlert("Syncing with schedule...");
            const res = await getScoutMatch({
                eventKey: data.eventKey,
                matchKey: data.matchKey,
                station: data.station,
                scoutId: data.scoutId
            });

            const { reportId, teamNumber, username } = res.data;

            // 6. Final Data Assembly
            const finalParsedData = {
                ...data,
                match_start_time: fullMatchStart,
                reportId: reportId,
                robot: teamNumber,
                scoutName: username || `Scout #${data.scoutId}`,
                cycles: processedCycles
            };

            // 7. Generate Final Payload immediately so it can be edited
            const reportPayload = {
                eventKey: finalParsedData.eventKey, // Needed for API wrapper
                matchKey: finalParsedData.matchKey, // Needed for API wrapper
                reportId: finalParsedData.reportId,
                matchStartTime: finalParsedData.match_start_time,
                match_start_time: finalParsedData.match_start_time,
                robot: String(finalParsedData.robot),
                station: finalParsedData.station,
                scoutId: finalParsedData.scoutId,
                scoutName: finalParsedData.scoutName,
                endgame: {
                    disabled: finalParsedData.disabled || "No",
                    driverSkill: String(finalParsedData.driverSkill || "0"),
                    defenseSkill: String(finalParsedData.defenseSkill || "0"),
                    accuracy: String(finalParsedData.accuracy || "NONE"),
                    roles: (finalParsedData.roles || []).filter(r => r !== "NONE"),
                    comments: finalParsedData.comments || ""
                },
                cycles: finalParsedData.cycles,
            };

            setParsedData(finalParsedData);
            
            // Format the JSON payload with 2 spaces for readability
            setEditableJson(JSON.stringify(reportPayload, null, 2));

            showAlert(`Match ${finalParsedData.matchKey} for Team ${teamNumber} loaded!`);

        } catch (e) {
            console.error("Critical Unpack Error:", e);
            showAlert("Format Error: This QR code is not recognized.");
        }
    };

    // Validates JSON on the fly as the user types
    const handleJsonChange = (e) => {
        const newValue = e.target.value;
        setEditableJson(newValue);
        try {
            JSON.parse(newValue);
            setJsonError(""); // Valid JSON
        } catch (err) {
            setJsonError("Invalid JSON format");
        }
    };

    const handleSubmit = async () => {
        if (!editableJson) return;

        let finalPayload;
        try {
            finalPayload = JSON.parse(editableJson);
        } catch (err) {
            showAlert("Cannot submit: Invalid JSON format.");
            return;
        }

        try {
            showAlert("Submitting to Server...");

            const res = await submitMatch({
                eventKey: finalPayload.eventKey,
                matchKey: finalPayload.matchKey,
                station: finalPayload.station,
                matchData: finalPayload 
            });

            if (res.status === 200) {
                showAlert("Match Submitted Successfully");
            } else {
                showAlert("Server Error: " + res.status);
            }
        } catch (err) {
            showAlert("Network Error: Could not reach server.");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#222", p: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Paper sx={{ p: 4, bgcolor: "#333", color: "#fff", width: "100%", maxWidth: "800px", textAlign: "center" }}>
                <Typography variant="h5" mb={3}>Lead Scout Scanner</Typography>

                {!result ? (
                    <Box id="reader" sx={{ width: "100%", borderRadius: "12px", overflow: "hidden" }} />
                ) : (
                    <Box>
                        {parsedData ? (
                            <Box sx={{ textAlign: "left", bgcolor: "#111", p: 2, borderRadius: 2, mb: 2 }}>
                                <Typography variant="subtitle1" mb={1} sx={{ color: "#aaa" }}>
                                    Review and edit data before submission:
                                </Typography>
                                
                                <TextField
                                    multiline
                                    fullWidth
                                    minRows={10}
                                    maxRows={20}
                                    value={editableJson}
                                    onChange={handleJsonChange}
                                    error={!!jsonError}
                                    helperText={jsonError || "Valid JSON payload"}
                                    InputProps={{
                                        style: {
                                            fontFamily: 'monospace',
                                            fontSize: '13px',
                                            color: '#fff',
                                            backgroundColor: '#222'
                                        }
                                    }}
                                    FormHelperTextProps={{
                                        style: { color: jsonError ? '#f44336' : '#4caf50' }
                                    }}
                                />
                            </Box>
                        ) : (
                            <Typography color="error">Invalid Data</Typography>
                        )}

                        <Button 
                            variant="contained" 
                            color="success" 
                            fullWidth 
                            onClick={handleSubmit} 
                            disabled={!!jsonError} // Prevent submission if JSON is broken
                            sx={{ mb: 1, py: 1.5, fontSize: "1.1rem", fontWeight: "bold" }}
                        >
                            Upload to Database
                        </Button>
                        <Button variant="outlined" fullWidth onClick={() => window.location.reload()}>
                            Scan Next
                        </Button>
                    </Box>
                )}
            </Paper>
            <AppAlert open={alertOpen} message={alertMessage} onClose={() => setAlertOpen(false)} />
        </Box>
    );
};

export default ScanQR;