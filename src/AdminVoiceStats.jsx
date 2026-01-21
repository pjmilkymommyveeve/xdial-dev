import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import api from "./api";

const AdminVoiceStats = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);



    const callsChartRef = useRef(null);
    const transfersChartRef = useRef(null);
    const callsChartInstance = useRef(null);
    const transfersChartInstance = useRef(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get("/campaigns/stats/overall-voice-stats", {
                timeout: 600000 // 10 minutes timeout
            });
            console.log("Stats fetched successfully:", response.data);
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching voice stats:", err);
            let errorMessage = "Failed to fetch voice statistics";
            if (err.code === 'ECONNABORTED') {
                errorMessage = "Request timed out. The server took too long to respond.";
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
    }, []);



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

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f3f4f6",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            {/* Header */}
            <header
                style={{
                    backgroundColor: "white",
                    borderBottom: "2px solid #e5e7eb",
                    padding: "16px 0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <div
                    style={{
                        maxWidth: "1600px",
                        margin: "0 auto",
                        padding: "0 24px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                margin: "0 0 4px 0",
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#111827",
                            }}
                        >
                            Voice Statistics Dashboard
                        </h1>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                            Real-time voice performance analytics
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            onClick={() => navigate("/admin-landing")}
                            style={{
                                padding: "9px 18px",
                                backgroundColor: "#4f46e5",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) => (e.target.style.backgroundColor = "#4338ca")}
                            onMouseOut={(e) => (e.target.style.backgroundColor = "#4f46e5")}
                        >
                            ← Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: "9px 18px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                            }}
                            onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
                            onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px" }}>


                {/* Loading State */}
                {loading && (
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "80px 24px",
                            textAlign: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#111827",
                            }}
                        >
                            Loading voice statistics...
                        </h3>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div
                        style={{
                            backgroundColor: "#fef2f2",
                            borderRadius: "12px",
                            padding: "20px",
                            border: "1px solid #fecaca",
                            marginBottom: "24px",
                        }}
                    >
                        <p style={{ margin: 0, color: "#dc2626", fontWeight: "500" }}>
                            ⚠️ {error}
                        </p>
                    </div>
                )}

                {/* Stats Content */}
                {stats && !loading && (
                    <>
                        {/* Summary Cards */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "16px",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    borderTop: "4px solid #4f46e5",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Total Calls
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: "#4f46e5",
                                    }}
                                >
                                    {stats.total_calls?.toLocaleString() || 0}
                                </p>
                            </div>

                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    borderTop: "4px solid #10b981",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Total Transferred
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: "#10b981",
                                    }}
                                >
                                    {stats.total_transferred?.toLocaleString() || 0}
                                </p>
                            </div>

                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    borderTop: "4px solid #f59e0b",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Transfer Rate
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: "#f59e0b",
                                    }}
                                >
                                    {stats.overall_transfer_rate}%
                                </p>
                            </div>

                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    borderTop: "4px solid #8b5cf6",
                                }}
                            >
                                <p
                                    style={{
                                        margin: "0 0 8px 0",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Null Voice Calls
                                </p>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: "#8b5cf6",
                                    }}
                                >
                                    {stats.null_voice_calls?.toLocaleString() || 0}
                                    <span
                                        style={{
                                            fontSize: "16px",
                                            color: "#9ca3af",
                                            fontWeight: "400",
                                            marginLeft: "8px",
                                        }}
                                    >
                                        ({stats.null_voice_ratio}%)
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                                gap: "24px",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    height: "400px",
                                }}
                            >
                                <canvas ref={callsChartRef}></canvas>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    height: "400px",
                                }}
                            >
                                <canvas ref={transfersChartRef}></canvas>
                            </div>
                        </div>

                        {/* Voice Stats Table */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}
                            >
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "18px",
                                        fontWeight: "700",
                                        color: "#111827",
                                    }}
                                >
                                    Voice Performance Details
                                </h2>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "14px",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                backgroundColor: "#f9fafb",
                                                borderBottom: "2px solid #e5e7eb",
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                Voice Name
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                Total Calls
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                Transferred Calls
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                Transfer Rate
                                            </th>
                                            <th
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    color: "#374151",
                                                }}
                                            >
                                                Non-Transferred Calls
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.voice_stats?.map((voice, index) => (
                                            <tr
                                                key={index}
                                                style={{
                                                    borderBottom: "1px solid #e5e7eb",
                                                    backgroundColor:
                                                        index % 2 === 0 ? "white" : "#f9fafb",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "12px 16px",
                                                        fontWeight: "500",
                                                        color: "#111827",
                                                        textTransform: "capitalize",
                                                    }}
                                                >
                                                    {voice.voice_name}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px 16px",
                                                        textAlign: "right",
                                                        color: "#4b5563",
                                                    }}
                                                >
                                                    {voice.total_calls?.toLocaleString()}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px 16px",
                                                        textAlign: "right",
                                                        color: "#10b981",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {voice.transferred_calls?.toLocaleString()}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px 16px",
                                                        textAlign: "right",
                                                        color: "#4b5563",
                                                    }}
                                                >
                                                    {voice.transfer_rate}%
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px 16px",
                                                        textAlign: "right",
                                                        color: "#4b5563",
                                                    }}
                                                >
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
        </div>
    );
};

export default AdminVoiceStats;
