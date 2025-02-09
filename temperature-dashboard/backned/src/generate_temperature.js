const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Temperature = require("./mongo_schema");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/temperature_db")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Function to generate random temperature between 15-30°C
function generateTemperature(min = 15, max = 30) {
  // Generate temperature between 15 and 30
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Function to insert random temperature data
async function insertRandomTemperatureData() {
  try {
    const temp = generateTemperature();
    const now = new Date();
    const temperatureData = {
      id: uuidv4(),
      temperature: temp,
      timestamp: now.toISOString(),
    };
    const result = await Temperature.insertOne(temperatureData);
    console.log(`Successfully inserted ${result}`);
  } catch (error) {
    console.error("Error inserting temperature data:", error);
    throw error;
  }
}

// Function to continuously insert data
function startContinuousMonitoring() {
  console.log("Starting temperature monitoring...");
  setInterval(async () => {
    await insertRandomTemperatureData();
  }, 2050);
}

// Start the application
startContinuousMonitoring();
