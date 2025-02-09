import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useState, useEffect, useCallback } from "react";

function App() {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [temperature, setTemperature] = useState(null);
  const [status, setStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [recent5, setRecent5] = useState([]);

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    // Define time intervals in seconds
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    // Find the appropriate interval
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);

      if (interval >= 1) {
        return interval === 1
          ? `${interval} ${unit} ago`
          : `${interval} ${unit}s ago`;
      }
    }

    return "just now";
  }
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const websocket = new WebSocket("ws://localhost:5000");

    websocket.onopen = () => {
      console.log("Connected to WebSocket");
      setIsConnected(true);
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket");
      setIsConnected(false);
      // Attempt to reconnect after 2 seconds
      setTimeout(connectWebSocket, 2000);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message) => {
    console.log("Received message:", message);

    switch (message.event) {
      case "processed_reading":
        // Update current display first
        setTemperature(message.data.temperature);
        setStatus(message.data.status);
        setLastUpdate(new Date(message.data.timestamp));
        setIsConnected(true);

        // Update recent5 list
        setRecent5((prevRecent5) => {
          // Check if this reading is already in the list
          if (prevRecent5.some((item) => item.id === message.data.id)) {
            return prevRecent5;
          }

          // Add new reading and keep only 6 items
          return [
            {
              temperature: message.data.temperature,
              status: message.data.status,
              timestamp: message.data.timestamp,
              id: message.data.id,
            },
            ...prevRecent5,
          ].slice(0, 6); // Strictly keep only 6 items
        });
        break;

      case "temperature_reading":
        // Update current display first
        setTemperature(message.data.temperature);
        setLastUpdate(new Date(message.data.timestamp));
        setStatus("");
        setIsConnected(true);

        // Update recent5 list
        setRecent5((prevRecent5) => {
          // Check if this reading is already in the list
          if (prevRecent5.some((item) => item.id === message.data.id)) {
            return prevRecent5;
          }

          // Add new reading and keep only 6 items
          return [
            {
              temperature: message.data.temperature,
              status: "",
              timestamp: message.data.timestamp,
              id: message.data.id,
            },
            ...prevRecent5,
          ].slice(0, 6); // Strictly keep only 6 items
        });
        break;

      default:
        console.log("Unknown message type:", message);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);
  return (
    <div className="App">
      <div className="row">
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <b>Temperature Monitor</b>
        </div>
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <div className="float-lg-end float-sm-start">
            <div
              className={`circle d-inline-block circle-${
                isConnected ? "success" : "danger"
              }`}
            ></div>
            <div className="d-inline-block ms-3">Connected</div>
          </div>
        </div>
        <div className="row m-0 mt-3">
          <div className="col tempratureCard rounded p15">
            <span className="text-secondary fs-6">Currnet Temperature</span>
            <h2 className="m-2">
              {temperature != null ? <>{temperature} &deg;C</> : null}
            </h2>
            {status != "" ? (
              <span
                className={`text-${
                  status == "HIGH" ? "danger" : "success"
                } fs-7 me-2`}
              >
                {status}
              </span>
            ) : null}
            {temperature != null ? (
              <>
                &#8226; Last Updated: {lastUpdate ? getTimeAgo(lastUpdate) : ""}
              </>
            ) : null}
          </div>
        </div>
        {recent5.length > 1 ? (
          <div className="row m-0 mt-3">
            <div className="fs-6 fw-bold border mb-2 p15">Recent Readings</div>
            <div className="col tempratureCardList p15 pt-0 rounded rounded-start-0 rounded-end-0 ">
              {recent5.map((item, index) =>
                index > 0 ? (
                  <div className="row m-0 mt-3 bg-light p-2" key={item.id}>
                    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                      {item.temperature} &deg;C
                      <div className="fs-8 text-muted">{getTimeAgo(item.timestamp)}</div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12 ">
                      {item.status != "" ? (
                        <div className="float-lg-end float-sm-start mt5">
                          <span
                            className={`alert alert-${
                              item.status == "HIGH" ? "danger" : "success"
                            } fs-7 p-1`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
