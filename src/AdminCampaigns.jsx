import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const AdminCampaigns = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  // Filter states
  const [clientFilter, setClientFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Fetch campaign stats on mount
  useEffect(() => {
    const fetchCampaignStats = async () => {
      setLoading(true);
      try {
        const response = await api.get("/campaigns/stats/all-campaigns");
        setCampaignData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching campaign stats:", err);
        setError("Failed to fetch campaign statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignStats();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const toggleCampaignExpand = (campaignId) => {
    setExpandedCampaignId(
      expandedCampaignId === campaignId ? null : campaignId
    );
  };

  // Helper function to get filter display name
  const getFilterDisplayName = (filterValue) => {
    const filterMap = {
      "archived": "Archived",
      "disabled": "Disabled",
      "enabled": "Enabled",
      "not-approved": "Not Approved",
      "testing": "Testing",
      "active": "Active",
      "inactive": "Inactive",
      "custom-yes": "Is Custom: Yes",
      "custom-no": "Is Custom: No",
      "long-call-yes": "Long Call Scripts: Yes",
      "long-call-no": "Long Call Scripts: No",
      "disposition-yes": "Disposition Set: Yes",
      "disposition-no": "Disposition Set: No",
    };
    return filterMap[filterValue] || filterValue;
  };

  // Handle filter selection
  const handleFilterChange = (e) => {
    const value = e.target.value;
    if (value && !selectedFilters.includes(value)) {
      setSelectedFilters([...selectedFilters, value]);
    }
    e.target.value = ""; // Reset dropdown
  };

  // Remove a filter
  const removeFilter = (filterToRemove) => {
    setSelectedFilters(selectedFilters.filter(f => f !== filterToRemove));
  };

  // Client-side filtering
  const filteredCampaigns = campaignData?.campaigns?.filter((campaign) => {
    const matchesClient =
      !clientFilter ||
      campaign.client_name?.toLowerCase().includes(clientFilter.toLowerCase()) ||
      campaign.client_username?.toLowerCase().includes(clientFilter.toLowerCase());

    const matchesCampaign =
      !campaignFilter ||
      campaign.campaign_name?.toLowerCase().includes(campaignFilter.toLowerCase());

    // Handle multiple selected filters - campaign must match ALL selected filters
    let matchesSelectedFilters = true;
    if (selectedFilters.length > 0) {
      matchesSelectedFilters = selectedFilters.every((filter) => {
        if (filter === "archived" || filter === "disabled" ||
          filter === "enabled" || filter === "not-approved" ||
          filter === "testing") {
          return campaign.current_status?.toLowerCase() === filter.replace("-", " ");
        } else if (filter === "active") {
          return campaign.is_active === true;
        } else if (filter === "inactive") {
          return campaign.is_active === false;
        } else if (filter === "custom-yes") {
          return campaign.is_custom === true;
        } else if (filter === "custom-no") {
          return campaign.is_custom === false;
        } else if (filter === "long-call-yes") {
          return campaign.long_call_scripts_active === true;
        } else if (filter === "long-call-no") {
          return campaign.long_call_scripts_active === false;
        } else if (filter === "disposition-yes") {
          return campaign.disposition_set === true;
        } else if (filter === "disposition-no") {
          return campaign.disposition_set === false;
        }
        return true;
      });
    }

    return matchesClient && matchesCampaign && matchesSelectedFilters;
  }) || [];

  const openClientDashboard = (campaignId) => {
    window.open(
      `https://dashboard.xlitexcore.xdialnetworks.com/dashboard?campaign_id=${campaignId}`,
      "_blank"
    );
  };

  const openAdminDashboard = (campaignId) => {
    window.open(
      `https://dashboard.xlitexcore.xdialnetworks.com/admin-dashboard?campaign_id=${campaignId}`,
      "_blank"
    );
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
              Campaign Statistics Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Overview of all client campaigns
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
        {/* Filters Section */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Search Client
              </label>
              <input
                type="text"
                placeholder="Search by name or username..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Search Campaign
              </label>
              <input
                type="text"
                placeholder="Search by campaign name..."
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Filter By
              </label>
              <select
                onChange={handleFilterChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select filter...</option>
                <optgroup label="By Current Status">
                  <option value="archived">Archived</option>
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                  <option value="not-approved">Not Approved</option>
                  <option value="testing">Testing</option>
                </optgroup>
                <optgroup label="By Activity Status">
                  <option value="active">Active (calls in last minute)</option>
                  <option value="inactive">Inactive (no recent calls)</option>
                </optgroup>
                <optgroup label="By Is Custom">
                  <option value="custom-yes">Yes</option>
                  <option value="custom-no">No</option>
                </optgroup>
                <optgroup label="By Long Call Scripts Active">
                  <option value="long-call-yes">Yes</option>
                  <option value="long-call-no">No</option>
                </optgroup>
                <optgroup label="By Disposition Set">
                  <option value="disposition-yes">Yes</option>
                  <option value="disposition-no">No</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Selected Filters Display */}
          {selectedFilters.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {selectedFilters.map((filter) => (
                  <div
                    key={filter}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      backgroundColor: "#10b981",
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    <span>{getFilterDisplayName(filter)}</span>
                    <button
                      onClick={() => removeFilter(filter)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "0",
                        lineHeight: "1",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Loading campaign statistics...
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

        {/* Summary Stats Cards */}
        {campaignData && !loading && (
          <>
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
                  Total Campaigns
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#4f46e5",
                  }}
                >
                  {campaignData.total_campaigns || 0}
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
                  Active Campaigns
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#10b981",
                  }}
                >
                  {campaignData.total_active_campaigns || 0}
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
                  Total Bots
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#f59e0b",
                  }}
                >
                  {campaignData.total_bots_across_all_campaigns || 0}
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
                  Active Bots
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#8b5cf6",
                  }}
                >
                  {campaignData.total_active_bots_across_all_campaigns || 0}
                </p>
              </div>
            </div>

            {/* Campaign Statistics Table */}
            {filteredCampaigns.length > 0 ? (
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
                    Campaign Details ({filteredCampaigns.length})
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
                            width: "30px",
                          }}
                        ></th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Client
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Campaign
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Model
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Active Status
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Transfer Settings
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          End Date
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Active Bots
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Total Bots
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Client Dashboard
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          Admin Dashboard
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((campaign, idx) => (
                        <React.Fragment key={campaign.client_campaign_model_id}>
                          <tr
                            style={{
                              borderBottom:
                                expandedCampaignId === campaign.client_campaign_model_id
                                  ? "none"
                                  : "1px solid #e5e7eb",
                              backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onClick={() =>
                              toggleCampaignExpand(campaign.client_campaign_model_id)
                            }
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f3f4f6")
                            }
                            onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              idx % 2 === 0 ? "#ffffff" : "#f9fafb")
                            }
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  transition: "transform 0.2s",
                                  transform:
                                    expandedCampaignId === campaign.client_campaign_model_id
                                      ? "rotate(90deg)"
                                      : "rotate(0deg)",
                                }}
                              >
                                ▶
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#6b7280",
                                fontWeight: "600",
                                fontFamily: "monospace",
                              }}
                            >
                              {campaign.client_campaign_model_id}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div>
                                <div style={{ fontWeight: "600", color: "#111827" }}>
                                  {campaign.client_name}
                                </div>
                                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                                  {campaign.client_username}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "600", color: "#111827" }}>
                                {campaign.campaign_name}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#6b7280",
                              }}
                            >
                              {campaign.model_name}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#f3f4f6",
                                  color: "#6b7280",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                {campaign.current_status || "Unknown"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: campaign.is_active
                                    ? "#d1fae5"
                                    : "#fee2e2",
                                  color: campaign.is_active ? "#065f46" : "#991b1b",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                {campaign.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#6b7280",
                              }}
                            >
                              {campaign.transfer_setting || "-"}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#6b7280",
                                fontSize: "13px",
                              }}
                            >
                              {campaign.end_date
                                ? new Date(campaign.end_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                                : "-"}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                fontWeight: "600",
                                color: campaign.is_active ? "#10b981" : "#f59e0b",
                              }}
                            >
                              {campaign.is_active ? campaign.bot_count : 0}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                color: "#6b7280",
                              }}
                            >
                              {campaign.bot_count}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openClientDashboard(campaign.client_campaign_model_id);
                                }}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#3b82f6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                  (e.target.style.backgroundColor = "#2563eb")
                                }
                                onMouseOut={(e) =>
                                  (e.target.style.backgroundColor = "#3b82f6")
                                }
                              >
                                Open
                              </button>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAdminDashboard(campaign.client_campaign_model_id);
                                }}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#8b5cf6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseOver={(e) =>
                                  (e.target.style.backgroundColor = "#7c3aed")
                                }
                                onMouseOut={(e) =>
                                  (e.target.style.backgroundColor = "#8b5cf6")
                                }
                              >
                                Open
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Server Extension Groups */}
                          {expandedCampaignId === campaign.client_campaign_model_id &&
                            campaign.server_extension_groups &&
                            campaign.server_extension_groups.length > 0 && (
                              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td
                                  colSpan="13"
                                  style={{
                                    padding: 0,
                                    backgroundColor: "#f9fafb",
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: "16px 24px",
                                      animation: "slideDown 0.3s ease-out",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "#374151",
                                        marginBottom: "12px",
                                      }}
                                    >
                                      Server Extension Groups ({campaign.server_extension_groups.length})
                                    </div>
                                    <table
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "13px",
                                        backgroundColor: "white",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <thead>
                                        <tr
                                          style={{
                                            backgroundColor: "#f3f4f6",
                                          }}
                                        >
                                          <th
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "left",
                                              fontWeight: "600",
                                              color: "#4b5563",
                                            }}
                                          >
                                            Server
                                          </th>
                                          <th
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "left",
                                              fontWeight: "600",
                                              color: "#4b5563",
                                            }}
                                          >
                                            IP Address
                                          </th>
                                          <th
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "left",
                                              fontWeight: "600",
                                              color: "#4b5563",
                                            }}
                                          >
                                            Domain
                                          </th>
                                          <th
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "center",
                                              fontWeight: "600",
                                              color: "#4b5563",
                                            }}
                                          >
                                            Extension
                                          </th>
                                          <th
                                            style={{
                                              padding: "10px 12px",
                                              textAlign: "center",
                                              fontWeight: "600",
                                              color: "#4b5563",
                                            }}
                                          >
                                            Bot Count
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {campaign.server_extension_groups.map(
                                          (group, gidx) => (
                                            <tr
                                              key={`${group.server_id}-${group.extension_number}`}
                                              style={{
                                                borderBottom:
                                                  gidx <
                                                    campaign.server_extension_groups.length - 1
                                                    ? "1px solid #e5e7eb"
                                                    : "none",
                                              }}
                                            >
                                              <td
                                                style={{
                                                  padding: "10px 12px",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    fontWeight: "600",
                                                    color: "#111827",
                                                  }}
                                                >
                                                  {group.server_alias || `Server ${group.server_id}`}
                                                </div>
                                              </td>
                                              <td
                                                style={{
                                                  padding: "10px 12px",
                                                  color: "#6b7280",
                                                  fontFamily: "monospace",
                                                }}
                                              >
                                                {group.server_ip}
                                              </td>
                                              <td
                                                style={{
                                                  padding: "10px 12px",
                                                  color: "#6b7280",
                                                }}
                                              >
                                                {group.server_domain || "-"}
                                              </td>
                                              <td
                                                style={{
                                                  padding: "10px 12px",
                                                  textAlign: "center",
                                                  fontWeight: "600",
                                                  color: "#4f46e5",
                                                }}
                                              >
                                                {group.extension_number}
                                              </td>
                                              <td
                                                style={{
                                                  padding: "10px 12px",
                                                  textAlign: "center",
                                                  fontWeight: "600",
                                                  color: "#10b981",
                                                }}
                                              >
                                                {group.bot_count}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              !loading && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "80px 24px",
                    textAlign: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "64px",
                      color: "#d1d5db",
                      marginBottom: "16px",
                    }}
                  >
                    📊
                  </div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    No campaigns found
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {clientFilter || campaignFilter || selectedFilters.length > 0
                      ? "Try adjusting your filters"
                      : "No campaign data available"}
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminCampaigns;
