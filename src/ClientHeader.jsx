import React from "react";
import { useNavigate } from "react-router-dom";

export default function ClientHeader({
  clientName,
  campaignId,
  activePage, // "statistics" | "reports" | "recordings" | "data-export"
  isAdminView = false,
}) {
  const routerNavigate = useNavigate();

  const navigateTo = (path, view) => {
    let url = `${path}?campaign_id=${campaignId}`;
    if (view) {
      url += `&view=${view}`;
    }
    // Maintain admin_view param if present
    if (isAdminView) {
      url += `&admin_view=true`;
    }
    routerNavigate(url);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const userRole = localStorage.getItem("role");

  return (
    <>
      <style>{styles}</style>
      <div className="header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1>
            Welcome, <span className="company-name">{clientName || "Client"}</span>
            <span className="role-badge">Extension: {campaignId || "N/A"}</span>
            <span className="client-view-badge">
              <i className="bi bi-person-circle"></i> {isAdminView ? "Admin View" : "Client View"}
            </span>
          </h1>
        </div>
        <div className="header-buttons">
          {isAdminView ? (
            // Admin View Buttons
            <button
              className="nav-btn"
              onClick={() => routerNavigate(`/admin-dashboard?campaign_id=${campaignId}`)}
              title="Back to Admin Dashboard"
              style={{ backgroundColor: "#4f46e5", color: "white", border: "none" }}
            >
              <i className="bi bi-arrow-left"></i>
              Back to Admin Dashboard
            </button>
          ) : (
            // Standard Client View Buttons
            <>
              <button
                className="nav-btn"
                onClick={() => routerNavigate("/client-landing")}
                title="Back to Campaigns"
              >
                <i className="bi bi-house-fill"></i>
              </button>

              <button
                className={`nav-btn ${activePage === "statistics" ? "active" : ""}`}
                onClick={() => navigateTo("/dashboard", "statistics")}
              >
                <i className="bi bi-graph-up"></i>
                Statistics
              </button>

              <button
                className={`nav-btn ${activePage === "reports" ? "active" : ""}`}
                onClick={() => navigateTo("/dashboard", "dashboard")}
              >
                <i className="bi bi-bar-chart-fill"></i>
                Reports
              </button>

              <button
                className={`nav-btn ${activePage === "recordings" ? "active" : ""}`}
                onClick={() => navigateTo("/dashboard", "recordings")}
              >
                <i className="bi bi-mic-fill"></i>
                Recordings
              </button>

              {userRole !== "client_member" && (
                <button
                  className={`nav-btn ${activePage === "data-export" ? "active" : ""}`}
                  onClick={() => navigateTo("/dashboard", "data-export")}
                >
                  <i className="bi bi-download"></i>
                  Data Export
                </button>
              )}
            </>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

const styles = `
  .header {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    padding: 12px 24px;
    border-bottom: 1px solid #e5e5e5;
  }

  .header h1 {
    font-size: 1.875rem;
    font-weight: 400;
    color: #111827;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    flex-wrap: wrap;
  }

  .header .company-name {
    color: #4F46E5;
    font-weight: 500;
  }

  .role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    background: #1a73e8;
    color: white;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .client-view-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Header Buttons */
  .header-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: white;
    color: #6B7280;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .nav-btn:hover {
    background-color: #F9FAFB;
    border-color: #D1D5DB;
    color: #4B5563;
  }

  .nav-btn.active {
    background-color: #1a73e8;
    color: white;
    border-color: #1a73e8;
  }

  .nav-btn.active:hover {
    background-color: #1765cc;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: white;
    border: 1px solid #E5E7EB;
    color: #6B7280;
  }

  .logout-btn:hover {
    background-color: #F9FAFB;
    border-color: #D1D5DB;
    color: #4B5563;
  }

  .logout-btn:active {
    background-color: #F3F4F6;
    border-color: #9CA3AF;
  }
`;
