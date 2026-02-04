import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const AdminVoiceManagement = () => {
    const navigate = useNavigate();

    // State for data
    const [campaignModels, setCampaignModels] = useState([]);
    const [voices, setVoices] = useState([]);
    const [voiceCategories, setVoiceCategories] = useState([]);
    const [selectedCampaignModel, setSelectedCampaignModel] = useState(null);
    const [campaignModelVoicesData, setCampaignModelVoicesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for All Voices card
    const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
    const [newVoiceName, setNewVoiceName] = useState("");
    const [selectedVoiceIds, setSelectedVoiceIds] = useState([]);
    const [isCreatingVoice, setIsCreatingVoice] = useState(false);
    const [voiceActionMessage, setVoiceActionMessage] = useState(null);

    // State for Voice Categories card
    const [categorySearchQuery, setCategorySearchQuery] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [categoryActionMessage, setCategoryActionMessage] = useState(null);

    // State for Campaign Model Voice Management
    const [cmvActionMessage, setCmvActionMessage] = useState(null);
    const [isAssigningVoice, setIsAssigningVoice] = useState(false);
    const [selectedVoiceToAssign, setSelectedVoiceToAssign] = useState("");
    const [isLoadingCMV, setIsLoadingCMV] = useState(false);
    const [uploadingCell, setUploadingCell] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [modelsRes, voicesRes, categoriesRes] = await Promise.all([
                api.get("/campaign-models/"),
                api.get("/voices/"),
                api.get("/voice-categories/"),
            ]);

            console.log("Campaign Models Response:", modelsRes.data);
            console.log("Voices Response:", voicesRes.data);
            console.log("Categories Response:", categoriesRes.data);

            setCampaignModels(Array.isArray(modelsRes.data) ? modelsRes.data : []);
            setVoices(Array.isArray(voicesRes.data) ? voicesRes.data : []);
            setVoiceCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ==================== VOICE FUNCTIONS ====================
    const fetchVoices = async () => {
        try {
            const response = await api.get("/voices/");
            console.log("Fetch Voices Response:", response.data);
            setVoices(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching voices:", err);
        }
    };

    const handleCreateVoice = async () => {
        if (!newVoiceName.trim()) return;
        setIsCreatingVoice(true);
        setVoiceActionMessage(null);
        try {
            const response = await api.post("/voices/bulk", {
                voices: [{ name: newVoiceName.trim() }]
            });
            console.log("Create Voice Response:", response.data);
            if (response.data.success || response.data.created_count > 0) {
                setVoiceActionMessage({ type: "success", text: `Voice "${newVoiceName}" created!` });
                setNewVoiceName("");
                await fetchVoices();
            } else {
                setVoiceActionMessage({ type: "error", text: response.data.errors?.join(", ") || "Failed" });
            }
        } catch (err) {
            console.error("Error creating voice:", err);
            setVoiceActionMessage({ type: "error", text: err.response?.data?.detail || "Failed to create voice" });
        } finally {
            setIsCreatingVoice(false);
        }
    };

    const handleDeleteVoice = async (voiceId) => {
        if (!window.confirm("Delete this voice?")) return;
        try {
            const response = await api.post("/voices/bulk-delete", [voiceId]);
            console.log("Delete Voice Response:", response.data);
            if (response.data.success || response.data.deleted_count > 0) {
                setVoiceActionMessage({ type: "success", text: "Voice deleted!" });
                await fetchVoices();
            } else {
                setVoiceActionMessage({ type: "error", text: "Failed (may be assigned to campaign model)" });
            }
        } catch (err) {
            console.error("Error deleting voice:", err);
            setVoiceActionMessage({ type: "error", text: err.response?.data?.detail || "Failed" });
        }
    };

    const handleBulkDeleteVoices = async () => {
        if (selectedVoiceIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedVoiceIds.length} voice(s)?`)) return;
        try {
            const response = await api.post("/voices/bulk-delete", selectedVoiceIds);
            console.log("Bulk Delete Voices Response:", response.data);
            if (response.data.success || response.data.deleted_count > 0) {
                setVoiceActionMessage({ type: "success", text: `${response.data.deleted_count || selectedVoiceIds.length} deleted!` });
                setSelectedVoiceIds([]);
                await fetchVoices();
            }
        } catch (err) {
            console.error("Error bulk deleting voices:", err);
            setVoiceActionMessage({ type: "error", text: "Failed to delete" });
        }
    };

    const toggleVoiceSelection = (voiceId) => {
        setSelectedVoiceIds(prev => prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId]);
    };

    const filteredVoices = voices.filter(voice =>
        voice.name?.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
        voice.id?.toString().includes(voiceSearchQuery)
    );

    // ==================== VOICE CATEGORIES FUNCTIONS ====================
    const fetchCategories = async () => {
        try {
            const response = await api.get("/voice-categories/");
            console.log("Fetch Categories Response:", response.data);
            setVoiceCategories(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsCreatingCategory(true);
        setCategoryActionMessage(null);
        try {
            const response = await api.post("/voice-categories/bulk", {
                categories: [{ name: newCategoryName.trim() }]
            });
            console.log("Create Category Response:", response.data);
            if (response.data.success || response.data.created_count > 0) {
                setCategoryActionMessage({ type: "success", text: `Category "${newCategoryName}" created!` });
                setNewCategoryName("");
                await fetchCategories();
            } else {
                setCategoryActionMessage({ type: "error", text: response.data.errors?.join(", ") || "Failed" });
            }
        } catch (err) {
            console.error("Error creating category:", err);
            setCategoryActionMessage({ type: "error", text: err.response?.data?.detail || "Failed" });
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm("Delete this category?")) return;
        try {
            const response = await api.post("/voice-categories/bulk-delete", [categoryId]);
            console.log("Delete Category Response:", response.data);
            if (response.data.success || response.data.deleted_count > 0) {
                setCategoryActionMessage({ type: "success", text: "Category deleted!" });
                await fetchCategories();
            }
        } catch (err) {
            console.error("Error deleting category:", err);
            setCategoryActionMessage({ type: "error", text: "Failed" });
        }
    };

    const handleBulkDeleteCategories = async () => {
        if (selectedCategoryIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedCategoryIds.length} category(s)?`)) return;
        try {
            const response = await api.post("/voice-categories/bulk-delete", selectedCategoryIds);
            console.log("Bulk Delete Categories Response:", response.data);
            if (response.data.success || response.data.deleted_count > 0) {
                setCategoryActionMessage({ type: "success", text: `${response.data.deleted_count || selectedCategoryIds.length} deleted!` });
                setSelectedCategoryIds([]);
                await fetchCategories();
            }
        } catch (err) {
            console.error("Error bulk deleting categories:", err);
            setCategoryActionMessage({ type: "error", text: "Failed" });
        }
    };

    const toggleCategorySelection = (categoryId) => {
        setSelectedCategoryIds(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
    };

    const filteredCategories = voiceCategories.filter(cat =>
        cat.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
        cat.id?.toString().includes(categorySearchQuery)
    );

    // ==================== CAMPAIGN MODEL FUNCTIONS ====================
    const fetchCampaignModelVoicesDetailed = async (campaignModelId) => {
        setIsLoadingCMV(true);
        try {
            const response = await api.get(`/campaign-model-voices/campaign-models/${campaignModelId}/detailed`);
            console.log("Campaign Model Voices Detailed Response:", response.data);
            setCampaignModelVoicesData(response.data);
        } catch (err) {
            console.error("Error fetching CMV detailed:", err);
            setCampaignModelVoicesData(null);
        } finally {
            setIsLoadingCMV(false);
        }
    };

    const handleCampaignModelSelect = (model) => {
        console.log("Selected Campaign Model:", model);
        setSelectedCampaignModel(model);
        setCmvActionMessage(null);
        if (model) {
            fetchCampaignModelVoicesDetailed(model.id);
        } else {
            setCampaignModelVoicesData(null);
        }
    };

    const handleAssignVoice = async () => {
        if (!selectedVoiceToAssign || !selectedCampaignModel) return;
        setIsAssigningVoice(true);
        setCmvActionMessage(null);
        try {
            const payload = {
                campaign_model_voices: [{
                    campaign_model_id: selectedCampaignModel.id,
                    voice_id: parseInt(selectedVoiceToAssign),
                    active: true
                }]
            };
            console.log("Assign Voice Payload:", payload);
            const response = await api.post("/campaign-model-voices/bulk", payload);
            console.log("Assign Voice Response:", response.data);
            if (response.data.success || response.data.created_count > 0) {
                setCmvActionMessage({ type: "success", text: "Voice assigned!" });
                setSelectedVoiceToAssign("");
                await fetchCampaignModelVoicesDetailed(selectedCampaignModel.id);
            } else {
                setCmvActionMessage({ type: "error", text: response.data.errors?.join(", ") || "Failed" });
            }
        } catch (err) {
            console.error("Error assigning voice:", err);
            setCmvActionMessage({ type: "error", text: err.response?.data?.detail || "Failed to assign" });
        } finally {
            setIsAssigningVoice(false);
        }
    };

    const handleRemoveVoiceFromCM = async (cmvId) => {
        if (!window.confirm("Remove this voice from campaign model?")) return;
        try {
            const response = await api.post("/campaign-model-voices/bulk-delete", [cmvId]);
            console.log("Remove Voice Response:", response.data);
            if (response.data.success || response.data.deleted_count > 0) {
                setCmvActionMessage({ type: "success", text: "Voice removed!" });
                await fetchCampaignModelVoicesDetailed(selectedCampaignModel.id);
            }
        } catch (err) {
            console.error("Error removing voice:", err);
            setCmvActionMessage({ type: "error", text: "Failed to remove" });
        }
    };

    const handleToggleVoiceActive = async (cmv) => {
        try {
            const payload = {
                campaign_model_voices: [{
                    id: cmv.id,
                    active: !cmv.active
                }]
            };
            console.log("Toggle Active Payload:", payload);
            const response = await api.put("/campaign-model-voices/bulk", payload);
            console.log("Toggle Active Response:", response.data);
            if (response.data.success || response.data.updated_count > 0) {
                await fetchCampaignModelVoicesDetailed(selectedCampaignModel.id);
            }
        } catch (err) {
            console.error("Error toggling voice:", err);
            setCmvActionMessage({ type: "error", text: "Failed to update" });
        }
    };

    const handleUploadRecording = async (cmvId, categoryId, file) => {
        if (!file) return;
        setUploadingCell({ cmvId, categoryId });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("campaign_model_voice_id", cmvId);
        if (categoryId) formData.append("voice_category_id", categoryId);

        console.log("Upload Recording - CMV ID:", cmvId, "Category ID:", categoryId, "File:", file.name);

        try {
            const response = await api.post("/voice-recordings/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            console.log("Upload Recording Response:", response.data);
            setCmvActionMessage({ type: "success", text: "Recording uploaded!" });
            await fetchCampaignModelVoicesDetailed(selectedCampaignModel.id);
        } catch (err) {
            console.error("Error uploading recording:", err);
            setCmvActionMessage({ type: "error", text: err.response?.data?.detail || "Upload failed" });
        } finally {
            setUploadingCell(null);
        }
    };

    const handleDeleteRecording = async (recordingId) => {
        if (!window.confirm("Delete this recording?")) return;
        try {
            const response = await api.post("/voice-recordings/delete", { recording_id: recordingId });
            console.log("Delete Recording Response:", response.data);
            setCmvActionMessage({ type: "success", text: "Recording deleted!" });
            await fetchCampaignModelVoicesDetailed(selectedCampaignModel.id);
        } catch (err) {
            console.error("Error deleting recording:", err);
            setCmvActionMessage({ type: "error", text: "Failed to delete" });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
    };

    // Get assigned voices from the detailed response
    // The response might be an array or an object with a 'voices' property
    const getAssignedVoices = () => {
        if (!campaignModelVoicesData) return [];
        // If it's an array, return it directly
        if (Array.isArray(campaignModelVoicesData)) return campaignModelVoicesData;
        // If it has a 'voices' property
        if (campaignModelVoicesData.voices) return campaignModelVoicesData.voices;
        // If it has a 'data' property
        if (campaignModelVoicesData.data) {
            if (Array.isArray(campaignModelVoicesData.data)) return campaignModelVoicesData.data;
            if (campaignModelVoicesData.data.voices) return campaignModelVoicesData.data.voices;
        }
        return [];
    };

    const assignedVoices = getAssignedVoices();

    const getUnassignedVoices = () => {
        const assignedVoiceIds = assignedVoices.map(v => v.voice_id || v.id);
        return voices.filter(v => !assignedVoiceIds.includes(v.id));
    };

    // Get recordings for a specific voice + category combination
    const getRecordingsForCell = (cmv, categoryId) => {
        const recordings = cmv.recordings || cmv.voice_recordings || [];
        return recordings.filter(rec => {
            // Check if recording belongs to this category
            if (rec.voice_category_id === categoryId) return true;
            if (rec.category_id === categoryId) return true;
            if (rec.categories?.some(cat => cat.id === categoryId)) return true;
            return false;
        });
    };

    // ==================== STYLES ====================
    const cardStyle = {
        backgroundColor: "#1e293b",
        borderRadius: "12px",
        border: "1px solid #334155",
        marginBottom: "24px",
        overflow: "hidden",
    };

    const inputStyle = {
        padding: "10px 14px",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #475569",
        borderRadius: "8px",
        fontSize: "14px",
    };

    const MessageBanner = ({ message, onClose }) => {
        if (!message) return null;
        return (
            <div style={{
                padding: "10px 20px",
                backgroundColor: message.type === "success" ? "#14532d" : "#7f1d1d",
                color: message.type === "success" ? "#86efac" : "#fecaca",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <span>{message.text}</span>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>×</button>
            </div>
        );
    };

    const voiceColors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#84cc16"];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", fontFamily: "Arial, sans-serif", color: "#e2e8f0" }}>
            {/* Header */}
            <header style={{
                backgroundColor: "#1e293b",
                borderBottom: "1px solid #334155",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button onClick={() => navigate("/admin-landing")} style={{
                        padding: "8px 16px",
                        backgroundColor: "#334155",
                        color: "#e2e8f0",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: "pointer",
                    }}>
                        ← Back
                    </button>
                    <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#f1f5f9" }}>
                        Voice Management
                    </h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        padding: "6px 14px",
                        backgroundColor: loading ? "#fbbf24" : "#10b981",
                        borderRadius: "16px",
                        color: loading ? "#1e293b" : "#ffffff",
                        fontSize: "12px",
                        fontWeight: "600",
                    }}>
                        {loading ? "Loading..." : "Ready"}
                    </div>
                    <button onClick={handleLogout} style={{
                        padding: "8px 16px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}>
                        Logout
                    </button>
                </div>
            </header>

            <div style={{ padding: "20px" }}>
                {error && (
                    <div style={{ padding: "12px", backgroundColor: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "8px", marginBottom: "20px", color: "#fecaca", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                {/* Two Column Layout for Voices and Categories */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    {/* All Voices Card */}
                    <div style={cardStyle}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "18px" }}>🎙️</span>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#f1f5f9" }}>All Voices</h3>
                                <span style={{ backgroundColor: "#3b82f6", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "12px" }}>{voices.length}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {selectedVoiceIds.length > 0 && (
                                    <button onClick={handleBulkDeleteVoices} style={{ padding: "6px 10px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                                        🗑️ {selectedVoiceIds.length}
                                    </button>
                                )}
                                <button onClick={fetchVoices} style={{ padding: "6px 10px", backgroundColor: "#334155", color: "#e2e8f0", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>🔄</button>
                            </div>
                        </div>
                        <MessageBanner message={voiceActionMessage} onClose={() => setVoiceActionMessage(null)} />
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #334155", display: "flex", gap: "8px" }}>
                            <input type="text" placeholder="Search..." value={voiceSearchQuery} onChange={(e) => setVoiceSearchQuery(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "8px 12px" }} />
                            <input type="text" placeholder="New voice..." value={newVoiceName} onChange={(e) => setNewVoiceName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateVoice()} style={{ ...inputStyle, flex: 1, padding: "8px 12px" }} />
                            <button onClick={handleCreateVoice} disabled={isCreatingVoice || !newVoiceName.trim()} style={{ padding: "8px 14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", opacity: !newVoiceName.trim() ? 0.5 : 1 }}>+</button>
                        </div>
                        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                            {filteredVoices.map((voice, idx) => (
                                <div key={voice.id} style={{ padding: "10px 16px", backgroundColor: idx % 2 === 0 ? "#1e293b" : "#172033", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <input type="checkbox" checked={selectedVoiceIds.includes(voice.id)} onChange={() => toggleVoiceSelection(voice.id)} style={{ accentColor: "#3b82f6" }} />
                                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: voiceColors[idx % voiceColors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "600", fontSize: "12px" }}>
                                            {voice.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <span style={{ fontWeight: "500", color: "#f1f5f9", fontSize: "13px" }}>{voice.name}</span>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>#{voice.id}</span>
                                    </div>
                                    <button onClick={() => handleDeleteVoice(voice.id)} style={{ padding: "4px 8px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>🗑️</button>
                                </div>
                            ))}
                            {filteredVoices.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No voices</div>}
                        </div>
                    </div>

                    {/* Voice Categories Card */}
                    <div style={cardStyle}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "18px" }}>📂</span>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#f1f5f9" }}>Voice Categories</h3>
                                <span style={{ backgroundColor: "#8b5cf6", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "12px" }}>{voiceCategories.length}</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {selectedCategoryIds.length > 0 && (
                                    <button onClick={handleBulkDeleteCategories} style={{ padding: "6px 10px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                                        🗑️ {selectedCategoryIds.length}
                                    </button>
                                )}
                                <button onClick={fetchCategories} style={{ padding: "6px 10px", backgroundColor: "#334155", color: "#e2e8f0", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>🔄</button>
                            </div>
                        </div>
                        <MessageBanner message={categoryActionMessage} onClose={() => setCategoryActionMessage(null)} />
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #334155", display: "flex", gap: "8px" }}>
                            <input type="text" placeholder="Search..." value={categorySearchQuery} onChange={(e) => setCategorySearchQuery(e.target.value)} style={{ ...inputStyle, flex: 1, padding: "8px 12px" }} />
                            <input type="text" placeholder="New category..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()} style={{ ...inputStyle, flex: 1, padding: "8px 12px" }} />
                            <button onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()} style={{ padding: "8px 14px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", opacity: !newCategoryName.trim() ? 0.5 : 1 }}>+</button>
                        </div>
                        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                            {filteredCategories.map((cat, idx) => (
                                <div key={cat.id} style={{ padding: "10px 16px", backgroundColor: idx % 2 === 0 ? "#1e293b" : "#172033", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => toggleCategorySelection(cat.id)} style={{ accentColor: "#8b5cf6" }} />
                                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "600", fontSize: "12px" }}>
                                            {cat.name?.charAt(0).toUpperCase() || "?"}
                                        </div>
                                        <span style={{ fontWeight: "500", color: "#f1f5f9", fontSize: "13px" }}>{cat.name}</span>
                                        <span style={{ fontSize: "11px", color: "#64748b" }}>#{cat.id}</span>
                                    </div>
                                    <button onClick={() => handleDeleteCategory(cat.id)} style={{ padding: "4px 8px", backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}>🗑️</button>
                                </div>
                            ))}
                            {filteredCategories.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No categories</div>}
                        </div>
                    </div>
                </div>

                {/* ==================== CAMPAIGN MODEL VOICE GRID ==================== */}
                <div style={cardStyle}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600", color: "#f1f5f9" }}>
                                📋 Campaign Model Configuration
                            </h2>
                            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>Select campaign model, assign voices, upload recordings per category</p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <select
                                value={selectedCampaignModel?.id || ""}
                                onChange={(e) => {
                                    const model = campaignModels.find(m => m.id === parseInt(e.target.value));
                                    handleCampaignModelSelect(model || null);
                                }}
                                style={{ ...inputStyle, minWidth: "240px", cursor: "pointer" }}
                            >
                                <option value="">Select Campaign Model</option>
                                {campaignModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.campaign?.name || model.campaign_name || "Campaign"} - {model.model?.name || model.model_name || "Model"}
                                    </option>
                                ))}
                            </select>
                            {selectedCampaignModel && (
                                <button onClick={() => fetchCampaignModelVoicesDetailed(selectedCampaignModel.id)} style={{ padding: "10px 14px", backgroundColor: "#334155", color: "#e2e8f0", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>🔄</button>
                            )}
                        </div>
                    </div>

                    <MessageBanner message={cmvActionMessage} onClose={() => setCmvActionMessage(null)} />

                    {!selectedCampaignModel ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                            <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "#94a3b8" }}>Select a Campaign Model</h3>
                            <p style={{ fontSize: "13px" }}>Choose from dropdown to configure voices and recordings</p>
                        </div>
                    ) : isLoadingCMV ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px", animation: "pulse 2s infinite" }}>⏳</div>
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <>
                            {/* Assign Voice Row */}
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid #334155", backgroundColor: "#0f172a", display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "500" }}>Assign Voice:</span>
                                <select value={selectedVoiceToAssign} onChange={(e) => setSelectedVoiceToAssign(e.target.value)} style={{ ...inputStyle, minWidth: "180px" }}>
                                    <option value="">Select voice...</option>
                                    {getUnassignedVoices().map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                <button onClick={handleAssignVoice} disabled={isAssigningVoice || !selectedVoiceToAssign} style={{ padding: "10px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", opacity: !selectedVoiceToAssign ? 0.5 : 1 }}>
                                    {isAssigningVoice ? "..." : "+ Assign"}
                                </button>
                            </div>

                            {/* Debug Info - Remove in production */}
                            <div style={{ padding: "10px 20px", backgroundColor: "#1a1a2e", fontSize: "11px", color: "#888", borderBottom: "1px solid #334155" }}>
                                Debug: Assigned Voices Count: {assignedVoices.length} | Categories Count: {voiceCategories.length} |
                                Raw Data Type: {campaignModelVoicesData ? (Array.isArray(campaignModelVoicesData) ? "Array" : "Object with keys: " + Object.keys(campaignModelVoicesData).join(", ")) : "null"}
                            </div>

                            {/* GRID: Categories (rows) x Voices (columns) */}
                            {assignedVoices.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎙️</div>
                                    <p>No voices assigned. Use the dropdown above to assign voices.</p>
                                </div>
                            ) : voiceCategories.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
                                    <p>No categories found. Create categories above to organize recordings.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <div style={{ minWidth: `${160 + (assignedVoices.length * 220)}px` }}>
                                        {/* Header Row - STAGES label + Voice columns */}
                                        <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${assignedVoices.length}, 1fr)`, borderBottom: "1px solid #334155" }}>
                                            <div style={{ padding: "16px 20px", backgroundColor: "#1e293b", fontWeight: "600", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center" }}>
                                                STAGES
                                            </div>
                                            {assignedVoices.map((cmv, idx) => (
                                                <div key={cmv.id} style={{ padding: "12px 16px", backgroundColor: "#1e293b", borderLeft: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: voiceColors[idx % voiceColors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px" }}>
                                                            {(cmv.voice_name || cmv.voice?.name || cmv.name || "V").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: "600", color: "#f1f5f9", fontSize: "14px" }}>{cmv.voice_name || cmv.voice?.name || cmv.name || `Voice ${cmv.voice_id || cmv.id}`}</div>
                                                            <div style={{ fontSize: "10px", color: "#64748b" }}>ID: {cmv.voice_id || cmv.id}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontSize: "10px", color: cmv.active ? "#10b981" : "#64748b", fontWeight: "500" }}>
                                                            {cmv.active ? "ACTIVE" : "INACTIVE"}
                                                        </span>
                                                        <div
                                                            onClick={() => handleToggleVoiceActive(cmv)}
                                                            style={{
                                                                width: "40px", height: "22px",
                                                                backgroundColor: cmv.active ? "#10b981" : "#475569",
                                                                borderRadius: "11px", position: "relative", cursor: "pointer"
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: "18px", height: "18px", backgroundColor: "white", borderRadius: "50%",
                                                                position: "absolute", top: "2px",
                                                                left: cmv.active ? "20px" : "2px", transition: "left 0.2s"
                                                            }}></div>
                                                        </div>
                                                        <button onClick={() => handleRemoveVoiceFromCM(cmv.id)} title="Remove voice" style={{ padding: "4px 6px", backgroundColor: "transparent", color: "#ef4444", border: "none", fontSize: "12px", cursor: "pointer" }}>✕</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Category Rows */}
                                        {voiceCategories.map((category) => (
                                            <div key={category.id} style={{ display: "grid", gridTemplateColumns: `160px repeat(${assignedVoices.length}, 1fr)`, borderBottom: "1px solid #334155" }}>
                                                {/* Category Label */}
                                                <div style={{ padding: "16px 20px", backgroundColor: "#0f172a", borderRight: "1px solid #334155" }}>
                                                    <div style={{ fontWeight: "600", color: "#f1f5f9", fontSize: "13px", marginBottom: "2px" }}>{category.name}</div>
                                                    <div style={{ fontSize: "10px", color: "#64748b" }}>ID: {category.id}</div>
                                                </div>

                                                {/* Voice Cells */}
                                                {assignedVoices.map((cmv) => {
                                                    const cellRecordings = getRecordingsForCell(cmv, category.id);
                                                    const isUploading = uploadingCell?.cmvId === cmv.id && uploadingCell?.categoryId === category.id;
                                                    const cellKey = `${cmv.id}-${category.id}`;

                                                    return (
                                                        <div key={cellKey} style={{
                                                            padding: "12px",
                                                            backgroundColor: cmv.active ? "#0f172a" : "#1a1f2e",
                                                            borderLeft: "1px solid #334155",
                                                            minHeight: "100px",
                                                            opacity: cmv.active ? 1 : 0.5,
                                                        }}>
                                                            {!cmv.active ? (
                                                                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "12px" }}>
                                                                    Voice Inactive
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {cellRecordings.length > 0 && (
                                                                        <div style={{ marginBottom: "8px" }}>
                                                                            {cellRecordings.map((rec) => (
                                                                                <div key={rec.id} style={{
                                                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                                                    padding: "6px 8px", backgroundColor: "#1e293b", borderRadius: "6px", marginBottom: "4px"
                                                                                }}>
                                                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                                        <span style={{ color: "#3b82f6", fontSize: "14px" }}>▶</span>
                                                                                        <span style={{ fontSize: "11px", color: "#e2e8f0", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                            {rec.name || rec.filename || `rec_${rec.id}`}
                                                                                        </span>
                                                                                    </div>
                                                                                    <button onClick={() => handleDeleteRecording(rec.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12px", padding: "2px 4px" }}>🗑️</button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {isUploading ? (
                                                                        <div style={{ padding: "16px", textAlign: "center", color: "#3b82f6", fontSize: "12px" }}>
                                                                            <span style={{ animation: "pulse 1s infinite" }}>⏳ Uploading...</span>
                                                                        </div>
                                                                    ) : (
                                                                        <label style={{
                                                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                                            padding: "12px", border: "2px dashed #334155", borderRadius: "8px", cursor: "pointer",
                                                                            minHeight: cellRecordings.length > 0 ? "50px" : "60px", textAlign: "center",
                                                                        }}>
                                                                            <input
                                                                                type="file"
                                                                                accept=".mp3,audio/*"
                                                                                style={{ display: "none" }}
                                                                                onChange={(e) => {
                                                                                    if (e.target.files[0]) handleUploadRecording(cmv.id, category.id, e.target.files[0]);
                                                                                    e.target.value = null;
                                                                                }}
                                                                            />
                                                                            <span style={{ fontSize: "20px", color: "#475569", marginBottom: "4px" }}>☁️</span>
                                                                            <span style={{ fontSize: "11px", color: "#64748b" }}>Drag MP3 here</span>
                                                                            <span style={{ fontSize: "9px", color: "#475569" }}>or click to browse</span>
                                                                        </label>
                                                                    )}

                                                                    {cellRecordings.length > 0 && (
                                                                        <label style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#3b82f6", cursor: "pointer", textAlign: "center" }}>
                                                                            + Add Variation
                                                                            <input
                                                                                type="file"
                                                                                accept=".mp3,audio/*"
                                                                                style={{ display: "none" }}
                                                                                onChange={(e) => {
                                                                                    if (e.target.files[0]) handleUploadRecording(cmv.id, category.id, e.target.files[0]);
                                                                                    e.target.value = null;
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default AdminVoiceManagement;
