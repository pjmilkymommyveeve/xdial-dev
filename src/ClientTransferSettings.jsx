import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api";
import ClientHeader from "./ClientHeader";
import Loader from "./components/Loader";

export default function ClientTransferSettings({ isEmbedded }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [campaignId, setCampaignId] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("campaign_id");
    const adminView = params.get("admin_view");
    
    if (id) {
      setCampaignId(id);
      if (adminView === "true") {
        setIsAdminView(true);
      }
    } else {
      navigate("/client-landing");
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!campaignId) return;
      try {
        setLoading(true);
        setError(null);
        // Using direct fetch or api instance, DataExport used api.get/api.post
        // api.js usually automatically handles base URL:
        // Or if needed just use standard JS fetch with "access_token"
        // Let's use api from "./api" which handles tokens.
        const response = await api.get(`/campaigns/${campaignId}/transfer-category-settings`);
        setSettingsData(response.data);
        setSelectedPreset(response.data.selected_preset);
      } catch (err) {
        console.error("Error fetching transfer settings:", err);
        setError("Failed to load transfer settings.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [campaignId]);

  const handleSave = async () => {
    if (!campaignId || !selectedPreset) return;
    try {
      setSaving(true);
      setError(null);
      await api.put(`/campaigns/${campaignId}/transfer-category-settings`, {
        preset: selectedPreset
      });
      // Optionally reload data
      const response = await api.get(`/campaigns/${campaignId}/transfer-category-settings`);
      setSettingsData(response.data);
      alert("Transfer settings saved successfully!");
    } catch (err) {
      console.error("Error saving transfer settings:", err);
      setError("Failed to save transfer settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader size="large" />
      </div>
    );
  }

  if (error && !settingsData) {
    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>
            <button className="btn btn-primary" onClick={() => window.location.href = "/client-landing"}>Go Back</button>
          </div>
        </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: isEmbedded ? "transparent" : "#f5f7f9", minHeight: isEmbedded ? "auto" : "100vh" }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .main-content { max-width: 1200px; margin: 0 auto; padding: ${isEmbedded ? '0' : '2rem'}; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 2rem; }
        .page-title { font-size: 1.875rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .page-subtitle { color: #6b7280; font-size: 1rem; margin-bottom: 2rem; }
        
        .presets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        
        .preset-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: white;
          position: relative;
          overflow: hidden;
        }
        
        .preset-card:hover { border-color: #cbd5e1; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .preset-card.selected { border-color: #3b82f6; background-color: #eff6ff; }
        
        .preset-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .preset-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; }
        
        .preset-badge {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .categories-list { margin-top: 1rem; }
        .category-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #475569;
          font-size: 0.875rem;
        }
        
        .category-item i { color: #10b981; }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-primary:hover { background-color: #2563eb; }
        .btn-primary:disabled { background-color: #93c5fd; cursor: not-allowed; }
        
        .actions-bar {
          display: flex;
          justify-content: flex-end;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          margin-top: 2rem;
        }
        
        .success-banner {
          background-color: #d1fae5;
          border: 1px solid #34d399;
          color: #065f46;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
      `}</style>
      
      {!isEmbedded && (
        <ClientHeader
          clientName={settingsData?.client_name || "Client"}
          campaignId={settingsData?.campaign_id || campaignId}
          activePage="transfer-settings"
          isAdminView={isAdminView}
        />
      )}

      <main className="main-content">
        <div className="card">
          <h1 className="page-title">
            <i className="bi bi-sliders"></i>
            Transfer Category Settings
          </h1>
          <p className="page-subtitle">Select the categories that are allowed for transfers in this campaign.</p>
          
          {error && <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>}
          
          <div className="presets-grid">
            {settingsData?.presets?.map((preset) => (
              <div 
                key={preset.key} 
                className={`preset-card ${selectedPreset === preset.key ? "selected" : ""}`}
                onClick={() => setSelectedPreset(preset.key)}
              >
                <div className="preset-header" style={{ marginBottom: 0 }}>
                  <h3 className="preset-title">{preset.display_name}</h3>
                  {preset.key === settingsData.selected_preset && (
                    <span className="preset-badge">Active</span>
                  )}
                </div>
                
                {selectedPreset === preset.key && (
                  <div style={{ position: "absolute", top: 0, right: 0, borderTopRightRadius: "8px", borderBottomLeftRadius: "8px", backgroundColor: "#3b82f6", color: "white", padding: "0.25rem 0.5rem" }}>
                    <i className="bi bi-check-lg"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="actions-bar">
            <button 
              className="btn-primary" 
              onClick={handleSave} 
              disabled={saving || selectedPreset === settingsData?.selected_preset}
            >
              {saving ? (
                <><Loader size="small" /> Saving...</>
              ) : (
                <><i className="bi bi-save"></i> Save Settings</>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
