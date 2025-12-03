import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useMediaQuery } from 'react-responsive';
import { Bell, Menu, X, Search, Filter, Home, Briefcase, User, Settings } from 'lucide-react';

interface MobileAppProps {
  children: React.ReactNode;
}

export const MobileApp: React.FC<MobileAppProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [notificationCount, setNotificationCount] = useState(0);

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  // Swipe handlers for mobile navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => setIsMenuOpen(false),
    onSwipedRight: () => setIsMenuOpen(true),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Check for notifications
    checkNotifications();
    
    // Set up periodic notification check
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotificationCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
    console.log('Searching for:', query);
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, path: '/jobs' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-app" {...handlers}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="header-content">
          <button 
            className="menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="logo">
            <h1>CareerPortal</h1>
          </div>
          
          <div className="header-actions">
            <button 
              className="search-button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            <button 
              className="notifications-button"
              onClick={() => window.location.href = '/notifications'}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        {isSearchOpen && (
          <div className="search-bar">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
              <button 
                className="filter-button"
                onClick={() => console.log('Open filters')}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="side-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="side-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h2>Menu</h2>
              <button 
                className="close-menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="menu-nav">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                      window.location.href = item.path;
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="menu-footer">
              <div className="user-info">
                <div className="user-avatar">
                  <User size={32} />
                </div>
                <div className="user-details">
                  <span className="user-name">John Doe</span>
                  <span className="user-role">Candidate</span>
                </div>
              </div>
              
              <button 
                className="logout-button"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mobile-main">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                window.location.href = item.path;
              }}
            >
              <Icon size={24} />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <style jsx>{`
        .mobile-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9fafb;
        }

        .mobile-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          height: 60px;
        }

        .menu-button {
          background: none;
          border: none;
          padding: 8px;
          color: #374151;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .menu-button:hover {
          background: #f3f4f6;
        }

        .logo h1 {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-button,
        .notifications-button {
          background: none;
          border: none;
          padding: 8px;
          color: #374151;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s;
          position: relative;
        }

        .search-button:hover,
        .notifications-button:hover {
          background: #f3f4f6;
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-bar {
          padding: 0 16px 12px;
          background: white;
          border-top: 1px solid #f3f4f6;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input {
          flex: 1;
          padding: 12px 12px 12px 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-button {
          background: #f3f4f6;
          border: none;
          padding: 12px;
          border-radius: 8px;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .filter-button:hover {
          background: #e5e7eb;
        }

        .side-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 200;
          animation: fadeIn 0.2s ease-out;
        }

        .side-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: white;
          z-index: 201;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        .menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .menu-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-menu {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .menu-nav {
          flex: 1;
          padding: 16px 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #374151;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }

        .menu-item:hover {
          background: #f3f4f6;
        }

        .menu-item.active {
          background: #eff6ff;
          color: #3b82f6;
          font-weight: 600;
        }

        .menu-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: #6b7280;
        }

        .logout-button {
          width: 100%;
          padding: 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        .mobile-main {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 80px;
        }

        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-around;
          padding: 8px 0;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 8px 12px;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.2s;
          min-width: 60px;
        }

        .nav-item:hover {
          color: #3b82f6;
        }

        .nav-item.active {
          color: #3b82f6;
        }

        .nav-label {
          font-size: 12px;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (max-width: 480px) {
          .side-menu {
            width: 100%;
          }

          .nav-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};