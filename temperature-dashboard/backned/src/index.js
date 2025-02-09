const express = require("express");
const { Server } = require("ws");
const http = require("http");
const router = express.Router();
const mongoose = require("mongoose");
const Temperature = require("./mongo_schema");
mongoose
  .connect("mongodb://localhost:27017/temperature_db")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Temperature threshold for HIGH status
const TEMPERATURE_THRESHOLD = 25;

// Create Express app and HTTP server
const app = express();
app.use(express.json());
app.use(router);
const server = http.createServer(app);

// Create WebSocket server
const wss = new Server({ server });

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
// Get latest readings from MongoDB and emit to client
// Fetch and emit latest temperature reading
async function emitLatestReading() {
  try {
    const latestReading = await Temperature.findOne()
      .sort({ timestamp: -1 })
      .exec();

    if (latestReading) {
      // If the reading has been processed, emit processed_reading event
      if (latestReading.status && latestReading.processedAt) {
        broadcast({
          event: "processed_reading",
          data: {
            id: latestReading.id,
            temperature: latestReading.temperature,
            timestamp: latestReading.timestamp,
            status: latestReading.status,
            processedAt: latestReading.processedAt,
          },
        });
      } else {
        // Emit temperature_reading event
        broadcast({
          event: "temperature_reading",
          data: {
            id: latestReading.id,
            temperature: latestReading.temperature,
            timestamp: latestReading.timestamp,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching latest reading:", error);
  }
}
// Start periodic updates
let updateInterval;
function startPeriodicUpdates() {
  // Clear existing interval if any
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Set new interval for 2-second updates
  updateInterval = setInterval(async () => {
    await emitLatestReading();
  }, 2000);
}

// Stop periodic updates
function stopPeriodicUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}
// Track number of connected clients
let connectedClients = 0;
// WebSocket connection handling
wss.on("connection", async (ws) => {
  console.log("New temperature monitor client connected");
  connectedClients++;
  // Start periodic updates if this is the first client
  if (connectedClients === 1) {
    startPeriodicUpdates();
  }
  // Send latest readings to newly connected client
  await emitLatestReading();
  ws.on("close", () => {
    console.log("Client disconnected");
    connectedClients--;

    // Stop periodic updates if no clients are connected
    if (connectedClients === 0) {
      stopPeriodicUpdates();
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

//HTTP routes
router.post("/api/readings/process", (req, res) => {
  try {
    const { id, temperature, timestamp } = req.body;

    if (!id || typeof temperature !== "number" || !timestamp) {
      return res.status(400).json({
        success: false,
        reading: "Missing or invalid required fields",
      });
    }

    const reading = {
      id,
      status: temperature > TEMPERATURE_THRESHOLD ? "HIGH" : "NORMAL",
      processedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      reading,
    });
  } catch (error) {
    console.error("Error processing reading:", error);
    res.status(500).json({
      success: false,
      reading: "Error processing reading",
    });
  }
});

router.get("/api/health", (req, res) => {
  try {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing reading:", error);
    res.json({
      status: "error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server
const PORT = 5000;
async function startServer() {
  try {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

// Cleanup on server shutdown
process.on("SIGINT", () => {
  stopPeriodicUpdates();
  process.exit();
});

startServer();
