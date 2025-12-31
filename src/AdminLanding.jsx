import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminLanding = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        setError("Not authenticated. Please login again.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
        return;
      }

      const response = await fetch(
        "https://api.xlitecore.xdialnetworks.com/api/v1/client/campaigns/with-campaigns",
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        setTimeout(() => {
          navigate("/");
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle the nested structure: clients -> campaigns
      let campaignsArray = [];
      if (data.clients && Array.isArray(data.clients)) {
        // Flatten all campaigns from all clients into a single array
        data.clients.forEach(client => {
          if (client.campaigns && Array.isArray(client.campaigns)) {
            // Add client info to each campaign for display
            client.campaigns.forEach(campaign => {
              campaignsArray.push({
                ...campaign,
                client_id: client.client_id,
                client_name: client.client_name
              });
            });
          }
        });
      } else if (Array.isArray(data)) {
        campaignsArray = data;
      } else if (data.campaigns && Array.isArray(data.campaigns)) {
        campaignsArray = data.campaigns;
      } else if (data.data && Array.isArray(data.data)) {
        campaignsArray = data.data;
      } else {
        console.warn("Unexpected API response structure:", data);
      }
      
      setCampaigns(campaignsArray);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const handleCampaignClick = (campaignId) => {
    navigate(`/admin-dashboard?campaign_id=${campaignId}`);
  };

  const filteredCampaigns = Array.isArray(campaigns) ? campaigns.filter((campaign) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      campaign.campaign_name?.toLowerCase().includes(searchLower) ||
      campaign.client_name?.toLowerCase().includes(searchLower) ||
      campaign.id?.toString().includes(searchLower)
    );
  }) : [];

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "Arial, sans-serif" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #4f46e5",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#6b7280" }}>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px"
      }}>
        <div style={{ textAlign: "center", color: "#dc2626" }}>
          <i className="bi bi-exclamation-circle" style={{ fontSize: "48px", marginBottom: "16px" }}></i>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f9fafb", 
      fontFamily: "Arial, sans-serif" 
    }}>
      <header style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "24px 0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          maxWidth: "1400px",
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
              <i className="bi bi-speedometer2"></i>
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Select a campaign to view data export
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/admin-data-export")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="bi bi-file-earmark-arrow-up"></i>
              Bulk Data Export
            </button>
            <button
              onClick={() => navigate("/integration-form")}
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
                gap: "8px"
              }}
            >
              <i className="bi bi-file-earmark-plus"></i>
              Add Client
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
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        {/* Search Section */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ position: "relative" }}>
            <i className="bi bi-search" style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: "16px"
            }}></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by campaign name, client name, or ID..."
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        {/* Campaigns Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px"
        }}>
          {filteredCampaigns.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "48px 24px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <i className="bi bi-inbox" style={{
                fontSize: "48px",
                color: "#d1d5db",
                marginBottom: "16px",
                display: "block"
              }}></i>
              <h3 style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827"
              }}>
                No campaigns found
              </h3>
              <p style={{
                margin: 0,
                fontSize: "14px",
                color: "#6b7280"
              }}>
                Try adjusting your search term
              </p>
            </div>
          ) : (
            filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign.id)}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "2px solid transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#4f46e5";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "20px"
                  }}>
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <span style={{
                    padding: "4px 12px",
                    backgroundColor: "#eff6ff",
                    color: "#1e40af",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    ID: {campaign.id}
                  </span>
                </div>

                <h3 style={{
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827"
                }}>
                  {campaign.campaign_name || "Unnamed Campaign"}
                </h3>

                <p style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <i className="bi bi-building"></i>
                  {campaign.client_name || "No client"}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "16px",
                  borderTop: "1px solid #f3f4f6"
                }}>
                  <span style={{
                    fontSize: "13px",
                    color: "#9ca3af",
                    fontWeight: "500"
                  }}>
                    Click to view data
                  </span>
                  <i className="bi bi-arrow-right" style={{
                    fontSize: "16px",
                    color: "#4f46e5"
                  }}></i>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          header h1 {
            font-size: 24px !important;
          }
        }
      `}</style>

      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />
    </div>
  );
};

export default AdminLanding;