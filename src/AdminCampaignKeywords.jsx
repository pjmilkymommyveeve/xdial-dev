
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import {
    FaSearch,
    FaFilter,
    FaPlus,
    FaTrash,
    FaEdit,
    FaCloudUploadAlt,
    FaArrowLeft,
    FaSave,
    FaTimes,
    FaCheck,
    FaExclamationTriangle,
    FaList,
    FaThLarge,
} from "react-icons/fa";

const AdminCampaignKeywords = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [stats, setStats] = useState({
        total_campaign_models: 0,
        total_categories: 0,
        total_keywords: 0,
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState("");

    const [filterHasKeywords, setFilterHasKeywords] = useState(false);
    const [viewMode, setViewMode] = useState("card");

    // UI State for selected model
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [renameCategoryName, setRenameCategoryName] = useState("");
    const [bulkKeywordsInput, setBulkKeywordsInput] = useState("");
    const [addingKeywordsToCategory, setAddingKeywordsToCategory] = useState(null);
    const [removingKeywordsMode, setRemovingKeywordsMode] = useState(null);
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        let result = campaigns;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.campaign_name.toLowerCase().includes(lowerQuery) ||
                    c.model_name.toLowerCase().includes(lowerQuery)
            );
        }

        if (filterHasKeywords) {
            result = result.filter((c) => c.total_keywords > 0);
        }

        setFilteredCampaigns(result);
    }, [campaigns, searchQuery, filterHasKeywords]);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const response = await api.get("/campaigns/keywords/all");
            setCampaigns(response.data.campaign_keywords || []);
            setStats({
                total_campaign_models: response.data.total_campaign_models,
                total_categories: response.data.campaign_keywords.reduce(
                    (acc, cur) => acc + (cur.total_categories || 0),
                    0
                ),
                total_keywords: response.data.campaign_keywords.reduce(
                    (acc, cur) => acc + (cur.total_keywords || 0),
                    0
                ),
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch campaigns:", err);
            setError("Failed to load campaign data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchModelDetails = async (id) => {
        try {
            setLoading(true);
            const response = await api.get(`/campaigns/keywords/campaign-model/${id}`);
            setSelectedModel(response.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch model details:", err);
            setError("Failed to load model details.");
        } finally {
            setLoading(false);
        }
    };

    const handleModelClick = (model) => {
        fetchModelDetails(model.campaign_model_id);
    };

    const handleBack = () => {
        setSelectedModel(null);
        fetchCampaigns(); // Refresh list to get updated stats
    };

    // --- Category Actions ---

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/add-category`,
                { category: newCategoryName }
            );
            setNewCategoryName("");
            fetchModelDetails(selectedModel.campaign_model_id);
        } catch (err) {
            alert("Failed to add category: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleRenameCategory = async (oldName) => {
        if (!renameCategoryName.trim() || renameCategoryName === oldName) {
            setEditingCategory(null);
            return;
        }
        try {
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/rename-category`,
                {
                    old_name: oldName,
                    new_name: renameCategoryName,
                }
            );
            setEditingCategory(null);
            fetchModelDetails(selectedModel.campaign_model_id);
        } catch (err) {
            alert(
                "Failed to rename category: " + (err.response?.data?.detail || err.message)
            );
        }
    };

    const handleDeleteCategory = async (category) => {
        if (
            !window.confirm(
                `Are you sure you want to delete category "${category}" and all its keywords?`
            )
        )
            return;
        try {
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/delete-category`,
                { category }
            );
            fetchModelDetails(selectedModel.campaign_model_id);
        } catch (err) {
            alert(
                "Failed to delete category: " + (err.response?.data?.detail || err.message)
            );
        }
    };

    // --- Keyword Actions ---

    const handleAddKeywords = async (category) => {
        if (!bulkKeywordsInput.trim()) return;
        const keywords = bulkKeywordsInput
            .split("\n")
            .map((k) => k.trim())
            .filter((k) => k);

        try {
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/bulk-add-keywords`,
                {
                    category,
                    keywords,
                }
            );
            setBulkKeywordsInput("");
            setAddingKeywordsToCategory(null);
            fetchModelDetails(selectedModel.campaign_model_id);
        } catch (err) {
            alert(
                "Failed to add keywords: " + (err.response?.data?.detail || err.message)
            );
        }
    };

    const handleRemoveKeywords = async (category, keywordsToRemove) => {
        try {
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/bulk-remove-keywords`,
                {
                    category,
                    keywords: keywordsToRemove,
                }
            );
            setSelectedKeywords([]);
            setRemovingKeywordsMode(null);
            fetchModelDetails(selectedModel.campaign_model_id);
        } catch (err) {
            alert(
                "Failed to remove keywords: " + (err.response?.data?.detail || err.message)
            );
        }
    };

    const handleCSVUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            await api.post(
                `/campaigns/keywords/campaign-model/${selectedModel.campaign_model_id}/upload-csv`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            setShowCsvModal(false);
            fetchModelDetails(selectedModel.campaign_model_id);
            alert("Keywords replaced successfully from CSV.");
        } catch (err) {
            console.error(err);
            alert("Failed to upload CSV: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };


    // --- Render Helpers ---

    const renderStatsCard = (title, value, icon, color) => (
        <div
            style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                borderLeft: `4px solid ${color}`,
            }}
        >
            <div
                style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: `${color}15`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: color,
                    fontSize: "20px",
                }}
            >
                {icon}
            </div>
            <div>
                <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                    {title}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}>
                    {value}
                </div>
            </div>
        </div>
    );

    if (loading && !campaigns.length && !selectedModel) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "#f3f4f6",
                }}
            >
                <div className="spinner"></div> {/* Assuming a global spinner class or I can add inline styles later */}
                Loading...
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f9fafb",
                fontFamily: "'Inter', sans-serif",
                padding: "32px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    marginBottom: "32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "800",
                            color: "#111827",
                            marginBottom: "8px",
                        }}
                    >
                        Campaign Keywords Management
                    </h1>
                    <p style={{ color: "#6b7280" }}>
                        Manage keywords for AI campaign models and their categories.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                {selectedModel ? (
                    // --- Detail View ---
                    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                        <button
                            onClick={handleBack}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#4f46e5",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "20px",
                                fontSize: "16px",
                            }}
                        >
                            <FaArrowLeft /> Back to List
                        </button>

                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "24px",
                                borderRadius: "16px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                                marginBottom: "24px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>
                                    {selectedModel.campaign_name}
                                </h2>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span
                                        style={{
                                            backgroundColor: "#eff6ff",
                                            color: "#3b82f6",
                                            padding: "4px 12px",
                                            borderRadius: "20px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Model: {selectedModel.model_name}
                                    </span>
                                    <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                                        Last Updated: {new Date(selectedModel.last_updated).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={() => setShowCsvModal(true)}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#f59e0b",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <FaCloudUploadAlt /> Upload CSV
                                </button>
                                <button
                                    onClick={() => setAddingKeywordsToCategory("new_category")} // Hack to scroll to bottom or just focus new category input
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <FaPlus /> Add Category
                                </button>
                            </div>
                        </div>

                        {/* Categories List */}
                        <div style={{ display: "grid", gap: "24px" }}>
                            {selectedModel.keywords &&
                                Object.entries(selectedModel.keywords).map(([category, keywords]) => (
                                    <div
                                        key={category}
                                        style={{
                                            backgroundColor: "white",
                                            borderRadius: "12px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: "16px 24px",
                                                borderBottom: "1px solid #f3f4f6",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                backgroundColor: "#f9fafb",
                                            }}
                                        >
                                            {editingCategory === category ? (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <input
                                                        type="text"
                                                        value={renameCategoryName}
                                                        onChange={(e) => setRenameCategoryName(e.target.value)}
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                            border: "1px solid #d1d5db",
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRenameCategory(category)}
                                                        style={{ color: "#10b981", cursor: "pointer", border: "none", background: "none" }}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCategory(null)}
                                                        style={{ color: "#6b7280", cursor: "pointer", border: "none", background: "none" }}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <h3
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: "600",
                                                        color: "#374151",
                                                        margin: 0,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                    }}
                                                >
                                                    {category}
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            backgroundColor: "#e5e7eb",
                                                            color: "#6b7280",
                                                            padding: "2px 8px",
                                                            borderRadius: "12px",
                                                        }}
                                                    >
                                                        {keywords.length} keywords
                                                    </span>
                                                </h3>
                                            )}

                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(category);
                                                        setRenameCategoryName(category);
                                                    }}
                                                    title="Rename Category"
                                                    style={{
                                                        padding: "6px",
                                                        color: "#4b5563",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category)}
                                                    title="Delete Category"
                                                    style={{
                                                        padding: "6px",
                                                        color: "#ef4444",
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ padding: "24px" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "8px",
                                                    marginBottom: "16px",
                                                }}
                                            >
                                                {keywords.length === 0 ? (
                                                    <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No keywords in this category.</div>
                                                ) : (
                                                    keywords.map((keyword, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                backgroundColor: "#f3f4f6",
                                                                color: "#374151",
                                                                padding: "6px 12px",
                                                                borderRadius: "20px",
                                                                fontSize: "14px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "8px",
                                                            }}
                                                        >
                                                            {keyword}
                                                            <div
                                                                style={{ cursor: 'pointer', color: '#9ca3af' }}
                                                                onClick={() => {
                                                                    if (window.confirm(`Delete keyword "${keyword}"?`)) {
                                                                        handleRemoveKeywords(category, [keyword])
                                                                    }
                                                                }}
                                                            >×</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {addingKeywordsToCategory === category ? (
                                                <div style={{ marginTop: "16px", padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>Add Keywords (one per line):</label>
                                                    <textarea
                                                        value={bulkKeywordsInput}
                                                        onChange={e => setBulkKeywordsInput(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            minHeight: '100px',
                                                            padding: '8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #d1d5db',
                                                            marginBottom: '8px',
                                                            fontFamily: 'monospace'
                                                        }}
                                                        placeholder="hello\nhi there\ngood morning"
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => setAddingKeywordsToCategory(null)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: 'white',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleAddKeywords(category)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Add Keywords
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setAddingKeywordsToCategory(category)
                                                        setBulkKeywordsInput("")
                                                    }}
                                                    style={{
                                                        color: "#4f46e5",
                                                        background: "none",
                                                        border: "none",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <FaPlus size={12} /> Add Keywords
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {/* Add New Category Section */}
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    border: "2px dashed #e5e7eb",
                                    padding: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "column",
                                    gap: "16px"
                                }}
                            >
                                <h4 style={{ margin: 0, color: '#6b7280' }}>Create New Category</h4>
                                <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '500px' }}>
                                    <input
                                        id="new-category-input"
                                        type="text"
                                        placeholder="Category Name (e.g., greeting_response)"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db'
                                        }}
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryName.trim()}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: newCategoryName.trim() ? '#4f46e5' : '#e5e7eb',
                                            color: newCategoryName.trim() ? 'white' : '#9ca3af',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CSV Upload Modal */}
                        {showCsvModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', zIndex: 1000
                            }}>
                                <div style={{
                                    backgroundColor: 'white', padding: '32px', borderRadius: '16px',
                                    width: '500px', maxWidth: '90%'
                                }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Upload Keywords CSV</h3>
                                    <div style={{
                                        backgroundColor: '#fffbeb', border: '1px solid #fcd34d',
                                        color: '#92400e', padding: '12px', borderRadius: '8px',
                                        marginBottom: '24px', fontSize: '14px'
                                    }}>
                                        <FaExclamationTriangle style={{ marginRight: '8px' }} />
                                        <strong>Warning:</strong> This will REPLACE all existing keywords for this model.
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                                        Upload a CSV file where headers are category names and values are keywords.
                                    </p>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        ref={fileInputRef}
                                        style={{ marginBottom: '24px', width: '100%' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button
                                            onClick={() => setShowCsvModal(false)}
                                            style={{
                                                padding: '10px 20px', backgroundColor: 'transparent',
                                                border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleCSVUpload(fileInputRef.current?.files[0])}
                                            style={{
                                                padding: '10px 20px', backgroundColor: '#ef4444',
                                                color: 'white', border: 'none', borderRadius: '8px',
                                                cursor: 'pointer', fontWeight: '600'
                                            }}
                                        >
                                            Replace Keywords
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    // --- List View ---
                    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                        {/* Stats Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                gap: "24px",
                                marginBottom: "32px",
                            }}
                        >
                            {renderStatsCard(
                                "Total Campaigns Models",
                                stats.total_campaign_models,
                                <FaFilter />,
                                "#4f46e5"
                            )}
                            {renderStatsCard(
                                "Total Category Types",
                                stats.total_categories,
                                <FaSearch />,
                                "#10b981"
                            )}
                            {renderStatsCard(
                                "Total Keywords",
                                stats.total_keywords,
                                <FaPlus />,
                                "#f59e0b"
                            )}
                        </div>

                        {/* Filters */}
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "24px",
                                borderRadius: "16px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                marginBottom: "24px",
                                display: "flex",
                                gap: "16px",
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
                                <FaSearch
                                    style={{
                                        position: "absolute",
                                        left: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#9ca3af",
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search campaigns or models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "12px 12px 12px 40px",
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        fontSize: "14px",
                                    }}
                                />
                            </div>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={filterHasKeywords}
                                    onChange={(e) => setFilterHasKeywords(e.target.checked)}
                                    style={{ width: "16px", height: "16px" }}
                                />
                                <span style={{ fontSize: "14px", color: "#374151" }}>
                                    Show only with keywords
                                </span>
                            </label>
                        </div>
                        <div style={{ display: "flex", gap: "8px", backgroundColor: "white", padding: "4px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                            <button
                                onClick={() => setViewMode("card")}
                                style={{
                                    padding: "8px",
                                    backgroundColor: viewMode === "card" ? "#eff6ff" : "transparent",
                                    color: viewMode === "card" ? "#4f46e5" : "#6b7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title="Card View"
                            >
                                <FaThLarge />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                style={{
                                    padding: "8px",
                                    backgroundColor: viewMode === "list" ? "#eff6ff" : "transparent",
                                    color: viewMode === "list" ? "#4f46e5" : "#6b7280",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                title="List View"
                            >
                                <FaList />
                            </button>
                        </div>

                        {/* List/Grid View */}
                        {viewMode === "list" ? (
                            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Campaign / Model</th>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Status</th>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Categories</th>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Keywords</th>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Last Updated</th>
                                            <th style={{ padding: "16px", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCampaigns.map((model) => (
                                            <tr
                                                key={model.campaign_model_id}
                                                onClick={() => handleModelClick(model)}
                                                style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background-color 0.1s" }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ fontWeight: "600", color: "#111827" }}>{model.campaign_name}</div>
                                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{model.model_name}</div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    {model.total_keywords > 0 ? (
                                                        <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>Active</span>
                                                    ) : (
                                                        <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>Empty</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "16px", color: "#374151" }}>{model.total_categories}</td>
                                                <td style={{ padding: "16px", color: "#374151" }}>{model.total_keywords}</td>
                                                <td style={{ padding: "16px", color: "#6b7280", fontSize: "14px" }}>
                                                    {model.last_updated ? new Date(model.last_updated).toLocaleDateString() : '-'}
                                                </td>
                                                <td style={{ padding: "16px", textAlign: "right", color: "#4f46e5", fontWeight: "600", fontSize: "14px" }}>
                                                    View Details →
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                    gap: "24px",
                                }}
                            >
                                {filteredCampaigns.map((model) => (
                                    <div
                                        key={model.campaign_model_id}
                                        onClick={() => handleModelClick(model)}
                                        style={{
                                            backgroundColor: "white",
                                            borderRadius: "12px",
                                            padding: "24px",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                            cursor: "pointer",
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                            border: "1px solid transparent",
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 12px 20px rgba(0,0,0,0.1)";
                                            e.currentTarget.style.borderColor = "#c7d2fe";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "none";
                                            e.currentTarget.style.boxShadow =
                                                "0 2px 4px rgba(0,0,0,0.05)";
                                            e.currentTarget.style.borderColor = "transparent";
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            <div>
                                                <h3
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: "700",
                                                        color: "#111827",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {model.campaign_name}
                                                </h3>
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#6b7280",
                                                        backgroundColor: "#f3f4f6",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    Model: {model.model_name}
                                                </div>
                                            </div>
                                            {model.total_keywords > 0 ? (
                                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>Active</span>
                                            ) : (
                                                <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>Empty</span>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "12px",
                                                paddingTop: "16px",
                                                borderTop: "1px solid #f3f4f6",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#9ca3af",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    Categories
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: "600",
                                                        color: "#374151",
                                                    }}
                                                >
                                                    {model.total_categories}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#9ca3af",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    Keywords
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "18px",
                                                        fontWeight: "600",
                                                        color: "#374151",
                                                    }}
                                                >
                                                    {model.total_keywords}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
                                            Updated: {model.last_updated ? new Date(model.last_updated).toLocaleDateString() : 'Never'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #4f46e5;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>
        </div >
    );
};

export default AdminCampaignKeywords;
