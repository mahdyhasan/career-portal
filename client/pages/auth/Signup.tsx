import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/api';
import { AlertCircle, Loader2, Mail, Linkedin, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [step, setStep] = useState<'email' | 'verify' | 'details' | 'linkedin'>('email');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form data states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // If user is already authenticated, redirect to profile
  if (isAuthenticated) {
    navigate('/profile');
    return null;
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.sendOTP(email);
      setSuccessMessage(response.message);
      setStep('verify');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!otp) {
      setLocalError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      await authApi.verifyOTP(email, otp);
      setSuccessMessage('Email verified successfully!');
      setStep('details');
    } catch (err: any) {
      setLocalError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validation
    if (!firstName || !lastName || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.signupWithOTP({
        email,
        password,
        firstName,
        lastName,
        otp,
      });

      // Store auth data and redirect
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      navigate('/profile');
    } catch (err: any) {
      setLocalError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignup = () => {
    // For demo purposes, we'll show a message
    // In production, this would integrate with LinkedIn OAuth
    setLocalError('LinkedIn signup will be available in production. For now, please use email verification.');
  };

  const renderEmailStep = () => (
    <form onSubmit={handleSendOTP} className="space-y-4 mb-6">
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-10 mt-6"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Sending OTP...
          </>
        ) : (
          <>
            <Mail size={16} className="mr-2" />
            Send Verification Code
          </>
        )}
      </Button>
    </form>
  );

  const renderVerifyStep = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-4 mb-6">
      <div>
        <Label htmlFor="otp" className="text-sm font-medium text-foreground mb-2 block">
          Verification Code
        </Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={loading}
          maxLength={6}
          className="text-center text-2xl tracking-widest"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('email')}
          disabled={loading}
          className="flex-1"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleSendOTP}
        disabled={loading}
        className="w-full text-sm"
      >
        Didn't receive code? Resend
      </Button>
    </form>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleCompleteSignup} className="space-y-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName" className="text-sm font-medium text-foreground mb-2 block">
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-sm font-medium text-foreground mb-2 block">
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="•••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-2 block">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="•••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <CheckCircle size={16} className="mr-2" />
              Complete Signup
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('verify')}
          disabled={loading}
          className="flex-1"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>
    </form>
  );

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
              <h1 className="text-2xl font-bold text-foreground text-center">
                {step === 'email' && 'Create Candidate Account'}
                {step === 'verify' && 'Verify Your Email'}
                {step === 'details' && 'Complete Your Profile'}
              </h1>
              <p className="text-center text-muted-foreground text-sm mt-2">
                {step === 'email' && 'Join Augmex to start your career journey'}
                {step === 'verify' && 'We sent a verification code to your email'}
                {step === 'details' && 'Set up your account details'}
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg flex gap-3 animate-slide-in-up">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {localError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3 animate-slide-in-up">
                <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{localError}</p>
              </div>
            )}

            {/* Form Steps */}
            {step === 'email' && renderEmailStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'details' && renderDetailsStep()}

            {/* LinkedIn Signup Button */}
            {step === 'email' && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Or sign up with</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLinkedInSignup}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Linkedin size={20} className="text-blue-600" />
                  Sign up with LinkedIn
                </Button>
              </div>
            )}

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
