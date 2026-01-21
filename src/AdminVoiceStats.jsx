import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import api from "./api";

const AdminVoiceStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const callsChartRef = useRef(null);
  const transfersChartRef = useRef(null);
  const callsChartInstance = useRef(null);
  const transfersChartInstance = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchStats = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Log the request details for debugging
      console.log("=== API Request Debug Info ===");
      console.log("Base URL:", api.defaults?.baseURL || "Not set");
      console.log("Token:", localStorage.getItem("token") ? "Present" : "Missing");
      console.log("Full URL:", `${api.defaults?.baseURL || ''}/campaigns/stats/overall-voice-stats`);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get("/campaigns/stats/overall-voice-stats", {
        params,
        timeout: 120000,
        signal: abortControllerRef.current.signal
      });

      console.log("✅ Stats fetched successfully:", response.data);
      setStats(response.data);
      setError(null);
    } catch (err) {
      // Don't set error if request was cancelled
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log("Request was cancelled");
        return;
      }

      console.error("❌ Error fetching voice stats:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        response: err.response,
        config: err.config
      });

      // Detailed debug info
      const debugData = {
        errorType: err.name || "Unknown",
        errorCode: err.code || "No code",
        requestURL: err.config?.url || "Unknown",
        baseURL: err.config?.baseURL || "Not set",
        headers: err.config?.headers || {},
        responseStatus: err.response?.status || "No response",
        responseData: err.response?.data || "No data"
      };
      setDebugInfo(debugData);

      let errorMessage = "Failed to fetch voice statistics";

      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      } else if (err.message === "Network Error") {
        errorMessage = "Network Error: Unable to reach the server. This might be a CORS issue or the server is down.";
      } else if (err.response) {
        errorMessage = `Server Error: ${err.response.status} - ${err.response.data?.message || err.message}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startDate, endDate]);

  useEffect(() => {
    if (!stats || !stats.voice_stats) return;

    // Cleanup existing charts
    if (callsChartInstance.current) {
      callsChartInstance.current.destroy();
    }
    if (transfersChartInstance.current) {
      transfersChartInstance.current.destroy();
    }

    const voiceNames = stats.voice_stats.map(v => v.voice_name);
    const totalCallsData = stats.voice_stats.map(v => v.total_calls);
    const transfersData = stats.voice_stats.map(v => v.transferred_calls);

    // Generate colors
    const colors = [
      '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    // Calls Chart
    if (callsChartRef.current) {
      const ctx = callsChartRef.current.getContext("2d");
      callsChartInstance.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: voiceNames,
          datasets: [{
            data: totalCallsData,
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            title: {
              display: true,
              text: 'Total Calls Distribution',
              font: { size: 16 }
            }
          }
        }
      });
    }

    // Transfers Chart
    if (transfersChartRef.current) {
      const ctx = transfersChartRef.current.getContext("2d");
      transfersChartInstance.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: voiceNames,
          datasets: [{
            data: transfersData,
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            title: {
              display: true,
              text: 'Transfers Distribution',
              font: { size: 16 }
            }
          }
        }
      });
    }

    return () => {
      if (callsChartInstance.current) callsChartInstance.current.destroy();
      if (transfersChartInstance.current) transfersChartInstance.current.destroy();
    };
  }, [stats]);



  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
            Voice Statistics Dashboard
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "14px" }}>
            Real-time voice performance analytics
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 24px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "flex-end", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/admin-landing")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
              height: "38px" // Fixed height for alignment
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#4338ca")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4f46e5")}
          >
            ← Dashboard
          </button>

          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none",
                  color: "#374151",
                  height: "38px", // Fixed height including border
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none",
                  color: "#374151",
                  height: "38px", // Fixed height including border
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              onClick={fetchStats}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
                height: "38px" // Fixed height for alignment
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#059669")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#10b981")}
            >
              Apply Filter
            </button>
          </div>


        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #4f46e5",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Loading voice statistics...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px"
          }}>
            <div style={{ color: "#991b1b", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
              ⚠️ {error}
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <details style={{ marginTop: "16px", fontSize: "13px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "600", color: "#7f1d1d", marginBottom: "8px" }}>
                  🔍 Debug Information (Click to expand)
                </summary>
                <pre style={{
                  backgroundColor: "#fff",
                  padding: "12px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  overflow: "auto",
                  fontSize: "12px",
                  border: "1px solid #fca5a5"
                }}>
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}

            <button
              onClick={fetchStats}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Stats Content */}
        {stats && !loading && (
          <>
            {/* Summary Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "24px"
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                  Total Calls
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#111827" }}>
                  {stats.total_calls?.toLocaleString() || 0}
                </div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                  Total Transferred
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#10b981" }}>
                  {stats.total_transferred?.toLocaleString() || 0}
                </div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                  Transfer Rate
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#4f46e5" }}>
                  {stats.overall_transfer_rate}%
                </div>
              </div>

              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "8px" }}>
                  Null Voice Calls
                </div>
                <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>
                  {stats.null_voice_calls?.toLocaleString() || 0}
                  <span style={{ fontSize: "14px", color: "#6b7280", marginLeft: "8px" }}>
                    ({stats.null_voice_ratio}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "24px",
              marginBottom: "24px"
            }}>
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                height: "400px"
              }}>
                <canvas ref={callsChartRef} />
              </div>
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                height: "400px"
              }}>
                <canvas ref={transfersChartRef} />
              </div>
            </div>

            {/* Voice Stats Table */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden"
            }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  Voice Performance Details
                </h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#f9fafb" }}>
                    <tr>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                        Voice Name
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                        Total Calls
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                        Transferred Calls
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                        Transfer Rate
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
                        Non-Transferred Calls
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.voice_stats?.map((voice, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#111827", fontWeight: "600" }}>
                          {voice.voice_name}
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                          {voice.total_calls?.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#10b981" }}>
                          {voice.transferred_calls?.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#4f46e5", fontWeight: "600" }}>
                          {voice.transfer_rate}%
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                          {voice.non_transferred_calls?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminVoiceStats;