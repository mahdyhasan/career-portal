import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { isAuthenticated, isAdmin, isSuperAdmin, isCandidate, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const getAccountType = () => {
    if (isSuperAdmin) return 'SuperAdmin';
    if (isAdmin) return 'Admin';
    if (isCandidate) return 'Candidate';
    return 'User';
  };

  const getDashboardLink = () => {
    if (isSuperAdmin) return '/admin/super-dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/profile';
  };

  const getDashboardLabel = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    return 'My Profile';
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="hidden sm:inline">Augmex</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/jobs" className="text-foreground hover:text-primary transition-colors font-medium">
              Jobs
            </Link>
            {isCandidate && (
              <Link to="/profile" className="text-foreground hover:text-primary transition-colors font-medium">
                My Profile
              </Link>
            )}
            {(isAdmin || isSuperAdmin) && (
              <div className="relative group">
                <button className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
                  Admin
                  <ChevronDown size={14} />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link
                    to="/admin/dashboard"
                    className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      to="/admin/super-dashboard"
                      className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      Super Admin Dashboard
                    </Link>
                  )}
                  {isSuperAdmin && (
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      User Management
                    </Link>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={16} className={cn(
                    "transition-transform",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground">
                      {getAccountType()} Account
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {getDashboardLabel()}
                    </Link>
                    {(isAdmin || isSuperAdmin) && (
                      <>
                        {isSuperAdmin && (
                          <>
                            <Link
                              to="/admin/users"
                              className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              User Management
                            </Link>
                            <Link
                              to="/admin/stats"
                              className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              System Statistics
                            </Link>
                            <Link
                              to="/admin/audit-log"
                              className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Audit Log
                            </Link>
                            <Link
                              to="/admin/config"
                              className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              System Config
                            </Link>
                            <Link
                              to="/admin/export"
                              className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Data Export
                            </Link>
                          </>
                        )}
                        <Link
                          to="/admin/create-job"
                          className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Create Job
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors text-destructive"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-foreground" />
              ) : (
                <Menu size={20} className="text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-border space-y-2 animate-slide-in-up">
            <Link
              to="/"
              className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/jobs"
              className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Jobs
            </Link>
            {isCandidate && (
              <Link
                to="/profile"
                className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Profile
              </Link>
            )}
            {(isAdmin || isSuperAdmin) && (
              <div className="border-t border-border pt-2">
                <div className="px-4 py-2 text-sm text-muted-foreground mb-2">
                  Admin Menu
                </div>
                <Link
                  to="/admin/dashboard"
                  className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
                {isSuperAdmin && (
                  <>
                    <Link
                      to="/admin/super-dashboard"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Super Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      User Management
                    </Link>
                    <Link
                      to="/admin/stats"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      System Statistics
                    </Link>
                    <Link
                      to="/admin/audit-log"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Audit Log
                    </Link>
                    <Link
                      to="/admin/config"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      System Config
                    </Link>
                    <Link
                      to="/admin/export"
                      className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Data Export
                    </Link>
                  </>
                )}
                <Link
                  to="/admin/create-job"
                  className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Job
                </Link>
              </div>
            )}

            {!isAuthenticated && (
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    navigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-destructive font-medium"
              >
                Logout
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
