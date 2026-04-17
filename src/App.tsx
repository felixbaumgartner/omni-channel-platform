import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CampaignList from "./pages/CampaignList";
import CampaignCreate from "./pages/CampaignCreate";
import TransactionalCreate from "./pages/TransactionalCreate";
import JourneyList from "./pages/JourneyList";
import JourneyBuilder from "./pages/JourneyBuilder";
import Analytics from "./pages/Analytics";
import ChannelPreferences from "./pages/ChannelPreferences";
import MessageTriggers from "./pages/MessageTriggers";
import TriggerCreate from "./pages/TriggerCreate";
import HoldoutManagement from "./pages/HoldoutManagement";
import CampaignPriority from "./pages/CampaignPriority";
import NoSendReasons from "./pages/NoSendReasons";

const nav = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

export default function App() {
  return (
    <div className="app-layout">
<div className="app-layout-main">
        {/* Sidebar */}
        <div className="app-layout-sidebar">
          <div className="app-nav-section">
            <div className="app-nav-section-title">Overview</div>
            <div className="app-nav-link">
              <NavLink to="/dashboard" className={nav}>Dashboard</NavLink>
            </div>
          </div>

          <div className="app-nav-section">
            <div className="app-nav-section-title">Messaging</div>
            <div className="app-nav-link">
              <NavLink to="/campaigns" className={nav}>Campaigns</NavLink>
            </div>
            <div className="app-nav-link">
              <NavLink to="/journeys" className={nav}>Journeys</NavLink>
            </div>
            <div className="app-nav-link">
              <NavLink to="/triggers" className={nav}>Message Triggers</NavLink>
            </div>
          </div>

          <div className="app-nav-section">
            <div className="app-nav-section-title">Controls</div>
            <div className="app-nav-link">
              <NavLink to="/campaign-priority" className={nav}>Campaign Priority</NavLink>
            </div>
            <div className="app-nav-link">
              <NavLink to="/holdouts" className={nav}>Holdout Management</NavLink>
            </div>
            <div className="app-nav-link">
              <NavLink to="/no-send" className={nav}>No-Send Reasons</NavLink>
            </div>
          </div>

          <div className="app-nav-section">
            <div className="app-nav-section-title">Intelligence</div>
            <div className="app-nav-link">
              <NavLink to="/channel-preferences" className={nav}>Channel Preferences</NavLink>
            </div>
            <div className="app-nav-link">
              <NavLink to="/analytics" className={nav}>Analytics</NavLink>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-footer-item">
              <span className="sidebar-dot sidebar-dot--green" /> System Healthy
            </div>
            <div className="sidebar-footer-item text-muted" style={{ fontSize: 11 }}>
              v2.1.0 &middot; Omni-Channel &middot; Last sync: 2 min ago
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="app-layout-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaign/new" element={<CampaignCreate />} />
            <Route path="/campaign/new/transactional" element={<TransactionalCreate />} />
            <Route path="/journeys" element={<JourneyList />} />
            <Route path="/journey/new" element={<JourneyBuilder />} />
            <Route path="/triggers" element={<MessageTriggers />} />
            <Route path="/trigger/new" element={<TriggerCreate />} />
            <Route path="/campaign-priority" element={<CampaignPriority />} />
            <Route path="/holdouts" element={<HoldoutManagement />} />
            <Route path="/no-send" element={<NoSendReasons />} />
            <Route path="/channel-preferences" element={<ChannelPreferences />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
