import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ClientDashboard from './ClientDashboard';
import Login from './login';
import ClientLanding from './ClientLanding';
import ClientRecordings from './Clientrecordings';
import DataExport from './DataExport';
import IntegrationForm from './IntegrationForm';
import ManageTeam from './ManageTeam';
import AdminDataExport from './AdminDataExport';
import AdminDashboard from './AdminDashboard';
import AdminLanding from './AdminLanding';
function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;