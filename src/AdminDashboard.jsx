import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./components/Loader";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState("timestamp"); // Default sort by timestamp
  const [sortDirection, setSortDirection] = useState("desc");
  const [campaignId, setCampaignId] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  // Dynamic stage filter states
  const [stageFilters, setStageFilters] = useState({});
  const [availableStages, setAvailableStages] = useState([]);

  // Get campaign ID on mount and set today's date
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("campaign_id");
    if (id) {
      setCampaignId(id);
      setCurrentView("dashboard");
      // Set default start date to today
      // Set default start date to today (Local Time)
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      setStartDate(today);
    } else {
      // Redirect to admin landing if no campaign_id
      window.location.href = "/admin-landing";
    }
  }, []);

  // Fetch dashboard data from API
  // Fetch dashboard data from API
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      // Allow fetching even if startDate is empty
      if (!campaignId) return;

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Not authenticated. Please login again.");
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
          return;
        }

        // Construct Stage Filters JSON
        const stageFiltersParam = Object.entries(stageFilters).reduce((acc, [key, categories]) => {
          if (categories && categories.length > 0) {
            const stageNum = parseInt(key.replace("stage", ""), 10);
            if (!isNaN(stageNum)) {
              acc.push({ stage: stageNum, categories: categories });
            }
          }
          return acc;
        }, []);

        let apiUrl = `https://api.xlitecore.xdialnetworks.com/api/v1/campaigns/admin/${campaignId}/dashboard?`;

        // Use URLSearchParams for cleaner URL construction
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (startTime) params.append('start_time', startTime);
        if (endTime) params.append('end_time', endTime);
        if (searchText) params.append('search', searchText);
        params.append('page', currentPage.toString());
        params.append('page_size', '50');
        params.append('sort_order', sortDirection);

        if (stageFiltersParam.length > 0) {
          params.append('stage_filters', JSON.stringify(stageFiltersParam));
        }

        const finalUrl = apiUrl + params.toString();
        // Decode only for display logging if needed, but fetch works fine with encoded
        console.log("Fetching Dashboard Data URL:", finalUrl);

        const res = await fetch(finalUrl, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: signal
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
          return;
        }

        if (!res.ok) {
          let errorMessage = `Failed to fetch dashboard data: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (parseErr) {
            if (res.status >= 500) {
              errorMessage = 'Server error occurred. Please try again later or contact support if the problem persists.';
            } else if (res.status === 401) {
              errorMessage = 'Session expired. Please login again.';
            }
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        // Log data for debugging "inconsistent data" issues
        console.log("Dashboard Data Response:", data);

        if (!signal.aborted) {
          processAndSetData(data);
          setLoading(false);
        }

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error("Fetch error:", err);
        if (err.name === 'TypeError' && (err.message.includes('NetworkError') || err.message.includes('fetch'))) {
          setError('Unable to connect to the server. This may be due to network issues or server configuration. Please try again later.');
        } else {
          setError(err.message);
        }

        if (!signal.aborted) {
          setLoading(false);
        }

        if (err.message.includes("authentication") || err.message.includes("login")) {
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [campaignId, fetchTrigger, currentPage, sortDirection]);

  // Update document title when dashboard data changes
  useEffect(() => {
    if (dashboardData?.client_name) {
      document.title = `${dashboardData.client_name} - Admin Dashboard`;
    }
  }, [dashboardData]);

  const processAndSetData = (data) => {
    // Determine available stages from the current page of calls
    // We want columns 0 to N where N is the max stage found.
    // If no calls, we can't really guess, so empty.

    let maxStage = -1;
    let hasStageZero = false;

    if (data.calls && data.calls.length > 0) {
      data.calls.forEach(call => {
        // Only consider actual stage data present in the response
        if (call.stages) {
          call.stages.forEach(s => {
            if (s.stage !== undefined) {
              if (s.stage > maxStage) maxStage = s.stage;
              if (s.stage === 0) hasStageZero = true;
            }
          });
        }
      });
    }

    // If we have existing filters for higher stages, we should probably keep showing them
    // so the user can uncheck them.
    const filteredStages = Object.keys(stageFilters)
      .map(k => parseInt(k.replace('stage', ''), 10))
      .filter(n => !isNaN(n));

    if (filteredStages.length > 0) {
      const maxFiltered = Math.max(...filteredStages);
      if (maxFiltered > maxStage) maxStage = maxFiltered;
      if (filteredStages.includes(0)) hasStageZero = true;
    }

    const startStage = hasStageZero ? 0 : 1;
    const stagesArray = [];
    if (maxStage >= startStage) {
      for (let i = startStage; i <= maxStage; i++) {
        stagesArray.push(i);
      }
    }

    setAvailableStages(stagesArray);
    setDashboardData(data);
  };

  const getCategoryColor = (category) => {
    if (!dashboardData?.all_categories) return "#6c757d";
    const cat = dashboardData.all_categories.find(
      (c) => c.name === category || c.original_name === category
    );
    return cat?.color || "#6c757d";
  };

  const handleSort = (column) => {
    // API only supports timestamp sorting via 'sort_order'
    if (column === "timestamp") {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
      setSortColumn("timestamp");
    }
    // For other columns, we can't sort server-side per requirements (only sort_order defined for timestamp)
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const handleReset = () => {
    setSearchText("");
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    setStartDate(today);
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setStageFilters({});
    setCurrentPage(1);
    setFetchTrigger((prev) => prev + 1);
  };

  const handleStageFilterToggle = (stageNum, category) => {
    const filterKey = `stage${stageNum}`;
    setStageFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey]?.includes(category)
        ? prev[filterKey].filter(c => c !== category)
        : [...(prev[filterKey] || []), category]
    }));
    // Note: We do NOT trigger fetch immediately on checkbox toggle to avoid spamming.
    // User must click "Apply Filters".
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setFetchTrigger((prev) => prev + 1);
  };

  // Helper to render sidebar filter options
  // Use all_categories from API to populate options
  const getAllCategories = () => {
    return dashboardData?.all_categories || [];
  };

  // Get categories for a specific stage with percentage calculations
  const getStageCategories = (stageNum) => {
    const allCats = dashboardData?.all_categories || [];

    // Build array of categories that have non-zero counts for this stage
    const stageCats = [];
    let totalForStage = 0;

    allCats.forEach(cat => {
      const stageData = cat.stage_counts?.find(sc => sc.stage === stageNum);
      const count = stageData?.count || 0;
      totalForStage += count;
      if (count > 0) {
        stageCats.push({
          name: cat.name,
          color: cat.color || "#6c757d",
          count: count,
          transferred_count: stageData?.transferred_count || 0
        });
      }
    });

    // Calculate percentages
    return stageCats.map(cat => ({
      ...cat,
      percentage: totalForStage > 0 ? Math.round((cat.count / totalForStage) * 100) : 0
    })).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  };

  // Helper to convert hex to rgba for badge background
  const hexToRgba = (hex, alpha) => {
    let r = 0, g = 0, b = 0;
    // Handle 3 digit hex
    if (hex.length === 4) {
      r = parseInt("0x" + hex[1] + hex[1]);
      g = parseInt("0x" + hex[2] + hex[2]);
      b = parseInt("0x" + hex[3] + hex[3]);
    }
    // Handle 6 digit hex
    else if (hex.length === 7) {
      r = parseInt("0x" + hex[1] + hex[2]);
      g = parseInt("0x" + hex[3] + hex[4]);
      b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // No client-side filtered count
  const totalRecords = dashboardData?.pagination?.total_records || 0;
  // If we want to show "Showing X of Y", use pagination data
  const pageSize = 50;
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  if (loading && !dashboardData && fetchTrigger > 0) {
    // Only show full loading if we have NO data yet and are fetching
    return (
      <div style={{ padding: 40 }}>
        <Loader size="large" />
      </div>
    );
  }
  // Allow loading indicator overlay or just spinner? 
  // For now, keep simple.

  if (error && !dashboardData) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '24px', marginTop: '60px' }}>
          <h2 style={{ color: '#DC2626', fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>Unable to Load Dashboard</h2>
          <p style={{ color: '#991B1B', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>Try Again</button>
          <button onClick={() => window.location.href = '/admin-landing'} style={{ backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginRight: '10px' }}>Go Back</button>
          <button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Login Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh", zoom: "0.8" }}>
      <style>
        {`
          .admin-data-row {
            transition: background-color 0.2s;
          }
          .admin-data-row:hover {
            background-color: #fafafa !important;
          }
          .admin-data-row:hover td {
            background-color: transparent !important;
          }
          .stage-bg-even {
            background-color: #f5f5f5;
          }
          .stage-bg-odd {
            background-color: #ffffff;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `}
      </style>
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "20px 0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "1800px",
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Left Side: Title and Subtitle */}
          <div>
            <h1
              style={{
                margin: "0 0 4px 0",
                fontSize: "28px",
                fontWeight: "700",
                color: "#111827",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <i className="bi bi-speedometer2" style={{ color: "#4f46e5" }}></i>
              {dashboardData?.client_name ? `${dashboardData.client_name} - ` : ""} {dashboardData?.campaign?.name || "Onboarding"}
            </h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", fontWeight: "500" }}>
              {dashboardData?.campaign?.model ? `Model: ${dashboardData.campaign.model}` : "Manage AI bot integration requests"}
            </p>
          </div>

          {/* Right Side: Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>


            <button
              onClick={() => window.open(`/dashboard?campaign_id=${campaignId}&view=dashboard&admin_view=true`, "_blank")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
            >
              <i className="bi bi-speedometer2"></i>
              Client Dashboard
            </button>

            <button
              onClick={() => window.open(`/recordings?campaign_id=${campaignId}`)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#db2777",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
            >
              <i className="bi bi-mic-fill"></i>
              Recordings
            </button>
          </div>
        </div>
      </header>

      <div className="main-container" style={{ maxWidth: "1800px", margin: "0 auto", padding: "24px 32px" }}>
        {/* Search & Filter Section */}
        <div className="search-section" style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <i className="bi bi-search" style={{ fontSize: "18px", color: "#666" }}></i>
            <h2 className="section-title" style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Search & Filter Calls</h2>
          </div>
          <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#999" }}>All times are displayed in US Eastern Time (EST/EDT)</p>

          <input
            type="text"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", marginBottom: "20px" }}
            placeholder="Search by phone number, voice, or category (Press Apply to search)..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />

          {/* Date and Time Inputs */}
          <div className="date-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" }}>Start Date (US EST/EDT)</label>
              <input
                type="date"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" }}>Start Time (US EST/EDT)</label>
              <input
                type="time"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" }}>End Date (US EST/EDT)</label>
              <input
                type="date"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" }}>End Time (US EST/EDT)</label>
              <input
                type="time"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Stage Filters */}
          {availableStages.length > 0 && (
            <div className="filter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
              {availableStages.map(stageNum => {
                const stageCategories = getStageCategories(stageNum);
                const filterKey = `stage${stageNum}`;

                if (stageCategories.length === 0) return null;

                return (
                  <div key={stageNum} className="filter-box" style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    border: "1px solid #f3f4f6",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%"
                  }}>
                    {/* Card Header */}
                    <div style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#fff"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#3b82f6",
                          borderRadius: "50%",
                          display: "inline-block"
                        }}></span>
                        <i className="bi bi-funnel" style={{ color: "#6b7280", fontSize: "14px" }}></i>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                          Stage {stageNum} Categories
                        </span>
                      </div>
                      <span style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        backgroundColor: "#f3f4f6",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontWeight: 600
                      }}>
                        {stageCategories.length} items
                      </span>
                    </div>

                    {/* Category List */}
                    <div
                      className="custom-scrollbar"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "0 20px",
                        maxHeight: "300px",
                        overflowY: "auto"
                      }}
                    >
                      {stageCategories.map((categoryData, idx) => (
                        <label
                          key={categoryData.name}
                          className="checkbox-label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            padding: "16px 0",
                            borderBottom: idx < stageCategories.length - 1 ? "1px solid #f3f4f6" : "none"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={stageFilters[filterKey]?.includes(categoryData.name) || false}
                              onChange={() => handleStageFilterToggle(stageNum, categoryData.name)}
                              style={{
                                cursor: "pointer",
                                width: "18px",
                                height: "18px",
                                accentColor: categoryData.color,
                                border: "1px solid #e5e7eb",
                                borderRadius: "4px"
                              }}
                            />

                            {/* Category Name */}
                            <span style={{
                              color: categoryData.color,
                              fontWeight: 600,
                              fontSize: "14px",
                            }}>
                              {categoryData.name}
                            </span>
                          </div>

                          {/* Percentage Badge */}
                          <div style={{
                            backgroundColor: hexToRgba(categoryData.color, 0.1),
                            color: categoryData.color,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            minWidth: "48px",
                            textAlign: "center"
                          }}>
                            <span style={{ marginRight: "4px" }}>{categoryData.count}</span>
                            <span style={{ opacity: 0.8 }}>({categoryData.percentage < 1 ? "<1" : categoryData.percentage}%)</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          <div className="filter-actions" style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleApplyFilters} style={{ padding: "8px 20px", borderRadius: "4px", border: "none", backgroundColor: "#d32f2f", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="bi bi-funnel-fill"></i> Apply Filters
              </button>
              <button onClick={handleReset} style={{ padding: "8px 20px", borderRadius: "4px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="bi bi-arrow-clockwise"></i> Reset
              </button>
            </div>

            {/* Total Results */}
            <div className="filter-results" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
                Total Results:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="percentage-badge" style={{
                  backgroundColor: "#e3f2fd",
                  color: "#1976d2",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid #90caf9"
                }}>
                  {totalRecords} calls
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call Records Table */}
        <div className="table-section" style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div className="table-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <i className="bi bi-telephone-fill" style={{ fontSize: "18px", color: "#666" }}></i>
                <h2 className="section-title" style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                  Call Records ({dashboardData?.total_calls || 0} total)
                </h2>
                {loading && <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>(Updating...)</span>}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>All times are displayed in US Eastern Time (EST/EDT)</p>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "60px" }}>
                    #
                  </th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "130px" }}>
                    Phone No
                  </th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "80px" }}>
                    Voice
                  </th>
                  {availableStages.map(stageNum => (
                    <React.Fragment key={stageNum}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "200px", backgroundColor: stageNum % 2 === 0 ? "#f5f5f5" : "#ffffff" }}>
                        Stage {stageNum} Transcript
                      </th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "120px", backgroundColor: stageNum % 2 === 0 ? "#f5f5f5" : "#ffffff" }}>
                        Stage {stageNum}
                      </th>
                    </React.Fragment>
                  ))}
                  <th
                    style={{ textAlign: "left", padding: "12px", fontWeight: 600, cursor: "pointer", minWidth: "160px", display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp (US EST/EDT)
                    {sortColumn === "timestamp" && (
                      <i className={`bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`} style={{ fontSize: '10px' }}></i>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {!dashboardData?.calls || dashboardData.calls.length === 0 ? (
                  <tr>
                    <td colSpan={4 + (availableStages.length * 2)} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                      No call records found.
                    </td>
                  </tr>
                ) : (
                  dashboardData.calls.map((record) => (
                    <tr
                      key={record.id}
                      className="admin-data-row"
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td style={{ padding: "12px", fontWeight: 500 }}>{record.id}</td>
                      <td style={{ padding: "12px" }}>{record.number}</td>
                      <td style={{ padding: "12px", color: "#666" }}>
                        {record.stages?.[0]?.voice || "-"}
                      </td>

                      {availableStages.map(stageNum => {
                        const stageData = record.stages?.find(s => s.stage === stageNum);

                        if (stageData) {
                          return (
                            <React.Fragment key={stageNum}>
                              <td
                                className={stageNum % 2 === 0 ? "stage-bg-even" : "stage-bg-odd"}
                                style={{ padding: "12px", maxWidth: "300px", lineHeight: "1.4" }}
                              >
                                {stageData.transcription || "-"}
                              </td>
                              <td
                                className={stageNum % 2 === 0 ? "stage-bg-even" : "stage-bg-odd"}
                                style={{ padding: "12px" }}
                              >
                                <span className="category-badge" style={{
                                  padding: "4px 10px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  backgroundColor: stageData.category_color || getCategoryColor(stageData.category),
                                  color: "white",
                                  display: "inline-block"
                                }}>
                                  {stageData.category}
                                </span>
                              </td>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <React.Fragment key={stageNum}>
                              <td className={stageNum % 2 === 0 ? "stage-bg-even" : "stage-bg-odd"} style={{ padding: "12px", textAlign: "center", color: "#ccc" }}>-</td>
                              <td className={stageNum % 2 === 0 ? "stage-bg-even" : "stage-bg-odd"} style={{ padding: "12px", textAlign: "center", color: "#ccc" }}>-</td>
                            </React.Fragment>
                          );
                        }
                      })}

                      <td style={{ padding: "12px", color: "#666" }}>
                        {record.first_timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-container" style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="pagination-info" style={{ fontSize: "13px", color: "#666" }}>
              {totalRecords > 0 ? (
                <>Showing {startRecord} to {endRecord} of {totalRecords} records</>
              ) : (
                "No records found"
              )}
            </div>
            <div className="pagination-buttons" style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px", opacity: currentPage === 1 ? 0.5 : 1 }}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {(() => {
                const totalPages = dashboardData?.pagination?.total_pages || 1;
                const pages = [];
                const maxPagesToShow = 5;
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                if (endPage - startPage < maxPagesToShow - 1) {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                return pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: "6px 12px",
                      border: page === currentPage ? "none" : "1px solid #ddd",
                      borderRadius: "4px",
                      backgroundColor: page === currentPage ? "#d32f2f" : "white",
                      color: page === currentPage ? "white" : "#333",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {page}
                  </button>
                ));
              })()}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(dashboardData?.pagination?.total_pages || 1, prev + 1))}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: currentPage === (dashboardData?.pagination?.total_pages || 1) ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  opacity: currentPage === (dashboardData?.pagination?.total_pages || 1) ? 0.5 : 1
                }}
                disabled={currentPage === (dashboardData?.pagination?.total_pages || 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />

      <style>{`
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          /* Header */
          .header-container {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px 16px !important;
          }
          
          .header-left {
            margin-bottom: 12px;
          }
          
          .header-right {
            flex-wrap: wrap;
            gap: 8px !important;
          }
          
          .header-btn {
            flex: 1;
            min-width: calc(50% - 4px);
            justify-content: center;
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
          
          /* Container */
          .main-container {
            padding: 16px !important;
          }
          
          /* Search Section */
          .search-section {
            padding: 16px !important;
          }
          
          .date-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          .filter-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          
          .filter-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .filter-results {
            width: 100%;
            justify-content: space-between !important;
            padding: 12px;
            background-color: #f5f5f5;
            border-radius: 6px;
            margin-top: 8px;
          }
          
          /* Table Section */
          .table-section {
            padding: 16px !important;
          }
          
          .table-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          
          .table-search {
            width: 100% !important;
          }
          
          .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .data-table {
            min-width: 1200px;
            font-size: 12px !important;
          }
          
          .data-table th,
          .data-table td {
            padding: 8px !important;
            font-size: 12px !important;
          }
          
          .data-table th {
            white-space: nowrap;
          }
          
          /* Pagination */
          .pagination-container {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: stretch !important;
          }
          
          .pagination-info {
            text-align: center;
          }
          
          .pagination-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .pagination-buttons button {
            font-size: 12px !important;
            padding: 6px 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .admin-badge {
            font-size: 11px !important;
            padding: 3px 8px !important;
          }
          
          .header-btn {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
          
          .header-btn i {
            font-size: 12px !important;
          }
          
          .section-title {
            font-size: 14px !important;
          }
          
          .filter-box {
            padding: 12px !important;
          }
          
          .filter-title {
            font-size: 13px !important;
          }
          
          .checkbox-label {
            font-size: 12px !important;
          }
          
          .category-badge {
            font-size: 10px !important;
            padding: 3px 8px !important;
          }
          
          .percentage-badge {
            font-size: 11px !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;