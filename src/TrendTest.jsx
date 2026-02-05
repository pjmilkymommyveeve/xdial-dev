import React, { useState, useEffect } from "react";
import api from "./api"; // Use the configured axios instance

const TrendTest = () => {
    const [campaignId, setCampaignId] = useState("10");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedRange, setSelectedRange] = useState("today");
    const [showTrends, setShowTrends] = useState(false);

    const ENGAGED_CATEGORIES = ["Unclear Response", "Qualified", "Neutral"];

    // Mapping for UI: colors and icons (using simple text/emojis for now to match style without external icons)
    const CATEGORY_STYLES = {
        "Neutral": { color: "#9ca3af", icon: "●" }, // Grey dot
        "Qualified": { color: "#16a34a", icon: "★" }, // Green Star
        "Unclear Response": { color: "#6b7280", icon: "?" }, // Grey Question
        "Answering Machine": { color: "#3b82f6", icon: "📱" }, // Blue Phone
        "Call Back": { color: "#eab308", icon: "●" }, // Yellow Dot
        "DAIR": { color: "#b91c1c", icon: "ℹ️" }, // Red Info
        "DNC": { color: "#ef4444", icon: "📞" }, // Red Phone X (approximation)
        "DNQ": { color: "#dc2626", icon: "●" }, // Red Dot
        "Honeypot": { color: "#000000", icon: "🛡️" }, // Black Shield
        "Inaudible": { color: "#8d6e63", icon: "🔊" }, // Brown Speaker
        "Not Interested": { color: "#84cc16", icon: "✖️" }, // Green X
        "User Hangup": { color: "#db2777", icon: "📞" }, // Pink Phone
        "User Silent": { color: "#dc2626", icon: "🎤" }, // Red Mic
    };

    const fetchTrendData = async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            let startDate, startTime, endDate, endTime, intervalMinutes;
            const formatDate = (date) => date.toISOString().split("T")[0];
            const formatTime = (date) => date.toISOString().split("T")[1].substring(0, 5);

            if (selectedRange === "5m") {
                intervalMinutes = 5;
                const end = new Date(now.getTime());
                const start = new Date(now.getTime() - 10 * 60 * 1000);
                startDate = formatDate(start);
                startTime = formatTime(start);
                endDate = formatDate(end);
                endTime = formatTime(end);
            } else if (selectedRange === "15m") {
                intervalMinutes = 15;
                const end = new Date(now.getTime());
                const start = new Date(now.getTime() - 30 * 60 * 1000);
                startDate = formatDate(start);
                startTime = formatTime(start);
                endDate = formatDate(end);
                endTime = formatTime(end);
            } else if (selectedRange === "1h") {
                intervalMinutes = 60;
                const end = new Date(now.getTime());
                const start = new Date(now.getTime() - 120 * 60 * 1000);
                startDate = formatDate(start);
                startTime = formatTime(start);
                endDate = formatDate(end);
                endTime = formatTime(end);
            } else if (selectedRange === "today") {
                intervalMinutes = 1440;
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setUTCDate(today.getUTCDate() - 1);
                const end = new Date();
                startDate = formatDate(yesterday);
                startTime = formatTime(yesterday);
                endDate = formatDate(end);
                endTime = formatTime(end);
            }

            console.log("Fetching Trend Data:", {
                campaignId,
                startDate,
                startTime,
                endDate,
                endTime,
                intervalMinutes
            });

            const response = await api.get(`/campaigns/${campaignId}/category-timeseries`, {
                params: { start_date: startDate, start_time: startTime, end_date: endDate, end_time: endTime, interval_minutes: intervalMinutes }
            });

            console.log("API Response:", response.data);

            processData(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const processData = (responseData) => {
        if (!responseData.intervals || responseData.intervals.length < 2) {
            setData(null);
            return;
        }

        const intervals = responseData.intervals;
        const currentInterval = intervals[intervals.length - 1];
        const previousInterval = intervals[intervals.length - 2];

        const processInterval = (interval) => {
            const categories = {};
            let total = 0;
            interval.categories.forEach(cat => {
                categories[cat.name] = cat;
                total += cat.count;
            });
            return { categories, total };
        };

        const current = processInterval(currentInterval);
        const previous = processInterval(previousInterval);

        // Group categories for separate columns
        const allCategoryNames = new Set([
            ...Object.keys(current.categories),
            ...Object.keys(previous.categories)
        ]);

        const engagedList = [];
        const dropOffList = [];

        allCategoryNames.forEach(name => {
            const isEngaged = ENGAGED_CATEGORIES.includes(name);
            const currCount = current.categories[name]?.count || 0;
            const prevCount = previous.categories[name]?.count || 0;

            // Calculate percentages
            const currPct = current.total ? (currCount / current.total) * 100 : 0;
            const prevPct = previous.total ? (prevCount / previous.total) * 100 : 0;
            const diff = currPct - prevPct;

            const item = {
                name,
                currCount,
                currPct,
                diff,
                isEngaged
            };

            if (isEngaged) engagedList.push(item);
            else dropOffList.push(item);
        });

        // Calculate Total Engaged Rate
        const currentEngagedCount = Object.values(current.categories)
            .filter(c => ENGAGED_CATEGORIES.includes(c.name))
            .reduce((sum, c) => sum + c.count, 0);
        const overallEngagedRate = current.total ? (currentEngagedCount / current.total) * 100 : 0;

        setData({
            engagedList: engagedList.sort((a, b) => a.name.localeCompare(b.name)),
            dropOffList: dropOffList.sort((a, b) => a.name.localeCompare(b.name)),
            overallEngagedRate
        });
    };

    useEffect(() => {
        if (campaignId) fetchTrendData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, selectedRange]);

    const renderCategoryRow = (item) => {
        const style = CATEGORY_STYLES[item.name] || { color: "#6b7280", icon: "●" };
        const showDiff = showTrends && Math.abs(item.diff) >= 0; // Show diff if active
        const isPositive = item.diff > 0;
        const isNegative = item.diff < 0;

        // Color logic for trend: 
        // For Engaged: Increase is Green (Good), Decrease is Red (Bad)
        // For Drop-off: Increase is Red (Bad), Decrease is Green (Good) is standard logic?
        // Wait, screenshots show "Qualified" with Red down arrow meaning decrease.
        // "DNC" with Red down arrow 1%. "DNQ" Green up arrow 3%.
        // So Green = Up, Red = Down, or Green = Good, Red = Bad?
        // Screenshot: DNQ (Drop off) has Green Up Arrow 3%. Usually DNQ going up is bad?
        // But maybe it's just literally Green = Increase, Red = Decrease...
        // Wait, Qualified (Engaged) has Red Down Arrow 3%. So Red = Decrease.
        // User Hangup (Drop off) has Green Up Arrow 3%. So Green = Increase.
        // DNC (Drop off) has Red Down Arrow 1%.
        // Conclusion: Green is Increase, Red is Decrease regardless of good/bad. 
        // Exception: Answering Machine has Red Down Arrow 1%.
        // Let's stick to Green = Up, Red = Down.

        const arrowColor = isPositive ? "#16a34a" : "#dc2626";
        const arrow = isPositive ? "↑" : "↓";

        return (
            <div key={item.name} style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: "14px"
            }}>
                {/* Icon */}
                <span style={{
                    color: style.color,
                    marginRight: "12px",
                    width: "20px",
                    textAlign: "center",
                    fontSize: "16px"
                }}>
                    {style.icon}
                </span>

                {/* Name */}
                <span style={{ flex: 1, color: "#374151" }}>{item.name}</span>

                {/* Trend */}
                {showTrends && item.diff !== 0 && (
                    <span style={{
                        marginRight: "16px",
                        fontSize: "12px",
                        color: arrowColor,
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                    }}>
                        {arrow} {Math.abs(item.diff).toFixed(0)}%
                    </span>
                )}
                {showTrends && item.diff === 0 && (
                    <span style={{ marginRight: "16px", fontSize: "12px", color: "#9ca3af" }}>-</span>
                )}

                {/* Value */}
                <span style={{ fontWeight: "600", color: "#111827", minWidth: "40px", textAlign: "right" }}>
                    {item.currPct.toFixed(0)}%
                </span>
            </div>
        );
    };

    return (
        <div style={{ padding: "24px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Campaign ID</label>
                            <input
                                type="text"
                                value={campaignId}
                                onChange={(e) => setCampaignId(e.target.value)}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #e5e7eb", width: "80px", fontSize: "14px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Range</label>
                            <select
                                value={selectedRange}
                                onChange={(e) => setSelectedRange(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #e5e7eb",
                                    fontSize: "14px",
                                    color: "#374151",
                                    outline: "none",
                                    minWidth: "140px"
                                }}
                            >
                                <option value="today">Today</option>
                                <option value="1h">Past 1 Hour</option>
                                <option value="15m">Past 15 Minutes</option>
                                <option value="5m">Past 5 Minutes</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setShowTrends(!showTrends)}
                            style={{
                                marginTop: "18px",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: showTrends ? "#2563eb" : "#e5e7eb",
                                color: showTrends ? "white" : "#374151",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Show Trends
                        </button>
                    </div>

                    {data && (
                        <div style={{ padding: "8px 16px", backgroundColor: "#f3f4f6", borderRadius: "8px", fontSize: "18px", fontWeight: "700", color: "#111827" }}>
                            {data.overallEngagedRate.toFixed(1)}%
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading && <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>Loading...</div>}

                {data && !loading && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>
                        {/* Left Column: Engaged */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Engaged Outcomes</h3>
                            <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0 16px", backgroundColor: "white" }}>
                                {data.engagedList.map(renderCategoryRow)}
                            </div>
                        </div>

                        {/* Right Column: Drop Off */}
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "16px" }}>Drop-Off Outcomes</h3>
                            <div style={{ border: "1px solid #f3f4f6", borderRadius: "8px", padding: "0 16px", backgroundColor: "white" }}>
                                {data.dropOffList.map(renderCategoryRow)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendTest;
