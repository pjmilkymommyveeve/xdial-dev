import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import api from "./api";

const AdminServerStats = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverData, setServerData] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [expandedServers, setExpandedServers] = useState({});

    // Chart refs
    const campaignChartRef = useRef(null);
    const botChartRef = useRef(null);
    const campaignChartInstance = useRef(null);
    const botChartInstance = useRef(null);

    // Fetch clients list on mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await api.get("/clients");
                if (response.data) {
                    setClients(response.data);
                    // Auto-select first client if available
                    if (response.data.length > 0) {
                        setSelectedClientId(response.data[0].id?.toString() || "");
                    }
                }
            } catch (err) {
                console.error("Error fetching clients:", err);
                // If clients endpoint fails, we'll let user enter ID manually
            }
        };
        fetchClients();
    }, []);

    // Fetch server stats when client changes
    useEffect(() => {
        const fetchServerStats = async () => {
            if (!selectedClientId) {
                // Fetch all servers if no client selected
                setLoading(true);
                try {
                    const response = await api.get(`/servers/stats/all-servers?active_only=false`);
                    setServerData(response.data);
                    setError(null);
                } catch (err) {
                    console.error("Error fetching server stats:", err);
                    setError("Failed to fetch server statistics");
                } finally {
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/servers/stats/all-servers?client_id=${selectedClientId}&active_only=false`);
                setServerData(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching server stats:", err);
                setError("Failed to fetch server statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchServerStats();
    }, [selectedClientId]);

    // Create/update charts when data changes
    useEffect(() => {
        if (!serverData || !serverData.servers || serverData.servers.length === 0) return;

        // Cleanup existing charts
        if (campaignChartInstance.current) {
            campaignChartInstance.current.destroy();
        }
        if (botChartInstance.current) {
            botChartInstance.current.destroy();
        }

        // Campaign distribution chart
        if (campaignChartRef.current) {
            const ctx = campaignChartRef.current.getContext("2d");
            campaignChartInstance.current = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: serverData.servers.map(s => s.server_alias || s.server_ip),
                    datasets: [
                        {
                            label: "Active Campaigns",
                            data: serverData.servers.map(s => s.active_campaigns),
                            backgroundColor: "rgba(16, 185, 129, 0.8)",
                            borderColor: "#10b981",
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                        {
                            label: "Total Campaigns",
                            data: serverData.servers.map(s => s.total_campaigns),
                            backgroundColor: "rgba(79, 70, 229, 0.6)",
                            borderColor: "#4f46e5",
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "top",
                        },
                        title: {
                            display: true,
                            text: "Campaigns per Server",
                            font: { size: 14, weight: "600" },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                        },
                    },
                },
            });
        }

        // Bot distribution doughnut chart
        if (botChartRef.current) {
            const ctx = botChartRef.current.getContext("2d");
            const colors = [
                "#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
                "#06b6d4", "#ec4899", "#84cc16", "#14b8a6", "#f97316"
            ];

            botChartInstance.current = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: serverData.servers.map(s => s.server_alias || s.server_ip),
                    datasets: [{
                        data: serverData.servers.map(s => s.active_bots),
                        backgroundColor: serverData.servers.map((_, i) => colors[i % colors.length]),
                        borderWidth: 2,
                        borderColor: "#fff",
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: { boxWidth: 12, padding: 8 },
                        },
                        title: {
                            display: true,
                            text: "Active Bots Distribution",
                            font: { size: 14, weight: "600" },
                        },
                    },
                },
            });
        }

        return () => {
            if (campaignChartInstance.current) {
                campaignChartInstance.current.destroy();
            }
            if (botChartInstance.current) {
                botChartInstance.current.destroy();
            }
        };
    }, [serverData]);

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
    };

    const toggleServerExpand = (serverId) => {
        setExpandedServers(prev => ({
            ...prev,
            [serverId]: !prev[serverId]
        }));
    };

    const getStatusColor = (isActive) => {
        return isActive ? "#10b981" : "#9ca3af";
    };

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#f9fafb",
            fontFamily: "Arial, sans-serif"
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: "white",
                borderBottom: "1px solid #e5e7eb",
                padding: "20px 0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
                <div style={{
                    maxWidth: "1600px",
                    margin: "0 auto",
                    padding: "0 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px"
                }}>
                    <div>
                        <h1 style={{
                            margin: "0 0 8px 0",
                            fontSize: "28px",
                            fontWeight: "700",
                            color: "#111827",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            Server Statistics
                        </h1>
                        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                            Monitor server performance and campaign distribution
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        {/* Client Selector */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            backgroundColor: "#f3f4f6",
                            borderRadius: "8px"
                        }}>
                            <label style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                                Client:
                            </label>
                            {clients.length > 0 ? (
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    style={{
                                        padding: "6px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        cursor: "pointer",
                                        minWidth: "150px"
                                    }}
                                >
                                    <option value="">All Clients</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name || `Client ${client.id}`}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="number"
                                    placeholder="Enter Client ID"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    style={{
                                        padding: "6px 12px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        width: "120px"
                                    }}
                                />
                            )}
                        </div>

                        <button
                            onClick={() => navigate("/admin-landing")}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#4f46e5",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer"
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px" }}>
                {/* Loading State */}
                {loading && (
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "80px 24px",
                        textAlign: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                            Loading server statistics...
                        </h3>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div style={{
                        backgroundColor: "#fef2f2",
                        borderRadius: "12px",
                        padding: "24px",
                        border: "1px solid #fecaca",
                        marginBottom: "24px"
                    }}>
                        <p style={{ margin: 0, color: "#dc2626", fontWeight: "500" }}>
                            ⚠️ {error}
                        </p>
                    </div>
                )}

                {/* Summary Stats Cards */}
                {serverData && !loading && (
                    <>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "16px",
                            marginBottom: "24px"
                        }}>
                            <div style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                borderLeft: "4px solid #4f46e5"
                            }}>
                                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                                    Total Servers
                                </p>
                                <p style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#4f46e5" }}>
                                    {serverData.total_servers || 0}
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                borderLeft: "4px solid #10b981"
                            }}>
                                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                                    Active Campaigns
                                </p>
                                <p style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#10b981" }}>
                                    {serverData.total_active_campaigns || 0}
                                    <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: "400" }}>
                                        /{serverData.total_campaigns_across_servers || 0}
                                    </span>
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                borderLeft: "4px solid #f59e0b"
                            }}>
                                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                                    Active Bots
                                </p>
                                <p style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>
                                    {serverData.total_active_bots_across_servers || 0}
                                    <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: "400" }}>
                                        /{serverData.total_bots_across_servers || 0}
                                    </span>
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                padding: "20px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                borderLeft: "4px solid #8b5cf6"
                            }}>
                                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>
                                    Avg Bots/Server
                                </p>
                                <p style={{ margin: 0, fontSize: "32px", fontWeight: "700", color: "#8b5cf6" }}>
                                    {serverData.total_servers > 0
                                        ? Math.round(serverData.total_active_bots_across_servers / serverData.total_servers)
                                        : 0}
                                </p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        {serverData.servers && serverData.servers.length > 0 && (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                                gap: "24px",
                                marginBottom: "24px"
                            }}>
                                <div style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    height: "300px"
                                }}>
                                    <canvas ref={campaignChartRef}></canvas>
                                </div>
                                <div style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    height: "300px"
                                }}>
                                    <canvas ref={botChartRef}></canvas>
                                </div>
                            </div>
                        )}

                        {/* Server Cards */}
                        <div style={{ marginBottom: "24px" }}>
                            <h2 style={{
                                margin: "0 0 16px 0",
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#111827",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                Server Details
                            </h2>

                            {serverData.servers && serverData.servers.length > 0 ? (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                                    gap: "16px"
                                }}>
                                    {serverData.servers.map((server) => (
                                        <div
                                            key={server.server_id}
                                            style={{
                                                backgroundColor: "white",
                                                borderRadius: "12px",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                                overflow: "hidden",
                                                border: "1px solid #e5e7eb"
                                            }}
                                        >
                                            {/* Server Header */}
                                            <div
                                                onClick={() => toggleServerExpand(server.server_id)}
                                                style={{
                                                    padding: "16px 20px",
                                                    cursor: "pointer",
                                                    backgroundColor: "#f9fafb",
                                                    borderBottom: expandedServers[server.server_id] ? "1px solid #e5e7eb" : "none",
                                                    transition: "background-color 0.2s"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <h3 style={{
                                                            margin: "0 0 4px 0",
                                                            fontSize: "16px",
                                                            fontWeight: "600",
                                                            color: "#111827"
                                                        }}>
                                                            {server.server_alias || server.server_ip}
                                                        </h3>
                                                        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                                                            {server.server_ip} • {server.server_domain || "No domain"}
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        fontSize: "20px",
                                                        transition: "transform 0.2s",
                                                        transform: expandedServers[server.server_id] ? "rotate(180deg)" : "rotate(0deg)"
                                                    }}>
                                                        ▼
                                                    </span>
                                                </div>

                                                {/* Quick Stats */}
                                                <div style={{
                                                    display: "flex",
                                                    gap: "16px",
                                                    marginTop: "12px"
                                                }}>
                                                    <div style={{
                                                        padding: "6px 12px",
                                                        backgroundColor: "#e0f2fe",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#0369a1"
                                                    }}>
                                                        {server.active_campaigns}/{server.total_campaigns} Campaigns
                                                    </div>
                                                    <div style={{
                                                        padding: "6px 12px",
                                                        backgroundColor: "#fef3c7",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#b45309"
                                                    }}>
                                                        {server.active_bots}/{server.total_bots} Bots
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Campaign List */}
                                            {expandedServers[server.server_id] && server.campaigns && (
                                                <div style={{ padding: "16px 20px" }}>
                                                    <h4 style={{
                                                        margin: "0 0 12px 0",
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        color: "#374151"
                                                    }}>
                                                        Campaigns ({server.campaigns.length})
                                                    </h4>

                                                    {server.campaigns.length === 0 ? (
                                                        <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
                                                            No campaigns on this server
                                                        </p>
                                                    ) : (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                            {server.campaigns.map((campaign) => (
                                                                <div
                                                                    key={campaign.campaign_id}
                                                                    style={{
                                                                        padding: "12px",
                                                                        backgroundColor: "#f9fafb",
                                                                        borderRadius: "8px",
                                                                        border: "1px solid #e5e7eb"
                                                                    }}
                                                                >
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                                                <span style={{
                                                                                    width: "8px",
                                                                                    height: "8px",
                                                                                    borderRadius: "50%",
                                                                                    backgroundColor: getStatusColor(campaign.is_active)
                                                                                }}></span>
                                                                                <span style={{
                                                                                    fontSize: "14px",
                                                                                    fontWeight: "600",
                                                                                    color: "#111827"
                                                                                }}>
                                                                                    {campaign.campaign_name}
                                                                                </span>
                                                                            </div>
                                                                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#6b7280" }}>
                                                                                Client: {campaign.client_name} • Model: {campaign.model_name}
                                                                            </p>
                                                                            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                                                                                Ext: {campaign.extension_number} • Status: {campaign.current_status}
                                                                            </p>
                                                                        </div>
                                                                        <div style={{ textAlign: "right" }}>
                                                                            <span style={{
                                                                                padding: "4px 8px",
                                                                                backgroundColor: campaign.is_active ? "#d1fae5" : "#f3f4f6",
                                                                                color: campaign.is_active ? "#065f46" : "#6b7280",
                                                                                borderRadius: "4px",
                                                                                fontSize: "11px",
                                                                                fontWeight: "600"
                                                                            }}>
                                                                                {campaign.is_active ? "Active" : "Inactive"}
                                                                            </span>
                                                                            <p style={{
                                                                                margin: "4px 0 0 0",
                                                                                fontSize: "12px",
                                                                                color: "#6b7280"
                                                                            }}>
                                                                                {campaign.active_bots}/{campaign.total_bots} bots
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Additional campaign info */}
                                                                    <div style={{
                                                                        display: "flex",
                                                                        gap: "8px",
                                                                        marginTop: "8px",
                                                                        flexWrap: "wrap"
                                                                    }}>
                                                                        {campaign.long_call_scripts_active && (
                                                                            <span style={{
                                                                                padding: "2px 6px",
                                                                                backgroundColor: "#dbeafe",
                                                                                color: "#1e40af",
                                                                                borderRadius: "3px",
                                                                                fontSize: "10px",
                                                                                fontWeight: "500"
                                                                            }}>
                                                                                Long Scripts
                                                                            </span>
                                                                        )}
                                                                        {campaign.disposition_set && (
                                                                            <span style={{
                                                                                padding: "2px 6px",
                                                                                backgroundColor: "#fce7f3",
                                                                                color: "#be185d",
                                                                                borderRadius: "3px",
                                                                                fontSize: "10px",
                                                                                fontWeight: "500"
                                                                            }}>
                                                                                Disposition Set
                                                                            </span>
                                                                        )}
                                                                        {campaign.selected_transfer_setting && (
                                                                            <span style={{
                                                                                padding: "2px 6px",
                                                                                backgroundColor: "#f3e8ff",
                                                                                color: "#7c3aed",
                                                                                borderRadius: "3px",
                                                                                fontSize: "10px",
                                                                                fontWeight: "500"
                                                                            }}>
                                                                                {campaign.selected_transfer_setting}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "60px 24px",
                                    textAlign: "center",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                }}>
                                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🖥️</div>
                                    <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#111827" }}>
                                        No servers found
                                    </h3>
                                    <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                                        {selectedClientId
                                            ? "No servers available for this client"
                                            : "Select a client or enter a client ID to view server statistics"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminServerStats;
