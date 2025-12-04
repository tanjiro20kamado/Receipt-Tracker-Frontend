import React, { useState } from "react";
import axios from "axios";
 
import {
  Box,
  Button,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Stack,
  LinearProgress,
  Switch,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
 
import { createTheme, ThemeProvider } from "@mui/material/styles";
 
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PhotoIcon from "@mui/icons-material/Photo";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AnalyticsIcon from "@mui/icons-material/Analytics";
 
function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);          // current receipt (duplicate or normal)
  const [original, setOriginal] = useState(null);      // original receipt (if duplicate)
  const [duplicateInfo, setDuplicateInfo] = useState(null); // duplicate meta
const [duplicatePair, setDuplicatePair] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState("light");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");
 
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            background: { default: "#f2faff" },
            text: { primary: "#003244" }
          }
        : {
            background: { default: "#0a0f1c" },
            text: { primary: "#dffcff" }
          })
    }
  });
 
  const uploadAndProcess = async () => {
    if (!file) return alert("Please choose a file first.");
    setLoading(true);
    setProgress(0);
    setResult(null);
    setOriginal(null);
    setDuplicateInfo(null);
    setDuplicatePair(null);
 
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("http://localhost:8000/process", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setResult(res.data.result);
      if (res.data.duplicate && res.data.result.duplicate_of) {
    const pair = await axios.get(
      `http://localhost:8000/duplicate-pair/${res.data.result.id}`
    );
    setDuplicatePair(pair.data);
}
 
      // Store duplicate metadata
      setDuplicateInfo({
        duplicate: res.data.duplicate,
        duplicate_of: res.data.duplicate_of,
        status: res.data.status
      });
 
      // If duplicate fetch original receipt
      if (res.data.duplicate && res.data.duplicate_of) {
        const orig = await axios.get(`http://localhost:8000/receipt/${res.data.duplicate_of}`);
        setOriginal(orig.data.result);
      }
 
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };
 
  // ---------------------- Admin Approve / Reject -----------------------
 const approveDuplicate = async () => {
  if (!result?.id) {
    setDialogMessage("No receipt ID found.");
    setDialogType("error");
    setDialogOpen(true);
    return;
  }
 
  try {
    const res = await axios.post(`http://localhost:8000/approve/${result.id}`);
    setDialogMessage(res.data.message || "Receipt approved successfully!");
    setDialogType("success");
    setDialogOpen(true);
    
    // Clear duplicate-related UI
    setDuplicateInfo(null);
    setDuplicatePair(null);
  } catch (err) {
    setDialogMessage("Error approving receipt: " + (err.response?.data?.detail || err.message));
    setDialogType("error");
    setDialogOpen(true);
  }
};
 
 
 const rejectDuplicate = async () => {
  if (!result?.id) {
    setDialogMessage("No receipt ID found.");
    setDialogType("error");
    setDialogOpen(true);
    return;
  }
 
  try {
    const res = await axios.post(`http://localhost:8000/reject/${result.id}`);
    setDialogMessage(res.data.message || "Receipt rejected as fraud!");
    setDialogType("error");
    setDialogOpen(true);
    
    // Clear duplicate-related UI
    setDuplicateInfo(null);
    setDuplicatePair(null);
  } catch (err) {
    setDialogMessage("Error rejecting receipt: " + (err.response?.data?.detail || err.message));
    setDialogType("error");
    setDialogOpen(true);
  }
};
 
 
  // ---------------------- UI Rendering ----------------------
return (
  <ThemeProvider theme={theme}>
    <Box
  sx={{
    minHeight: "100vh",
    pt: 1,          // reduced top padding
    pb: 3,
    px: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background:
      mode === "light"
        ? "linear-gradient(to bottom, #e0f7ff, #ffffff)"
        : "linear-gradient(to bottom, #0a0f1c, #001e2b)",
    color: theme.palette.text.primary,
    position: "relative",
    overflow: "hidden"
  }}
>
 
 
      {/* Background Shapes */}
      <Box
        sx={{
          position: "absolute",
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
          background:
            mode === "light"
              ? "radial-gradient(circle, #a0f0ff 10%, transparent 70%)"
              : "radial-gradient(circle, #12a38b 15%, transparent 70%)",
          transform: "rotate(45deg)",
          opacity: 0.05,
          pointerEvents: "none"
        }}
      />
 
      {/* Theme Toggle */}
      <Box sx={{ width: "100%", maxWidth: 900, display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Typography sx={{ mr: 1 }}>{mode === "light" ? "Light Mode" : "Dark Mode"}</Typography>
        <Switch checked={mode === "dark"} onChange={() => setMode(mode === "light" ? "dark" : "light")} />
      </Box>
 
      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: "bold", mb: 1 }}>
          Smart Expense Receipt Categorizer
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8 }}>
          Upload your receipts and see them categorized instantly.
        </Typography>
        <ReceiptLongIcon sx={{ fontSize: 70, mt: 2, color: mode === "dark" ? "#12a38b" : "#00b4db" }} />
      </Box>
 
      {/* Upload Section */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 900,
          p: 4,
          mb: 3,
          borderRadius: 4,
          background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.15)"
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Upload Image / PDF
        </Typography>
 
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            component="label"
            startIcon={<PhotoIcon />}
            sx={{
              background: "linear-gradient(135deg, #2cdfff, #1cb5e0)",
              textTransform: "none",
              borderRadius: 3
            }}
          >
            Choose File
            <input
              hidden
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                setProgress(0);
                setResult(null);
                setOriginal(null);
                setDuplicateInfo(null);
                setDuplicatePair(null);
              }}
            />
          </Button>
 
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
            onClick={uploadAndProcess}
            sx={{
              background: "linear-gradient(135deg, #34e89e, #0fcd84)",
              textTransform: "none",
              borderRadius: 3
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Upload & Process"}
          </Button>
        </Stack>
 
        {file && (
          <Typography sx={{ mt: 2, fontSize: 18 }}>
            Selected File: <b>{file.name}</b>
          </Typography>
        )}
 
        {loading && (
          <Box sx={{ mt: 3 }}>
            <Typography>Uploading: {progress}%</Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 12, borderRadius: 6 }}
            />
          </Box>
        )}
      </Box>
 
      {/* Duplicate Warning Banner */}
      {duplicateInfo?.duplicate && (
        <Box
          sx={{
            background: "rgba(255,200,0,0.2)",
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid orange",
            textAlign: "center",
            maxWidth: 900,
            width: "100%"
          }}
        >
          <Typography variant="h6" sx={{ color: "orange" }}>
            ⚠️ Duplicate Receipt Detected — Requires Admin Review
          </Typography>
 
          <Typography sx={{ mt: 1 }}>
            This seems similar to receipt ID: <b>{duplicateInfo.duplicate_of}</b>
          </Typography>
        </Box>
      )}
 
      {/* Admin Action Buttons */}
      {duplicateInfo?.duplicate && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button variant="contained" color="success" onClick={approveDuplicate}>
            Approve Duplicate
          </Button>
 
          <Button variant="contained" color="error" onClick={rejectDuplicate}>
            Reject as Fraud
          </Button>
        </Stack>
      )}
 

 
      {/* Parsed Result Panel */}
      {result && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            p: 4,
            borderRadius: 4,
            background: mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
            backdropFilter: "blur(20px)",
            mb: 4
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            Parsed Result
          </Typography>
 
          <Paper sx={{ mb: 3 }}>
            <Table>
              <TableBody>
                {Object.entries({
                  Merchant: result.merchant,
                  Date: result.date,
                  Total: result.total,
                  Category: result.category,
                  Payment: result.payment_method,
                  Duplicate: result.duplicate ? "Yes" : "No",
                  Fraud_Flags: (result.fraud_flags || []).join(", ")
                }).map(([k, v]) => (
                  <TableRow key={k}>
                    <TableCell sx={{ fontWeight: 600 }}>{k}</TableCell>
                    <TableCell>{v}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
 
          <Typography variant="h5">Raw OCR Text</Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            <pre style={{ whiteSpace: "pre-wrap" }}>{result.raw_text}</pre>
          </Paper>
 
          <Typography variant="h5" sx={{ mt: 2 }}>
            DeepSeek Output
          </Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result.deepseek_raw, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}
 
      {/* Full Duplicate Pair Comparison */}
      {duplicatePair && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            mt: 3,
            p: 3,
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            🔍 Duplicate Receipt Review
          </Typography>
 
          <Grid container spacing={3}>
            {/* Original */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Original Receipt (ID: {duplicatePair.original.id})
                </Typography>
                <Table>
                  <TableBody>
                    {Object.entries({
                      Merchant: duplicatePair.original.merchant,
                      Date: duplicatePair.original.date,
                      Total: duplicatePair.original.total,
                      Category: duplicatePair.original.category,
                      "Payment Method": duplicatePair.original.payment_method,
                      Flags: duplicatePair.original.fraud_flags
                    }).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600 }}>{k}</TableCell>
                        <TableCell>{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
 
            {/* Duplicate */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Duplicate Receipt (ID: {duplicatePair.duplicate.id})
                </Typography>
                <Table>
                  <TableBody>
                    {Object.entries({
                      Merchant: duplicatePair.duplicate.merchant,
                      Date: duplicatePair.duplicate.date,
                      Total: duplicatePair.duplicate.total,
                      Category: duplicatePair.duplicate.category,
                      "Payment Method": duplicatePair.duplicate.payment_method,
                      Flags: duplicatePair.duplicate.fraud_flags
                    }).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 600 }}>{k}</TableCell>
                        <TableCell>{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
 
      {/* Dialog for Approve/Reject Messages */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: dialogType === "success" ? "green" : "red" }}>
          {dialogType === "success" ? "✓ Success" : "✗ Error"}
        </DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
 
    </Box>
  </ThemeProvider>
);
 
}
 
export default App;