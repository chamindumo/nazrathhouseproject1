import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CheckInFlow } from './components/CheckIn/CheckInFlow';
import { CheckOutFlow } from './components/CheckOut/CheckOutFlow';
import { Reports } from './components/Reports/Reports';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { FrontDeskDashboard } from './components/FrontDesk/FrontDeskDashboard';
import { visitorService } from './services/visitorService';
import { authService } from './services/authService';
import { googleDriveService } from './services/googleDriveService';
import { User, Visitor } from './types';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkInMode, setCheckInMode] = useState<'check-in' | 'check-out' | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [activeVisitorCount, setActiveVisitorCount] = useState(0);
  const [returningVisitor, setReturningVisitor] = useState<Visitor | null>(null);
  const [noPrint, setNoPrint] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize auth service and check if user is already logged in
    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Only redirect if on auth pages
          const authPaths = ['/login', '/signup'];
          if (authPaths.includes(location.pathname)) {
            const defaultPath = getDefaultPathForUser(user);
            navigate(defaultPath, { replace: true });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const unsubscribe = visitorService.subscribeToActiveVisitors((visitors) => {
      setActiveVisitorCount(visitors.length);
    });

    return () => unsubscribe();
  }, []);

  // Automated Backup Logic
  useEffect(() => {
    const checkBackupSchedule = async () => {
      const now = new Date();
      // Check if it's time for a backup (every 60 minutes)
      const lastAutoBackupTimestamp = localStorage.getItem('last_auto_backup_timestamp');
      const ONE_HOUR_MS = 60 * 60 * 1000;

      let shouldBackup = false;
      if (!lastAutoBackupTimestamp) {
        shouldBackup = true;
      } else {
        const timeSinceLast = now.getTime() - parseInt(lastAutoBackupTimestamp, 10);
        if (timeSinceLast > ONE_HOUR_MS) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log('Checking automated backup schedule (Interval > 1hr)...');
        try {
          await googleDriveService.createBackupIfAuthorized();
        } catch (e) {
          console.error('Automated backup failed:', e);
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkBackupSchedule, 60000);

    // Initial check
    checkBackupSchedule();

    return () => clearInterval(intervalId);
  }, []);

  const getDefaultPathForUser = (user: User): string => {
    switch (user.role) {
      case 'super-admin':
      case 'admin':
        return '/admin';
      case 'hierarchy-person':
        return '/hierarchy';
      case 'front-desk':
        return '/front-desk';
      default:
        return '/login';
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const defaultPath = getDefaultPathForUser(user);
    navigate(defaultPath);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      navigate('/');
      setCheckInMode(null);
      setReturningVisitor(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEmergencyToggle = () => {
    setEmergencyMode(!emergencyMode);
  };

  const handleCheckInComplete = () => {
    if (currentUser?.role === 'front-desk') {
      navigate('/front-desk');
    } else {
      navigate('/');
    }
    setCheckInMode(null);
    setReturningVisitor(null);
  };

  const handleCheckIn = () => {
    setNoPrint(true);
    setCheckInMode('check-in');
  };

  const handleCheckOut = () => {
    setCheckInMode('check-out');
  };

  // Protected Route Component
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'super-admin') {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  // Login Component
  const LoginPage = () => (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onBackToCheckIn={() => navigate('/')}
      onNavigateToSignup={() => navigate('/signup')}
    />
  );

  // Signup Component
  const SignupPage = () => (
    <Signup onBackToLogin={() => navigate('/login')} />
  );

  // Admin Dashboard Component
  const AdminPage = () => (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard 
        currentUser={currentUser!} 
        onLogout={handleLogout} 
        onCheckInClick={() => navigate('/')}
      />
    </ProtectedRoute>
  );

  // Front Desk Dashboard Component
  const FrontDeskPage = () => (
    <ProtectedRoute requiredRole="front-desk">
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="front-desk"
          onViewChange={() => { }}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser!}
          onLogout={handleLogout}
        />

        <main className="py-6">
          <FrontDeskDashboard
            onCheckInClick={() => navigate('/')}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
          />
        </main>
      </div>
    </ProtectedRoute>
  );

  // Hierarchy Dashboard Component
  const HierarchyPage = () => (
    <ProtectedRoute requiredRole="hierarchy-person">
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="hierarchy"
          onViewChange={() => { }}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser!}
          onLogout={handleLogout}
        />

        <main className="py-6">
          <Reports />
        </main>
      </div>
    </ProtectedRoute>
  );

  // Visitor Check-in Page Component
  const VisitorCheckInPage = () => {
    if (checkInMode === 'check-in') {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header
            currentView="checkin"
            onViewChange={() => { }}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
            activeVisitorCount={activeVisitorCount}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main className="py-6">
            <CheckInFlow
              onComplete={handleCheckInComplete}
              returningVisitor={returningVisitor}
              noPrint={noPrint}
            />
          </main>
        </div>
      );
    }

    if (checkInMode === 'check-out') {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header
            currentView="checkout"
            onViewChange={() => { }}
            emergencyMode={emergencyMode}
            onEmergencyToggle={handleEmergencyToggle}
            activeVisitorCount={activeVisitorCount}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main className="py-6">
            <CheckOutFlow onComplete={() => setCheckInMode(null)} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          currentView="visitor-checkin"
          onViewChange={() => { }}
          emergencyMode={emergencyMode}
          onEmergencyToggle={handleEmergencyToggle}
          activeVisitorCount={activeVisitorCount}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="py-6">
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-4xl">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                <div className="text-center pt-12 pb-8 px-8">
                  <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                    Welcome to Our Facility
                  </h1>
                  <p className="text-xl text-gray-600">
                    Please select an option below to get started
                  </p>
                </div>

                <div className="px-12 pb-16 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 hover:border-blue-200 transition-all group flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Check-In</h3>
                      <p className="text-gray-500 mb-8">Arriving at the facility? Register your visit here.</p>
                      <button
                        onClick={handleCheckIn}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition duration-300 shadow-lg text-xl"
                      >
                        Visitor Check-In
                      </button>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 hover:border-indigo-200 transition-all group flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Check-Out</h3>
                      <p className="text-gray-500 mb-8">Leaving the facility? Complete your checkout here.</p>
                      <button
                        onClick={handleCheckOut}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition duration-300 shadow-lg text-xl"
                      >
                        Visitor Check-Out
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 text-lg">Staff Member?</h4>
                        <p className="text-gray-500">Access the administration portal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-xl border-2 border-gray-200 transition shadow-sm text-lg whitespace-nowrap"
                    >
                      Staff Login
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 px-8 py-6 text-center border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Authorized personnel only • Secure system access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<VisitorCheckInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/front-desk" element={<FrontDeskPage />} />
        <Route path="/hierarchy" element={<HierarchyPage />} />
      </Routes>

      {emergencyMode && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-10 pointer-events-none z-40">
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                <span className="font-semibold">EMERGENCY MODE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;