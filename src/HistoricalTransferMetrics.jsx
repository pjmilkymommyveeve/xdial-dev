import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClientHeader from "./ClientHeader";

const HistoricalTransferMetrics = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [campaignId, setCampaignId] = useState(null);
    const [isAdminView, setIsAdminView] = useState(false);

    const [historicalTransferDays, setHistoricalTransferDays] = useState(5);
    const [historicalTransferData, setHistoricalTransferData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const id = urlParams.get("campaign_id");
        const adminViewParam = urlParams.get("admin_view");

        if (id) {
            setCampaignId(id);
            if (adminViewParam === "true") {
                setIsAdminView(true);
            }
        } else {
            navigate('/client-landing');
        }
    }, [location.search, navigate]);

    useEffect(() => {
        const fetchHistoricalTransferMetrics = async () => {
            if (!campaignId) return;

            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    navigate("/");
                    return;
                }

                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - historicalTransferDays);

                const endStr = end.toISOString().split('T')[0];
                const startStr = start.toISOString().split('T')[0];

                const params = new URLSearchParams();
                params.append("start_date", startStr);
                params.append("end_date", endStr);

                const apiUrl = `https://api.xlitecore.xdialnetworks.com/api/v1/campaigns/${campaignId}/daily-metrics?${params.toString()}`;

                const response = await fetch(apiUrl, {
                    headers: {
                        accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    navigate("/");
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.days) {
                        setHistoricalTransferData(data.days.reverse());
                    } else {
                        setHistoricalTransferData([]);
                    }
                } else {
                    setError("Failed to fetch historical metrics.");
                }
            } catch (err) {
                console.error("Error fetching historical transfer metrics:", err);
                setError("Network error fetching metrics.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalTransferMetrics();
    }, [campaignId, historicalTransferDays, navigate]);

    const handleBack = () => {
        if (isAdminView) {
            navigate(`/admin-dashboard?campaign_id=${campaignId}&admin_view=true`);
        } else {
            navigate(`/dashboard?campaign_id=${campaignId}`);
        }
    };

    return (
        <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {!isAdminView && <ClientHeader />}

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>

                {/* Page Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button
                            onClick={handleBack}
                            style={{
                                background: "white",
                                border: "1px solid #e5e5e5",
                                borderRadius: "4px",
                                padding: "8px 16px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#555",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "background 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                        >
                            <i className="bi bi-arrow-left"></i> Back to Dashboard
                        </button>
                        <h1 style={{ margin: 0, fontSize: "24px", color: "#333", fontWeight: 600 }}>
                            Historical Transfer Metrics
                        </h1>
                    </div>

                    <select
                        value={historicalTransferDays}
                        onChange={(e) => setHistoricalTransferDays(Number(e.target.value))}
                        style={{
                            padding: "10px 16px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                    >
                        <option value={5}>Past 5 Days</option>
                        <option value={15}>Past 15 Days</option>
                        <option value={30}>Past 30 Days</option>
                    </select>
                </div>

                {/* Content Area */}
                <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                    {loading ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
                            <div className="spinner-border text-primary" role="status" style={{ marginBottom: "16px" }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <div style={{ fontSize: "16px" }}>Loading Historical Data...</div>
                        </div>
                    ) : error ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#c62828" }}>
                            {error}
                        </div>
                    ) : historicalTransferData.length === 0 ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "#666", fontSize: "16px" }}>
                            No transfer metrics data available for the selected range.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                                        <th style={{ padding: "16px 24px", textAlign: "left", borderBottom: "1px solid #e5e5e5", color: "#555", fontWeight: 600 }}>Date</th>
                                        <th style={{ padding: "16px 24px", textAlign: "center", borderBottom: "1px solid #e5e5e5", color: "#555", fontWeight: 600 }}>Total Calls</th>
                                        <th style={{ padding: "16px 24px", textAlign: "center", borderBottom: "1px solid #e5e5e5", color: "#2e7d32", fontWeight: 600 }}>A Grade Transfers</th>
                                        <th style={{ padding: "16px 24px", textAlign: "center", borderBottom: "1px solid #e5e5e5", color: "#1565c0", fontWeight: 600 }}>B Grade Transfers</th>
                                        <th style={{ padding: "16px 24px", textAlign: "center", borderBottom: "1px solid #e5e5e5", color: "#c62828", fontWeight: 600 }}>Dropped Calls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicalTransferData.map((dayData, idx) => {
                                        const totalCalls = dayData.total_calls || 0;
                                        const aGrade = dayData.a_grade_transfers || 0;
                                        const bGrade = dayData.b_grade_transfers || 0;
                                        const dropped = dayData.drop_offs || 0;

                                        const aPct = totalCalls > 0 ? Math.round((aGrade / totalCalls) * 100) : 0;
                                        const bPct = totalCalls > 0 ? Math.round((bGrade / totalCalls) * 100) : 0;
                                        const dPct = totalCalls > 0 ? Math.round((dropped / totalCalls) * 100) : 0;

                                        return (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fdfdfd"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                <td style={{ padding: "16px 24px", fontWeight: "500", color: "#333" }}>{dayData.date}</td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", fontWeight: "600", color: "#444" }}>{totalCalls}</td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", color: "#1b5e20" }}>
                                                    <span style={{ fontSize: "16px", fontWeight: "600" }}>{aGrade}</span> <span style={{ fontSize: "13px", color: "#666", marginLeft: "6px" }}>({aPct}%)</span>
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", color: "#0d47a1" }}>
                                                    <span style={{ fontSize: "16px", fontWeight: "600" }}>{bGrade}</span> <span style={{ fontSize: "13px", color: "#666", marginLeft: "6px" }}>({bPct}%)</span>
                                                </td>
                                                <td style={{ padding: "16px 24px", textAlign: "center", color: "#b71c1c" }}>
                                                    <span style={{ fontSize: "16px", fontWeight: "600" }}>{dropped}</span> <span style={{ fontSize: "13px", color: "#666", marginLeft: "6px" }}>({dPct}%)</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoricalTransferMetrics;
