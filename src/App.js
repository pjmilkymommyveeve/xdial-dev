import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageTitleUpdater from './PageTitleUpdater';

import ClientDashboard from './ClientDashboard';
import Login from './login';
import ClientLanding from './ClientLanding';
import ClientRecordings from './Clientrecordings';
import DataExport from './DataExport';
import IntegrationForm from './IntegrationForm';
import RequestCampaign from './RequestCampaign';
import ManageTeam from './ManageTeam';
import AdminDataExport from './AdminDataExport';
import AdminDashboard from './AdminDashboard';
import AdminLanding from './AdminLanding';
import AdminServerStats from './AdminServerStats';
import AdminCampaigns from './AdminCampaigns';
import AdminVoiceStats from './AdminVoiceStats';
import AdminVoiceManagement from './AdminVoiceManagement';
function App() {
    return (
        <Router>
            <PageTitleUpdater />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<ClientDashboard />} />
                <Route path="/client-landing" element={<ClientLanding />} />
                <Route path="/recordings" element={<ClientRecordings />} />
                <Route path="/data-export" element={<DataExport />} />
                <Route path="/integration-form" element={<IntegrationForm />} />
                <Route path="/manage-team" element={<ManageTeam />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-data-export" element={<AdminDataExport />} />
                <Route path="/admin-landing" element={<AdminLanding />} />
                <Route path="/admin-server-stats" element={<AdminServerStats />} />
                <Route path="/admin-campaigns" element={<AdminCampaigns />} />
                <Route path="/admin-voice-stats" element={<AdminVoiceStats />} />
                <Route path="/admin-voice-management" element={<AdminVoiceManagement />} />
                <Route path="/request-campaign" element={<RequestCampaign />} />
            </Routes>
        </Router>
    );
}

export default App;
