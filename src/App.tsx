import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { PhaseProvider, usePhase, type Phase } from "./context/PhaseContext";
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
import AudienceEstimation from "./pages/AudienceEstimation";
import AudienceEstimationCreate from "./pages/AudienceEstimationCreate";


const nav = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");

const PHASE_OPTIONS: { value: Phase; label: string }[] = [
  { value: "all", label: "All" },
  { value: "phase1", label: "Phase 1" },
  { value: "phase2", label: "Phase 2" },
];

function PhaseSelector() {
  const { phase, setPhase } = usePhase();
  return (
    <div className="phase-selector">
      <div className="phase-selector-label">Development Phase</div>
      <div className="phase-selector-pills">
        {PHASE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`phase-pill ${phase === opt.value ? "phase-pill--active" : ""}`}
            onClick={() => setPhase(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PhaseProvider>
      <AppLayout />
    </PhaseProvider>
  );
}

function AppLayout() {
  const { showChannelPreferences, showAnalytics } = usePhase();
  return (
    <div className="app-layout">
      {/* Header */}
      <div className="app-layout-header">
        <div className="app-layout-header-title">
          <strong>Targeting (PROD)</strong>
        </div>
        <div className="app-layout-header-right">
          <span className="app-header-link">&#9432; Help &amp; Feedback</span>
          <span className="app-header-link">&#9633; Documentation &#8599;</span>
          <span className="app-header-link">&#9881; Settings</span>
        </div>
      </div>

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
          </div>

          <div className="app-nav-section">
            <div className="app-nav-section-title">Intelligence</div>
            <div className="app-nav-link">
              <NavLink to="/audience-estimation" className={nav}>Audience Estimation</NavLink>
            </div>
            {showChannelPreferences && (
              <div className="app-nav-link">
                <NavLink to="/channel-preferences" className={nav}>Channel Preferences</NavLink>
              </div>
            )}
            {showAnalytics && (
              <div className="app-nav-link">
                <NavLink to="/analytics" className={nav}>Analytics</NavLink>
              </div>
            )}
          </div>

          <PhaseSelector />
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
            <Route path="/audience-estimation" element={<AudienceEstimation />} />
            <Route path="/audience-estimation/new" element={<AudienceEstimationCreate />} />
            <Route path="/holdouts" element={<HoldoutManagement />} />

            <Route
              path="/channel-preferences"
              element={showChannelPreferences ? <ChannelPreferences /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/analytics" element={showAnalytics ? <Analytics /> : <Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
