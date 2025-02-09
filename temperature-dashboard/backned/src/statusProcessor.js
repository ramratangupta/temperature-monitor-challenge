const mongoose = require("mongoose");
const Temperature = require("./mongo_schema");
mongoose
  .connect("mongodb://localhost:27017/temperature_db")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function processTemperatures() {
  try {
    const pendingRecords = await Temperature.find({ status: "" });

    for (const record of pendingRecords) {
      console.log('Before',record)
      try {
        try {
          const dataRes = await fetch("http://localhost:5000/api/readings/process", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: record.id,
              temperature: record.temperature,
              timestamp: record.timestamp,
            })
          });
          const data = await dataRes.json();
          console.log(data)
          // Update record
          record.status = data.reading.status;
          record.processedAt = record.timestamp = data.reading.processedAt;
          console.log('After',record)
          await record.save();
          console.log(`Record ${record.id} processed successfully.`);
        } catch (err) {
          console.log(err);
        }
      } catch (error) {
        console.error("Error in internal processing:", error);
      }
    }
  } catch (error) {
    console.error("Error in processing temperatures:", error);
  }
}

// Function to continuously insert data
function startContinuousProcessing() {
  console.log("Starting temperature monitoring...");
  setInterval(async () => {
    await processTemperatures();
  }, 1500);
}

// Start the application
startContinuousProcessing();
