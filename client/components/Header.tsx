import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { isAuthenticated, isAdmin, isCandidate, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
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
            {isAdmin && (
              <Link to="/admin/dashboard" className="text-foreground hover:text-primary transition-colors font-medium">
                Admin
              </Link>
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
                      {isAdmin ? 'Admin Account' : 'Candidate Account'}
                    </div>
                    <Link
                      to={isAdmin ? "/admin/dashboard" : "/profile"}
                      className="block px-4 py-2 text-sm hover:bg-secondary transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {isAdmin ? 'Dashboard' : 'My Profile'}
                    </Link>
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
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="block px-4 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
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
