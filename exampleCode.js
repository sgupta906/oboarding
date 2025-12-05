import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  ChevronRight, 
  User, 
  LayoutDashboard, 
  BookOpen,
  MessageSquare,
  ShieldAlert,
  Clock,
  ThumbsUp,
  X
} from 'lucide-react';

// --- MOCK DATA (Simulating Firestore) ---

const INITIAL_STEPS = [
  {
    id: 1,
    title: "Setup Corporate Gmail",
    description: "Your temporary password is in your personal email. Log in and set up 2FA immediately.",
    role: "All",
    owner: "IT Support",
    expert: "Sarah J.",
    status: "completed", // pending, completed, stuck
    link: "#"
  },
  {
    id: 2,
    title: "Install VS Code & Extensions",
    description: "Download VS Code. Please install the 'Prettier' and 'ESLint' extensions using the company profile.",
    role: "Engineering",
    owner: "DevOps",
    expert: "Mike T.",
    status: "pending",
    link: "#"
  },
  {
    id: 3,
    title: "Configure VPN Access",
    description: "Download the Cisco AnyConnect client. Use the server address: `vpn.company.internal`. You will need your RSA token.",
    role: "All",
    owner: "NetSec",
    expert: "Alex R.",
    status: "pending",
    link: "#"
  },
  {
    id: 4,
    title: "Join Slack Channels",
    description: "Join #general, #engineering, and #random. Say hello in #general!",
    role: "All",
    owner: "HR",
    expert: "Lisa M.",
    status: "pending",
    link: "#"
  }
];

const INITIAL_SUGGESTIONS = [
  {
    id: 101,
    stepId: 1,
    user: "Jane Doe",
    text: "The link to 2FA setup in the doc is broken. It should point to the new Okta portal.",
    status: "pending"
  }
];

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

// --- MAIN APP COMPONENT ---

