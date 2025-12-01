import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  ArrowLeft,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: 'Admin' | 'HiringManager' | 'Candidate';
  phone: string;
  department: string;
  status: 'active' | 'inactive';
}

export default function CreateUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'Candidate',
    phone: '',
    department: '',
    status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // In real implementation, this would call the API
      // await adminApi.createUser(formData);
      
      console.log('Creating user:', formData);
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/admin/users');
      }, 1000);
    } catch (error) {
      console.error('Failed to create user:', error);
      // Handle error (show toast message)
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <SuperAdminLayout>
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Page Header */}
            <div className="mb-8 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Button>
              
              <div>
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Create New User</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Add a new user to the system
                </p>
              </div>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  Enter the details for the new user account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="Enter first name"
                          className={errors.first_name ? 'border-red-500' : ''}
                        />
                        {errors.first_name && (
                          <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Enter last name"
                          className={errors.last_name ? 'border-red-500' : ''}
                        />
                        {errors.last_name && (
                          <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Account Information</h3>
                      
                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select value={formData.role} onValueChange={(value: any) => handleInputChange('role', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="HiringManager">Hiring Manager</SelectItem>
                            <SelectItem value="Candidate">Candidate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="department">Department *</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="Enter department"
                          className={errors.department ? 'border-red-500' : ''}
                        />
                        {errors.department && (
                          <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter password"
                            className={errors.password ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0 top-0 h-full px-3"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirm_password">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirm_password}
                            onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                            placeholder="Confirm password"
                            className={errors.confirm_password ? 'border-red-500' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-0 top-0 h-full px-3"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.confirm_password && (
                          <p className="text-sm text-red-500 mt-1">{errors.confirm_password}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="status">Account Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Creating User...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
