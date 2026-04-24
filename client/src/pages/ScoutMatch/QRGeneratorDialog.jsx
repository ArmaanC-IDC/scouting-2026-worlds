// src/pages/ScoutMatch/QRGeneratorDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import QRCode from 'qrcode';

const order = ["eventKey", "matchNumber", "teamNumber", "scoutName", "driverSkill", "defenseSkill", "comments"]

const QRGeneratorDialog = ({ open, onClose, data }) => {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        if (open && data) {
            console.log("data", data);

            console.log("compressed", Object.values(order).map(key => data[key]).join("|"));

            QRCode.toDataURL(Object.values(order).map(key => data[key]).join("|"), { width: 400, margin: 2 })
                .then(url => setQrUrl(url))
                .catch(err => console.error("Error generating QR code", err));
        }
    }, [open, data]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth height="100vh">
            <DialogTitle sx={{ bgcolor: '#111', color: '#0ff', textAlign: 'center' }}>
                Match Data QR Code
            </DialogTitle>
            <DialogContent sx={{ bgcolor: '#222', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', height: "100vh", overflow: "visible" }}>
                {qrUrl ? (
                    <Box
                        component="img"
                        src={qrUrl}
                        alt="Match Data QR"
                        sx={{
                            width: 'min(90vw, 90vh)',
                            height: 'min(90vw, 90vh)',
                            aspectRatio: '1 / 1',
                            borderRadius: 2,
                            border: '4px solid #fff'
                        }}
                    />
                ) : (
                    <Typography color="#aaa">Generating...</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ bgcolor: '#111' }}>
                <Button onClick={onClose} variant="contained" color="primary" fullWidth sx={{ fontWeight: 'bold' }}>
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRGeneratorDialog;