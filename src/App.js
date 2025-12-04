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
  TableHead,
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
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MenuIcon from "@mui/icons-material/Menu";
import IconButton from "@mui/material/IconButton";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
 
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
  const [currentPage, setCurrentPage] = useState("home");
  const [receipts, setReceipts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
 
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === "light"
        ? {
            background: { default: "#ffffff", paper: "#f5f5f5" },
            text: { primary: "#000000" }
          }
        : {
            background: { default: "#121212", paper: "#1e1e1e" },
            text: { primary: "#ffffff" }
          })
    }
  });

  const drawerWidth = 240;

  // Fetch all receipts
  const fetchReceipts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/receipts/all");
      setReceipts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching receipts:", err);
    }
  };
 
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
      setResult(res.data.result || res.data);
      
      console.log("Upload response:", res.data);
      console.log("Is duplicate?", res.data.duplicate);
      console.log("Duplicate_of:", res.data.duplicate_of);
      
      // Store duplicate metadata
      setDuplicateInfo({
        duplicate: res.data.duplicate,
        duplicate_of: res.data.duplicate_of,
        status: res.data.status
      });
      
      if (res.data.duplicate && res.data.duplicate_of) {
        console.log("Fetching duplicate pair for ID:", res.data.id);
        const pair = await axios.get(
          `http://localhost:8000/duplicate-pair/${res.data.id}`
        );
        console.log("Duplicate pair data:", pair.data);
        setDuplicatePair(pair.data);
      }
 
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
 
 
  // Render different pages
  const renderContent = () => {
    switch (currentPage) {
      case "home":
        return renderHomePage();
      case "upload":
        return renderUploadPage();
      case "receipts":
        return renderReceiptsPage();
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3" sx={{ fontWeight: "bold", mb: 3 }}>
        Welcome to Smart Expense Receipt Categorizer
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <CloudUploadIcon sx={{ fontSize: 60, color: "#1976d2", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Upload Receipts
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload and process your receipts with AI-powered categorization
            </Typography>
            <Button variant="contained" onClick={() => setCurrentPage("upload")}>
              Go to Upload
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <ListAltIcon sx={{ fontSize: 60, color: "#2e7d32", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              View Receipts
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Browse and manage all your processed receipts
            </Typography>
            <Button variant="contained" color="success" onClick={() => { setCurrentPage("receipts"); fetchReceipts(); }}>
              View All
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <ReceiptLongIcon sx={{ fontSize: 60, color: "#ed6c02", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Duplicate Detection
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Automatic fraud detection and duplicate receipt identification
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          How It Works
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: 20 }}>1.</Typography>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>Upload Your Receipt</Typography>
              <Typography variant="body2">Upload an image or PDF of your receipt</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: 20 }}>2.</Typography>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>AI Processing</Typography>
              <Typography variant="body2">Our AI extracts and categorizes the receipt data</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "start", gap: 2 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: 20 }}>3.</Typography>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>Review & Approve</Typography>
              <Typography variant="body2">Review the results and manage duplicates</Typography>
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );

  const renderReceiptsPage = () => (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          All Receipts ({receipts.length})
        </Typography>
        <Button variant="contained" onClick={fetchReceipts} startIcon={<ListAltIcon />}>
          Refresh
        </Button>
      </Box>

      {receipts.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>No receipts found</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>Upload your first receipt to get started</Typography>
          <Button variant="contained" onClick={() => setCurrentPage("upload")}>
            Upload Receipt
          </Button>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Merchant</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Flags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow 
                  key={receipt.id}
                  sx={{ 
                    "&:hover": { backgroundColor: theme.palette.mode === "dark" ? "#2a2a2a" : "#fafafa" },
                    backgroundColor: receipt.is_duplicate ? "rgba(255, 152, 0, 0.1)" : "transparent"
                  }}
                >
                  <TableCell>{receipt.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {receipt.merchant}
                    </Typography>
                    {receipt.gst_number && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        GST: {receipt.gst_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{receipt.receipt_date || "N/A"}</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>₹{receipt.total}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        display: "inline-block",
                        fontSize: "0.75rem"
                      }}
                    >
                      {receipt.category}
                    </Typography>
                  </TableCell>
                  <TableCell>{receipt.payment_method || "N/A"}</TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1, 
                        backgroundColor: receipt.status === "approved" ? "#e8f5e9" : receipt.status === "rejected" ? "#ffebee" : "#fff3e0",
                        color: receipt.status === "approved" ? "#2e7d32" : receipt.status === "rejected" ? "#c62828" : "#f57c00",
                        display: "inline-block",
                        fontSize: "0.75rem",
                        fontWeight: "bold"
                      }}
                    >
                      {receipt.status || "pending"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {receipt.is_duplicate && (
                      <Typography variant="body2" sx={{ color: "orange", fontWeight: "bold", mb: 0.5 }}>
                        ⚠️ Duplicate
                      </Typography>
                    )}
                    {receipt.fraud_flags && receipt.fraud_flags.length > 0 && (
                      <Typography variant="caption" sx={{ color: "error.main" }}>
                        {receipt.fraud_flags.join(", ")}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );

  const renderUploadPage = () => (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 3 }}>
        Upload Receipt
      </Typography>
 
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
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
      </Paper>
 
      {duplicateInfo?.duplicate && (
        <Paper
          elevation={2}
          sx={{
            backgroundColor: "#fff3cd",
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid #ffc107",
            textAlign: "center"
          }}
        >
          <Typography variant="h6" sx={{ color: "orange" }}>
            ⚠️ Duplicate Receipt Detected — Requires Admin Review
          </Typography>
 
          <Typography sx={{ mt: 1 }}>
            This seems similar to receipt ID: <b>{duplicateInfo.duplicate_of}</b>
          </Typography>
        </Paper>
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
 

 
      {result && (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
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
                  Duplicate: duplicateInfo?.duplicate ? "Yes" : "No",
                  "Validation Flags": (result.fraud_flags || []).join(", ")
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
          <Paper sx={{ p: 3, mt: 1, backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9f9" }}>
            <pre style={{ 
              whiteSpace: "pre-wrap", 
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
              color: theme.palette.text.primary
            }}>
              {result.raw_text}
            </pre>
          </Paper>
 
          <Typography variant="h5" sx={{ mt: 3 }}>
            DeepSeek Output
          </Typography>
          <Paper sx={{ p: 3, mt: 1, backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9f9" }}>
            <pre style={{ 
              whiteSpace: "pre-wrap", 
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
              color: theme.palette.text.primary
            }}>
              {JSON.stringify(result.deepseek_raw, null, 2)}
            </pre>
          </Paper>
        </Paper>
      )}
 
      {duplicatePair && (
        <Paper elevation={2} sx={{ mt: 3, p: 3, borderRadius: 2 }}>
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
        </Paper>
      )}
    </Box>
  );

  // ---------------------- UI Rendering ----------------------
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {/* Top AppBar */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: 1
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <ReceiptLongIcon sx={{ fontSize: 28, color: "#1976d2", mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
              Receipt App
            </Typography>
            <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")} color="inherit">
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="persistent"
          open={sidebarOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: theme.palette.background.paper
            }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: "auto" }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  selected={currentPage === "home"}
                  onClick={() => setCurrentPage("home")}
                >
                  <ListItemIcon>
                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={currentPage === "upload"}
                  onClick={() => setCurrentPage("upload")}
                >
                  <ListItemIcon>
                    <CloudUploadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Upload" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={currentPage === "receipts"}
                  onClick={() => { setCurrentPage("receipts"); fetchReceipts(); }}
                >
                  <ListItemIcon>
                    <ListAltIcon />
                  </ListItemIcon>
                  <ListItemText primary="Receipts" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: theme.palette.background.default,
            minHeight: "100vh",
            marginLeft: sidebarOpen ? 0 : `-${drawerWidth}px`,
            transition: theme.transitions.create("margin", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen
            })
          }}
        >
          <Toolbar />
          {renderContent()}
        </Box>
      </Box>

      {/* Dialog for Approve/Reject Messages */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              minWidth: 400
            }
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
    </ThemeProvider>
  );
}

export default App;