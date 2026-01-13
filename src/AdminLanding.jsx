import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const LOAD_METRICS_API_BASE = 'https://loadmetrics.xdialnetworks.com';

const AdminLanding = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState({});
  const [connected, setConnected] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [tempThreshold, setTempThreshold] = useState({
    cpu: 80,
    memory: 85,
    disk: 90
  });
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Load thresholds from server on mount
  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const response = await fetch(`${LOAD_METRICS_API_BASE}/api/thresholds`);
      if (response.ok) {
        const data = await response.json();
        setThresholds(data || {});
      }
    } catch (err) {
      console.error('Failed to fetch thresholds:', err);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket('wss://loadmetrics.xdialnetworks.com/ws/dashboard');
    
    ws.onopen = () => {
      console.log('Connected to monitoring server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const metrics = JSON.parse(event.data);
        setAgents(prev => ({
          ...prev,
          [metrics.hostname]: {
            ...metrics,
            lastUpdate: Date.now()
          }
        }));
      } catch (err) {
        console.error('Failed to parse metrics:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from monitoring server');
      setConnected(false);
      wsRef.current = null;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectWebSocket();
      }, 5000);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAgents(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (now - updated[key].lastUpdate > 30000) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const openThresholdModal = (hostname) => {
    setSelectedAgent(hostname);
    const existing = thresholds[hostname] || { cpu: 80, memory: 85, disk: 90 };
    setTempThreshold(existing);
    setShowThresholdModal(true);
  };

  const saveThreshold = async () => {
    try {
      const response = await fetch(`${LOAD_METRICS_API_BASE}/api/thresholds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: selectedAgent,
          threshold: tempThreshold
        })
      });

      if (response.ok) {
        // Update local state
        setThresholds(prev => ({
          ...prev,
          [selectedAgent]: tempThreshold
        }));
        setShowThresholdModal(false);
        console.log('Threshold saved successfully');
      } else {
        console.error('Failed to save threshold');
        alert('Failed to save threshold. Please try again.');
      }
    } catch (err) {
      console.error('Error saving threshold:', err);
      alert('Error saving threshold. Please check server connection.');
    }
  };

  const checkThresholdExceeded = (agent) => {
    const threshold = thresholds[agent.hostname];
    if (!threshold) return null;

    const warnings = [];
    if (agent.cpu.total_percent > threshold.cpu) {
      warnings.push(`CPU: ${agent.cpu.total_percent.toFixed(1)}% > ${threshold.cpu}%`);
    }
    if (agent.memory.used_percent > threshold.memory) {
      warnings.push(`Memory: ${agent.memory.used_percent.toFixed(1)}% > ${threshold.memory}%`);
    }
    
    agent.disk.forEach(d => {
      if (d.used_percent > threshold.disk) {
        warnings.push(`Disk ${d.mount}: ${d.used_percent.toFixed(1)}% > ${threshold.disk}%`);
      }
    });

    return warnings.length > 0 ? warnings : null;
  };

  const agentList = Object.values(agents).sort((a, b) => 
    a.hostname.localeCompare(b.hostname)
  );

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
              Xdial Networks Admin Panel
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px"
            }}>
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: connected ? "#10b981" : "#ef4444",
                boxShadow: connected ? "0 0 8px rgba(16, 185, 129, 0.5)" : "none",
                animation: connected ? "pulse 2s infinite" : "none"
              }}></span>
              <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: "500" }}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
              <span style={{
                padding: "2px 8px",
                background: "#4f46e5",
                color: "white",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "600",
                marginLeft: "8px"
              }}>
                {agentList.length} Servers
              </span>
            </div>
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
              Data Export
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
        {agentList.length === 0 ? (
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "80px 24px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <i className="bi bi-server" style={{
              fontSize: "64px",
              color: "#d1d5db",
              marginBottom: "16px",
              display: "block"
            }}></i>
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827"
            }}>
              No servers connected
            </h3>
            <p style={{
              margin: 0,
              fontSize: "14px",
              color: "#6b7280"
            }}>
              Waiting for monitoring agents to connect...
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "20px"
          }}>
            {agentList.map(agent => {
              const warnings = checkThresholdExceeded(agent);
              const hasWarning = warnings !== null;

              return (
                <div 
                  key={agent.hostname} 
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: hasWarning 
                      ? "0 0 0 3px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(239, 68, 68, 0.2)"
                      : "0 1px 3px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: hasWarning ? "2px solid #ef4444" : "2px solid transparent",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (!hasWarning) {
                      e.currentTarget.style.borderColor = "#4f46e5";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasWarning) {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {hasWarning && (
                    <div style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                      animation: "pulse 2s infinite"
                    }}>
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                  )}

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
                      background: hasWarning 
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "20px"
                    }}>
                      <i className="bi bi-server"></i>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openThresholdModal(agent.hostname);
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <i className="bi bi-sliders"></i>
                      Thresholds
                    </button>
                  </div>

                  {hasWarning && (
                    <div style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "16px"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px"
                      }}>
                        <i className="bi bi-exclamation-triangle-fill" style={{ color: "#ef4444" }}></i>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#991b1b" }}>
                          Threshold Exceeded
                        </span>
                      </div>
                      {warnings.map((warning, idx) => (
                        <div key={idx} style={{
                          fontSize: "12px",
                          color: "#dc2626",
                          marginLeft: "24px",
                          marginTop: "4px"
                        }}>
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827"
                  }}>
                    {agent.hostname}
                  </h3>

                  <p style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <i className="bi bi-globe"></i>
                    {agent.ip}
                  </p>

                  {/* CPU Section */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{
                      margin: "0 0 10px 0",
                      fontSize: "13px",
                      color: "#7f8c8d",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      letterSpacing: "0.5px"
                    }}>CPU</h4>
                    <div>
                      <span style={{ fontSize: "28px", fontWeight: "700", color: "#2c3e50" }}>
                        {agent.cpu.total_percent.toFixed(1)}%
                      </span>
                      <div style={{
                        width: "100%",
                        height: "8px",
                        background: "#ecf0f1",
                        borderRadius: "4px",
                        overflow: "hidden",
                        margin: "8px 0"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(agent.cpu.total_percent, 100)}%`,
                          background: agent.cpu.total_percent > (thresholds[agent.hostname]?.cpu || 80)
                            ? "linear-gradient(90deg, #ef4444, #dc2626)"
                            : "linear-gradient(90deg, #3498db, #2980b9)",
                          borderRadius: "4px",
                          transition: "width 0.3s ease"
                        }}></div>
                      </div>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                      marginTop: "10px"
                    }}>
                      {agent.cpu.per_core.slice(0, 8).map((core, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: "#f8f9fa",
                          borderRadius: "4px",
                          fontSize: "11px"
                        }}>
                          <span style={{ color: "#7f8c8d", fontWeight: "600" }}>C{idx}</span>
                          <span style={{ color: "#2c3e50", fontWeight: "500" }}>
                            {core.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Memory Section */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{
                      margin: "0 0 10px 0",
                      fontSize: "13px",
                      color: "#7f8c8d",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      letterSpacing: "0.5px"
                    }}>Memory</h4>
                    <div>
                      <span style={{ fontSize: "28px", fontWeight: "700", color: "#2c3e50" }}>
                        {agent.memory.used_percent.toFixed(1)}%
                      </span>
                      <span style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#95a5a6",
                        marginTop: "4px"
                      }}>
                        {formatBytes(agent.memory.used)} / {formatBytes(agent.memory.total)}
                      </span>
                      <div style={{
                        width: "100%",
                        height: "8px",
                        background: "#ecf0f1",
                        borderRadius: "4px",
                        overflow: "hidden",
                        margin: "8px 0"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${agent.memory.used_percent}%`,
                          background: agent.memory.used_percent > (thresholds[agent.hostname]?.memory || 85)
                            ? "linear-gradient(90deg, #ef4444, #dc2626)"
                            : "linear-gradient(90deg, #e74c3c, #c0392b)",
                          borderRadius: "4px",
                          transition: "width 0.3s ease"
                        }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Disk Section */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{
                      margin: "0 0 10px 0",
                      fontSize: "13px",
                      color: "#7f8c8d",
                      textTransform: "uppercase",
                      fontWeight: "600",
                      letterSpacing: "0.5px"
                    }}>Disk</h4>
                    {agent.disk.slice(0, 3).map((d, idx) => (
                      <div key={idx} style={{ marginBottom: "12px" }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px"
                        }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#2c3e50" }}>
                            {d.mount}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#7f8c8d" }}>
                            {d.used_percent.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{
                          width: "100%",
                          height: "8px",
                          background: "#ecf0f1",
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${d.used_percent}%`,
                            background: d.used_percent > (thresholds[agent.hostname]?.disk || 90)
                              ? "linear-gradient(90deg, #ef4444, #dc2626)"
                              : "linear-gradient(90deg, #f39c12, #e67e22)",
                            borderRadius: "4px",
                            transition: "width 0.3s ease"
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: "11px",
                          color: "#95a5a6",
                          marginTop: "4px",
                          display: "block"
                        }}>
                          {formatBytes(d.used)} / {formatBytes(d.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{
                    paddingTop: "16px",
                    borderTop: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: "11px", color: "#95a5a6" }}>
                      Updated: {new Date(agent.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: hasWarning ? "#ef4444" : "#10b981",
                      fontWeight: "600"
                    }}>
                      {hasWarning ? "⚠ Warning" : "✓ Healthy"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Threshold Modal */}
      {showThresholdModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}
        onClick={() => setShowThresholdModal(false)}
        >
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "700",
                color: "#111827"
              }}>
                Set Thresholds
              </h2>
              <button
                onClick={() => setShowThresholdModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "0",
                  width: "32px",
                  height: "32px"
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              margin: "0 0 24px 0",
              color: "#6b7280",
              fontSize: "14px"
            }}>
              Server: <strong>{selectedAgent}</strong>
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                CPU Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={tempThreshold.cpu}
                onChange={(e) => setTempThreshold({...tempThreshold, cpu: Number(e.target.value)})}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                Memory Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={tempThreshold.memory}
                onChange={(e) => setTempThreshold({...tempThreshold, memory: Number(e.target.value)})}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                Disk Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={tempThreshold.disk}
                onChange={(e) => setTempThreshold({...tempThreshold, disk: Number(e.target.value)})}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowThresholdModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveThreshold}
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
                Save Thresholds
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          header h1 {
            font-size: 24px !important;
          }
          
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
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