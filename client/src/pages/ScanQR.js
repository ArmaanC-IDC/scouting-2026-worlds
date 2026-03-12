import { Box, Button, Paper, Typography } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";
import LZString from 'lz-string';
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScoutMatch, submitMatch } from "../requests/ApiRequests";
import AppAlert from "./Common/AppAlert.js";

// --- ADD THESE IMPORTS ---
import { BinaryDTO } from "../storage/BinaryDTO";
import { MATCH_SCHEMA } from "../storage/ScoutingSchema";

const ScanQR = () => {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [parsedData, setParsedData] = useState(null);
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
            tryUnpack(decodedText); // <--- Switch to the Unpacker
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
            // 1. Try LZ Decompression (though BinaryDTO usually handles its own base45)
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(str);
                if (decompressed) workingStr = decompressed;
            } catch (lzErr) { /* ignore */ }

            const dto = new BinaryDTO(MATCH_SCHEMA);
            const data = dto.unpack(workingStr);

            // 2. Reconstruct Time (ms since midnight -> full Unix timestamp)
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const fullMatchStart = startOfToday + data.matchStart;

            // 3. Cycle Reconstruction (Inflate time & Inject rates)
            const processedCycles = (data.cycles || []).map(cycle => {
                let rateValue = 0;
                if (cycle.type === "SHOOT") rateValue = data.shotRate || 0;
                if (cycle.type === "SNOWBALL") rateValue = data.snowballRate || 0;

                return {
                    ...cycle,
                    startTime: cycle.startTime * 100,
                    endTime: (cycle.startTime + cycle.duration) * 100,
                    phase: (cycle.phase || "TELE").toLowerCase(), // Match DB 'auto'/'tele'
                    rate: rateValue // Important for the cycles table
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

            const { reportId, teamNumber, username } = res.data; // reportId and teamNumber

            // 6. Final Data Assembly
            setParsedData({
                ...data,
                match_start_time: fullMatchStart,
                reportId: reportId,
                robot: teamNumber,
                scoutName: username || `Scout #${data.scoutId}`,
                cycles: processedCycles
            });

            showAlert(`Match ${data.matchKey} for Team ${teamNumber} loaded!`);

        } catch (e) {
            console.error("Critical Unpack Error:", e);
            showAlert("Format Error: This QR code is not recognized.");
        }
    };

    const handleSubmit = async () => {
        if (!parsedData) return;
        try {
            showAlert("Submitting to Server...");

            // 7. THE TRANSLATION LAYER (CamelCase -> Snake_Case)
            // This ensures the main report table columns are populated
            const reportPayload = {
                reportId: parsedData.reportId,
                matchStartTime: parsedData.match_start_time, // Backend expects matchStartTime (camelCase)
                match_start_time: parsedData.match_start_time, // For matchReportHelper
                robot: String(parsedData.robot),
                station: parsedData.station,
                scoutId: parsedData.scoutId,
                scoutName: parsedData.scoutName,

                // THE MISSING PIECE: The Backend wants these inside an 'endgame' object
                endgame: {
                    disabled: parsedData.disabled || "No",
                    driverSkill: String(parsedData.driverSkill || "0"),
                    defenseSkill: String(parsedData.defenseSkill || "0"),
                    accuracy: String(parsedData.accuracy || "NONE"),
                    roles: (parsedData.roles || []).filter(r => r !== "NONE"),
                    comments: parsedData.comments || ""
                },

                // Metadata for cycles
                cycles: parsedData.cycles,
            };

            const res = await submitMatch({
                eventKey: parsedData.eventKey,
                matchKey: parsedData.matchKey,
                station: parsedData.station,
                matchData: reportPayload // The perfectly formatted payload
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
            <Paper sx={{ p: 4, bgcolor: "#333", color: "#fff", width: "100%", maxWidth: "500px", textAlign: "center" }}>
                <Typography variant="h5" mb={3}>Lead Scout Scanner</Typography>

                {!result ? (
                    <Box id="reader" sx={{ width: "100%", borderRadius: "12px", overflow: "hidden" }} />
                ) : (
                    <Box>
                        {parsedData ? (
                            <Box sx={{ textAlign: "left", bgcolor: "#111", p: 2, borderRadius: 2, mb: 2 }}>
                                <Typography><strong>Robot:</strong> {parsedData.robot} ({parsedData.station})</Typography>
                                <Typography><strong>Match:</strong> {parsedData.matchKey}</Typography>
                                <Typography><strong>Cycles:</strong> {parsedData.cycles?.length || 0}</Typography>
                                <Typography><strong>Hang:</strong> {parsedData.endgame_hangLevel}</Typography>
                            </Box>
                        ) : (
                            <Typography color="error">Invalid Data</Typography>
                        )}

                        <Button variant="contained" color="success" fullWidth onClick={handleSubmit} sx={{ mb: 1 }}>
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