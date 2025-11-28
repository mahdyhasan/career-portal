import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@augmex.io',
    password: 'password',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Navigation will happen automatically based on user role
      const user = await new Promise(resolve => {
        const checkUser = setInterval(() => {
          const userStr = localStorage.getItem('auth_user');
          if (userStr) {
            clearInterval(checkUser);
            resolve(JSON.parse(userStr));
          }
        }, 100);
        setTimeout(() => clearInterval(checkUser), 2000);
      });

      const userData = user as any;
      if (userData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  const demoLogin = (role: 'admin' | 'candidate') => {
    const email = role === 'admin' ? 'admin@augmex.io' : 'john@example.com';
    setFormData({ email, password: 'password' });
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-border">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 justify-center mb-4">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground text-center">Welcome Back</h1>
              <p className="text-center text-muted-foreground text-sm mt-2">
                Sign in to your account to continue
              </p>
            </div>

            {/* Error Message */}
            {(error || localError) && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 animate-slide-in-up">
                <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error || localError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Logins */}
            <div className="bg-secondary/50 rounded-lg p-4 mb-6 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-3">DEMO ACCOUNTS</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('admin')}
                  className="flex-1"
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('candidate')}
                  className="flex-1"
                >
                  Candidate
                </Button>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-semibold hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