export default function OnboardingHub() {
  const [view, setView] = useState('employee'); // 'employee' or 'manager'
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  
  // Modal State for "Suggest Edit"
  const [activeModal, setActiveModal] = useState(null); // { type: 'edit' | 'stuck', stepId: number }
  const [modalText, setModalText] = useState("");

  // --- ACTIONS ---

  const handleStatusChange = (id, newStatus) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, status: newStatus } : step
    ));
  };

  const handleSuggestEdit = () => {
    if (!modalText.trim()) return;
    
    const newSuggestion = {
      id: Date.now(),
      stepId: activeModal.stepId,
      user: "Current User",
      text: modalText,
      status: "pending"
    };
    
    setSuggestions([...suggestions, newSuggestion]);
    setModalText("");
    setActiveModal(null);

    // Show success notification
    alert("Suggestion submitted!");
  };

  const handleReportStuck = () => {
    handleStatusChange(activeModal.stepId, 'stuck');
    setActiveModal(null);
    // In real app, this triggers the API email to the 'owner'
  };

  const getProgress = () => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  // --- VIEWS ---

  const EmployeeView = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome to the Team, Alex! 🚀</h1>
        <p className="text-indigo-100 mb-6">Day 1 Onboarding • Engineering Team</p>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>Your Progress</span>
            <span>{getProgress()}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5">
            <div 
              className="bg-white h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* The Timeline / Quest Log */}
      <div className="space-y-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 -z-10 hidden md:block"></div>

        {steps.map((step, index) => (
          <div key={step.id} className={`transition-all duration-300 ${step.status === 'completed' ? 'opacity-60' : 'opacity-100'}`}>
            <Card className={`p-6 border-l-4 ${
              step.status === 'stuck' ? 'border-l-rose-500 ring-2 ring-rose-100' : 
              step.status === 'completed' ? 'border-l-emerald-500' : 'border-l-indigo-500'
            }`}>
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Step Indicator */}
                <div className="hidden md:flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                    step.status === 'completed' ? 'bg-emerald-500' : 
                    step.status === 'stuck' ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle size={20} /> : index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {step.title}
                        {step.status === 'stuck' && <Badge color="red">STUCK</Badge>}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge color="slate">Owner: {step.owner}</Badge>
                        <Badge color="blue">Expert: {step.expert}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                  
                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                    
                    {/* Primary Action */}
                    {step.status !== 'completed' ? (
                      <button 
                        onClick={() => handleStatusChange(step.id, 'completed')}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                      >
                        <div className="w-4 h-4 border-2 border-white/30 rounded-full"></div>
                        Mark as Done
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(step.id, 'pending')}
                        className="flex items-center gap-2 text-emerald-600 font-medium text-sm px-3 py-2 bg-emerald-50 rounded-lg"
                      >
                        <CheckCircle size={16} /> Completed
                      </button>
                    )}

                    {/* Secondary Actions (The Innovation) */}
                    {step.status !== 'completed' && (
                      <>
                        <button 
                          onClick={() => setActiveModal({ type: 'stuck', stepId: step.id })}
                          className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <AlertCircle size={16} /> I'm Stuck
                        </button>
                        
                        <button 
                          onClick={() => setActiveModal({ type: 'edit', stepId: step.id })}
                          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
                        >
                          <Edit3 size={16} /> Suggest Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  const ManagerView = () => (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Onboarding Dashboard</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + New Hire
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Active Onboardings</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">12</h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <User size={24} />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Stuck Employees</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">2</h3>
            </div>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <ShieldAlert size={24} />
            </div>
          </div>
          <p className="text-xs text-rose-600 mt-3 font-medium">Needs attention: Alex R, John D.</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Doc Feedback</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{suggestions.length}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <MessageSquare size={24} />
            </div>
          </div>
           <p className="text-xs text-slate-500 mt-3">Pending review</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* The Rot Report (Suggestions) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Edit3 size={18} className="text-indigo-600" />
            Documentation Feedback
          </h2>
          {suggestions.length === 0 ? (
            <div className="text-slate-400 italic text-sm">No suggestions pending.</div>
          ) : (
            suggestions.map(sugg => (
              <Card key={sugg.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge color="amber">Step: {steps.find(s => s.id === sugg.stepId)?.title || 'Unknown'}</Badge>
                  <span className="text-xs text-slate-400">Today</span>
                </div>
                <p className="text-sm text-slate-700 font-medium mb-1">"{sugg.text}"</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-slate-500">by {sugg.user}</span>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600">
                      <CheckCircle size={16} />
                    </button>
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Live Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            Live Activity
          </h2>
          <Card className="divide-y divide-slate-100">
            {[1,2,3].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    JD
                 </div>
                 <div>
                    <p className="text-sm font-medium text-slate-900">Jane Doe completed "Setup AWS"</p>
                    <p className="text-xs text-slate-500">24 mins ago</p>
                 </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );

  // --- MODALS ---

  const renderModal = () => {
    if (!activeModal) return null;
    const step = steps.find(s => s.id === activeModal.stepId);
    
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {activeModal.type === 'edit' ? 'Suggest an Edit' : 'Report Blocker'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              {activeModal.type === 'edit' 
                ? `Found an issue with "${step.title}"? Help us improve it for the next hire!`
                : `Stuck on "${step.title}"? This will alert ${step.expert} (Subject Matter Expert) immediately.`
              }
            </p>

            {activeModal.type === 'edit' && (
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
                placeholder="e.g., The screenshot is outdated, the button is actually green..."
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                autoFocus
              />
            )}
          </div>
          
          <div className="bg-slate-50 p-4 flex justify-end gap-3">
            <button 
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button 
              onClick={activeModal.type === 'edit' ? handleSuggestEdit : handleReportStuck}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm ${
                activeModal.type === 'edit' 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {activeModal.type === 'edit' ? 'Submit Suggestion' : 'Notify Expert'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <ChevronRight size={20} strokeWidth={3} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Onboard<span className="text-indigo-600">Hub</span></span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('employee')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'employee' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Employee View
            </button>
            <button 
              onClick={() => setView('manager')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'manager' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Manager View
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'employee' ? <EmployeeView /> : <ManagerView />}
      </main>

      {renderModal()}
    </div>
  );
}