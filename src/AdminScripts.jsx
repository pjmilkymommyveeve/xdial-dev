import React, { useState, useEffect } from "react";
import { FaFileCode, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import Loader from "./components/Loader";

const AdminScripts = () => {
    const [allScripts, setAllScripts] = useState([]);
    const [inUseScripts, setInUseScripts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [inUseSearchTerm, setInUseSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE = "https://api.xlitecore.xdialnetworks.com/api/v1/miscellaneous";

    const fetchAllScripts = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE}/script-registry`, {
                headers: { "accept": "application/json", "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch script registry");
            const result = await response.json();
            setAllScripts(result || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchInUseScripts = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE}/script-registry-db`, {
                headers: { "accept": "application/json", "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch in-use scripts");
            const result = await response.json();
            setInUseScripts(result || []);
        } catch (err) {
            console.error("Error fetching in-use scripts:", err);
        }
    };

    useEffect(() => {
        fetchAllScripts();
        fetchInUseScripts();
    }, []);

    const addScriptToUse = async (scriptName) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE}/script-registry-db`, {
                method: "POST",
                headers: { 
                    "accept": "application/json", 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ script_name: scriptName, in_use: true })
            });
            if (!response.ok) throw new Error("Failed to add script");
            await fetchInUseScripts();
        } catch (err) {
            setError(err.message);
        }
    };

    const removeScriptFromUse = async (entryId) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE}/script-registry-db/${entryId}`, {
                method: "DELETE",
                headers: { 
                    "accept": "application/json", 
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Failed to remove script");
            await fetchInUseScripts();
        } catch (err) {
            setError(err.message);
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return "-";
        const d = new Date(isoString);
        return d.toLocaleString();
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isScriptInUse = (scriptName) => {
        return inUseScripts.some(script => script.script_name === scriptName);
    };

    const availableScripts = allScripts.filter(script => !isScriptInUse(script.name));
    const filteredAvailableScripts = availableScripts.filter(script => 
        script.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredInUseScripts = inUseScripts.filter(script =>
        script.script_name.toLowerCase().includes(inUseSearchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: "24px", backgroundColor: "#f8f9fa", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: 0, display: "flex", alignItems: "center" }}>
                    <FaFileCode style={{ marginRight: '10px', color: '#4f46e5' }} />
                    Scripts Registry
                </h2>
            </div>

            {error && (
                <div style={{ color: "#dc2626", padding: "16px", backgroundColor: "#fee2e2", borderRadius: "8px", marginBottom: "24px" }}>
                    Error: {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* LEFT SIDE - Available Scripts */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                            Available Scripts
                        </h3>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search available scripts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px 12px 10px 36px', 
                                    border: '1px solid #d1d5db', 
                                    borderRadius: '6px', 
                                    fontSize: '14px', 
                                    boxSizing: 'border-box' 
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                        {loading ? (
                            <Loader size="medium" />
                        ) : filteredAvailableScripts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                {searchTerm ? 'No scripts match your search.' : 'No available scripts.'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredAvailableScripts.map((script, index) => (
                                    <div 
                                        key={index}
                                        style={{ 
                                            padding: '12px 16px', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '6px', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px', marginBottom: '4px' }}>
                                                {script.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {formatBytes(script.size_bytes)} • Updated {formatDate(script.updated_at)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => addScriptToUse(script.name)}
                                            style={{ 
                                                padding: '8px 12px', 
                                                backgroundColor: '#4f46e5', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '6px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <FaPlus /> Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE - In Use Scripts */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f0fdf4' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                            In Use Scripts ({inUseScripts.length})
                        </h3>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search in-use scripts..."
                                value={inUseSearchTerm}
                                onChange={(e) => setInUseSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px 12px 10px 36px', 
                                    border: '1px solid #d1d5db', 
                                    borderRadius: '6px', 
                                    fontSize: '14px', 
                                    boxSizing: 'border-box' 
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredInUseScripts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                {inUseSearchTerm ? 'No scripts match your search.' : 'No scripts in use. Click "Add" on available scripts to add them here.'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredInUseScripts.map((script, index) => (
                                    <div 
                                        key={index}
                                        style={{ 
                                            padding: '12px 16px', 
                                            border: '1px solid #bbf7d0', 
                                            borderRadius: '6px', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            backgroundColor: '#f0fdf4',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                                                {script.script_name}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeScriptFromUse(script.id)}
                                            style={{ 
                                                padding: '8px 12px', 
                                                backgroundColor: '#dc2626', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '6px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <FaTimes /> Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminScripts;