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
  Grid
} from "@mui/material";

import { createTheme, ThemeProvider } from "@mui/material/styles";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PhotoIcon from "@mui/icons-material/Photo";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AnalyticsIcon from "@mui/icons-material/Analytics";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState("dark");

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
    if (!file) return alert("Choose a file first");
    setLoading(true);
    setProgress(0);
    setResult(null); // clear previous results

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post("http://localhost:8000/process", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total))
      });
      setResult(res.data.result);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          p: 5,
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
        {/* Background Floating Shapes */}
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

        {/* Dark/Light Mode Toggle */}
        <Box sx={{ width: "100%", maxWidth: 900, display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Typography sx={{ mr: 1 }}>{mode === "light" ? "Light Mode" : "Dark Mode"}</Typography>
          <Switch checked={mode === "dark"} onChange={() => setMode(mode === "light" ? "dark" : "light")} />
        </Box>

        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
            Smart Expense Receipt Categorizer
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8 }}>
            Upload your receipts and see them categorized instantly.
          </Typography>
          <ReceiptLongIcon sx={{ fontSize: 80, mt: 2, color: mode === "dark" ? "#12a38b" : "#00b4db" }} />
        </Box>

        {/* How-it-Works Section */}
        <Grid container spacing={3} sx={{ mb: 5, maxWidth: 900 }}>
          {[
            { icon: <PhotoIcon sx={{ fontSize: 40, color: "#00b4db" }} />, text: "Upload your receipt (image or PDF)" },
            { icon: <AutoFixHighIcon sx={{ fontSize: 40, color: "#12a38b" }} />, text: "AI extracts text & categories" },
            { icon: <AnalyticsIcon sx={{ fontSize: 40, color: "#34e89e" }} />, text: "View parsed & organized results" }
          ].map((item, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  background: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  backdropFilter: "blur(8px)"
                }}
              >
                {item.icon}
                <Typography sx={{ mt: 1 }}>{item.text}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Upload Section */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 900,
            p: 4,
            mb: 5,
            borderRadius: 4,
            background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 12px 35px rgba(0,0,0,0.3)"
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
                color: "#003448",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 3,
                ":hover": { background: "linear-gradient(135deg, #27c5eb, #1699c8)" }
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
                  setResult(null);
                  setProgress(0);
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
                color: "#00311e",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 3,
                ":hover": { background: "linear-gradient(135deg, #2ad88f, #0eba70)" }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Upload & Process"}
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
                sx={{
                  height: 12,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.2)",
                  "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #34e89e, #1cb5e0)" }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Results Section */}
        {result ? (
          <Box
            sx={{
              width: "100%",
              maxWidth: 900,
              p: 4,
              borderRadius: 4,
              background: mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 12px 35px rgba(0,0,0,0.35)"
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
              Parsed Result
            </Typography>

            <Paper sx={{ mb: 3, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
              <Table>
                <TableBody>
                  {Object.entries({
                    Merchant: result.merchant,
                    Date: result.date,
                    Total: result.total,
                    Category: result.category,
                    "Payment Method": result.payment_method,
                    Duplicate: result.duplicate ? "Yes" : "No",
                    "Fraud Flags": (result.fraud_flags || []).join(", ")
                  }).map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell sx={{ fontWeight: 600 }}>{k}</TableCell>
                      <TableCell>{v}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Typography variant="h5" sx={{ mt: 2 }}>
              Raw OCR Text
            </Typography>
            <Paper sx={{ p: 2, mt: 1, background: "rgba(255,255,255,0.15)" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{result.raw_text}</pre>
            </Paper>

            <Typography variant="h5" sx={{ mt: 2 }}>
              DeepSeek Raw Output
            </Typography>
            <Paper sx={{ p: 2, mt: 1, background: "rgba(255,255,255,0.15)" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(result.deepseek_raw, null, 2)}</pre>
            </Paper>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              maxWidth: 900,
              p: 4,
              borderRadius: 4,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              textAlign: "center",
              mb: 5
            }}
          >
            <Typography variant="h5" sx={{ mb: 2 }}>Example Result</Typography>
            <Typography sx={{ opacity: 0.7 }}>
              Once you upload a receipt, parsed details will appear here.
            </Typography>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
export default App;
