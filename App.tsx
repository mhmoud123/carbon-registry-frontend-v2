import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useFrappeUser } from './hooks/useFrappe';
import { frappeLogout } from './services/frappe';
import ProjectPage from './pages/ProjectPage';
import AuthPage from './pages/AuthPage';

const Layout: React.FC<{ children: React.ReactNode, user: any, onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Certificates', path: '/certificates' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex-shrink-0 hidden md:block flex flex-col justify-between">
        <div>
            <div className="p-6">
            <h1 className="text-xl font-bold tracking-wider text-accent flex items-center gap-2">
                <span>❁</span> iCR
            </h1>
            </div>
            <nav className="mt-6">
            {navItems.map(item => (
                <Link 
                key={item.path} 
                to={item.path}
                className={`block px-6 py-3 hover:bg-secondary transition-colors ${
                    location.pathname === item.path ? 'bg-secondary border-r-4 border-accent' : ''
                }`}
                >
                {item.label}
                </Link>
            ))}
            </nav>
        </div>
        <div className="p-6 bg-primary border-t border-secondary">
          <p className="text-sm text-slate-400">Logged in as:</p>
          <p className="font-semibold truncate mb-2">{user?.name || 'User'}</p>
          <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
             Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between md:hidden">
           <span className="font-bold flex items-center gap-2"><span>❁</span> iCR</span>
           <button className="text-slate-500" onClick={onLogout}>Logout</button>
        </header>
        <div className="p-8">
           {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => (
  <div className="max-w-4xl">
    <h1 className="text-3xl font-bold text-slate-900 mb-4">Registry Dashboard</h1>
    <p className="text-slate-600 mb-8">
      Welcome to the Frappe-Architected Frontend.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h3 className="font-semibold text-lg mb-2">Projects</h3>
        <p className="text-slate-500 mb-4">Manage carbon projects and their lifecycles.</p>
        <Link to="/projects" className="text-accent hover:underline">View Projects &rarr;</Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
        <h3 className="font-semibold text-lg mb-2">Certificates</h3>
        <p className="text-slate-500 mb-4">View issued carbon credits and certificates.</p>
        <Link to="/certificates" className="text-accent hover:underline">View Certificates &rarr;</Link>
      </div>
    </div>
  </div>
);

// Placeholder for Certificates
const Certificates = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Carbon Certificates</h1>
    <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
      Waiting for JSON Metadata...
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, loading, refreshUser } = useFrappeUser();

  const handleLogout = async () => {
    try {
        await frappeLogout();
    } catch (e) {
        console.error("Logout failed", e);
    } finally {
        // Clear local storage regardless of API success
        localStorage.removeItem('frappe_user');
        refreshUser();
    }
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-slate-500">Checking session...</div>;
  }

  if (!user) {
      return <AuthPage onLoginSuccess={refreshUser} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/*" element={<ProjectPage />} />
          <Route path="/certificates" element={<Certificates />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
