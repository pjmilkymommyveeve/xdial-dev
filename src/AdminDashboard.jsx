import React, { useState, useEffect } from "react";

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [campaignId, setCampaignId] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Dynamic stage filter states
  const [stageFilters, setStageFilters] = useState({});
  const [availableStages, setAvailableStages] = useState([]);

  // Get campaign ID on mount and set today's date
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("campaign_id") || "1";
    setCampaignId(id);
    setCurrentView("dashboard");
    
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    
    setFetchTrigger(1);
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId || !startDate) return;

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          setError("Not authenticated. Please login again.");
          window.location.href = "/";
          return;
        }

        let apiUrl = `https://api.xlitecore.xdialnetworks.com/api/v1/campaigns/admin/${campaignId}/dashboard?start_date=${startDate}`;
        if (endDate && endDate !== startDate) {
          apiUrl += `&end_date=${endDate}`;
        }
        apiUrl += `&page=1&page_size=50`;

        const firstPageRes = await fetch(apiUrl, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (firstPageRes.status === 401 || firstPageRes.status === 403) {
          localStorage.clear();
          window.location.href = "/";
          return;
        }

        if (!firstPageRes.ok) {
          throw new Error(`Failed to fetch dashboard data: ${firstPageRes.status}`);
        }

        const firstPageData = await firstPageRes.json();
        const totalPages = firstPageData.pagination?.total_pages || 1;

        if (totalPages === 1) {
          processAndSetData(firstPageData);
          setLoading(false);
          return;
        }

        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          let pageUrl = `https://api.xlitecore.xdialnetworks.com/api/v1/campaigns/admin/${campaignId}/dashboard?start_date=${startDate}`;
          if (endDate && endDate !== startDate) {
            pageUrl += `&end_date=${endDate}`;
          }
          pageUrl += `&page=${page}&page_size=50`;

          pagePromises.push(
            fetch(pageUrl, {
              headers: {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }).then((res) => res.json())
          );
        }

        const additionalPages = await Promise.all(pagePromises);
        const allCalls = [
          ...firstPageData.calls,
          ...additionalPages.flatMap((pageData) => pageData.calls || []),
        ];

        const combinedData = {
          ...firstPageData,
          calls: allCalls,
          pagination: {
            ...firstPageData.pagination,
            total_records: allCalls.length,
            current_page: 1,
            total_pages: 1,
          },
        };

        processAndSetData(combinedData);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (fetchTrigger > 0) {
      fetchData();
    }
  }, [campaignId, fetchTrigger, startDate, endDate]);

  const processAndSetData = (data) => {
    const stages = new Set();
    data.calls?.forEach(call => {
      call.stages?.forEach(stage => {
        stages.add(stage.stage);
      });
    });
    
    const stagesArray = Array.from(stages).sort((a, b) => a - b);
    setAvailableStages(stagesArray);
    setDashboardData(data);

    const initialFilters = {};
    stagesArray.forEach(stageNum => {
      initialFilters[`stage${stageNum}`] = [];
    });
    setStageFilters(initialFilters);
  };

  const getStageCategories = (stageNumber) => {
    if (!dashboardData?.calls) return [];
    
    const categoryCounts = {};
    let totalForStage = 0;
    
    dashboardData.calls.forEach(call => {
      const stageData = call.stages?.find(s => s.stage === stageNumber);
      if (stageData && stageData.category) {
        categoryCounts[stageData.category] = (categoryCounts[stageData.category] || 0) + 1;
        totalForStage++;
      }
    });
    
    return Object.keys(categoryCounts).sort().map(cat => ({
      name: cat,
      count: categoryCounts[cat],
      percentage: totalForStage > 0 ? Math.round((categoryCounts[cat] / totalForStage) * 100) : 0
    }));
  };

  const getCategoryColor = (category) => {
    if (!dashboardData?.all_categories) return "#6c757d";
    
    const cat = dashboardData.all_categories.find(
      (c) => c.name === category || c.original_name === category
    );
    return cat?.color || "#6c757d";
  };

  const filteredCallRecords = (dashboardData?.calls || [])
    .filter((record) => {
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const phoneMatch = record.number?.toLowerCase().includes(searchLower);
        const stageMatches = record.stages?.some(stage => 
          stage.category?.toLowerCase().includes(searchLower) ||
          stage.voice?.toLowerCase().includes(searchLower) ||
          stage.transcription?.toLowerCase().includes(searchLower)
        );
        
        if (!phoneMatch && !stageMatches) {
          return false;
        }
      }

      for (let stageNum of availableStages) {
        const filterKey = `stage${stageNum}`;
        const selectedCategories = stageFilters[filterKey] || [];
        
        if (selectedCategories.length > 0) {
          const stageData = record.stages?.find(s => s.stage === stageNum);
          if (!stageData || !selectedCategories.includes(stageData.category)) {
            return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "phone":
          aValue = a.number?.toLowerCase() || "";
          bValue = b.number?.toLowerCase() || "";
          break;
        case "timestamp":
          aValue = new Date(a.first_timestamp).getTime();
          bValue = new Date(b.first_timestamp).getTime();
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === "asc" ? comparison : -comparison;
    });

  const RECORDS_PER_PAGE = 25;
  const totalFilteredRecords = filteredCallRecords.length;
  const totalPages = Math.ceil(totalFilteredRecords / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedRecords = filteredCallRecords.slice(startIndex, endIndex);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleReset = () => {
    setSearchText("");
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setStartTime("");
    setEndDate("");
    setEndTime("");
    
    const resetFilters = {};
    availableStages.forEach(stageNum => {
      resetFilters[`stage${stageNum}`] = [];
    });
    setStageFilters(resetFilters);
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
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    // Don't need to trigger fetch, filtering happens client-side
  };

  // Calculate filtered percentage
  const calculateFilteredPercentage = () => {
    if (!dashboardData?.calls || dashboardData.calls.length === 0) return 0;
    
    const totalCalls = dashboardData.calls.length;
    const filteredCount = filteredCallRecords.length;
    
    return totalCalls > 0 ? Math.round((filteredCount / totalCalls) * 100) : 0;
  };

  if (loading && fetchTrigger > 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial, sans-serif" }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "red", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh", zoom: "0.8" }}>
      {/* Header */}
      <div className="header-container" style={{ backgroundColor: "#fff", borderBottom: "1px solid #e0e0e0", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#d32f2f" }}>
            <i className="bi bi-shield-check" style={{ fontSize: "20px" }}></i>
            <span style={{ fontWeight: 600, fontSize: "15px" }}>Admin Dashboard</span>
          </div>
          <span className="admin-badge" style={{ backgroundColor: "#fff9c4", color: "#f57f17", padding: "4px 12px", borderRadius: "4px", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="bi bi-gear-fill"></i> Administrator
          </span>
        </div>
        <div className="header-right" style={{ display: "flex", gap: "12px" }}>
          <button className="header-btn" style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #e0e0e0", backgroundColor: "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => window.location.href = "/admin-landing"}>
            <i className="bi bi-house-fill"></i> Back to Home
          </button>
          <button className="header-btn" style={{ padding: "8px 16px", borderRadius: "4px", border: "none", backgroundColor: "#d32f2f", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="bi bi-bar-chart-fill"></i> Dashboard
          </button>
          <button className="header-btn" style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #e0e0e0", backgroundColor: "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => window.location.href = `/recordings?campaign_id=${campaignId}`}>
            <i className="bi bi-mic-fill"></i> Recordings
          </button>
          <button className="header-btn" style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #e0e0e0", backgroundColor: "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => { localStorage.clear(); window.location.href = "/"; }}>
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>

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
            placeholder="Search by phone number, voice, or category..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
                const categories = getStageCategories(stageNum);
                const filterKey = `stage${stageNum}`;
                
                return (
                  <div key={stageNum} className="filter-box" style={{ border: "1px solid #e5e5e5", borderRadius: "8px", padding: "16px", backgroundColor: "#fafafa" }}>
                    <div className="filter-title" style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="bi bi-funnel-fill"></i> Stage {stageNum} Categories
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {categories.map(categoryData => (
                        <label key={categoryData.name} className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={stageFilters[filterKey]?.includes(categoryData.name) || false}
                            onChange={() => handleStageFilterToggle(stageNum, categoryData.name)}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ color: getCategoryColor(categoryData.name), fontWeight: 500, flex: 1 }}>
                            {categoryData.name}
                          </span>
                          <span style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>
                            {categoryData.percentage}%
                          </span>
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
              <button onClick={handleReset} style={{ padding: "8px 20px", borderRadius: "4px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="bi bi-arrow-clockwise"></i> Reset
              </button>
            </div>
            
            {/* Filtered Results Percentage */}
            <div className="filter-results" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
                Filtered Results:
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
                  {filteredCallRecords.length} calls
                </div>
                <div className="percentage-badge" style={{ 
                  backgroundColor: "#d32f2f", 
                  color: "white", 
                  padding: "6px 12px", 
                  borderRadius: "6px", 
                  fontSize: "14px", 
                  fontWeight: 600,
                  minWidth: "60px",
                  textAlign: "center"
                }}>
                  {calculateFilteredPercentage()}%
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
                  Call Records ({totalFilteredRecords} total)
                </h2>
                {totalFilteredRecords !== dashboardData?.calls?.length && (
                  <span className="percentage-badge" style={{
                    backgroundColor: "#d32f2f",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginLeft: "8px"
                  }}>
                    {calculateFilteredPercentage()}%
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>All times are displayed in US Eastern Time (EST/EDT)</p>
            </div>
            <input
              type="text"
              className="table-search"
              style={{ width: "300px", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" }}
              placeholder="Search calls..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, cursor: "pointer", minWidth: "60px" }} onClick={() => handleSort("id")}>
                    #
                  </th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, cursor: "pointer", minWidth: "130px" }} onClick={() => handleSort("phone")}>
                    Phone No
                  </th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "80px" }}>
                    Voice
                  </th>
                  {availableStages.map(stageNum => (
                    <React.Fragment key={stageNum}>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "120px" }}>
                        Stage {stageNum}
                      </th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, minWidth: "200px" }}>
                        Stage {stageNum} Transcript
                      </th>
                    </React.Fragment>
                  ))}
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: 600, cursor: "pointer", minWidth: "160px" }} onClick={() => handleSort("timestamp")}>
                    Timestamp (US EST/EDT)
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4 + (availableStages.length * 2)} style={{ textAlign: "center", color: "#888", padding: 24 }}>
                      No call records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr
                      key={record.id}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
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
                              <td style={{ padding: "12px" }}>
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
                              <td style={{ padding: "12px", maxWidth: "300px", lineHeight: "1.4" }}>
                                {stageData.transcription || "-"}
                              </td>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <React.Fragment key={stageNum}>
                              <td style={{ padding: "12px", textAlign: "center", color: "#ccc" }}>-</td>
                              <td style={{ padding: "12px", textAlign: "center", color: "#ccc" }}>-</td>
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
              Showing {paginatedRecords.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, totalFilteredRecords)} of {totalFilteredRecords} records
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px", opacity: currentPage === totalPages ? 0.5 : 1 }}
                disabled={currentPage === totalPages}
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