import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import SuperAdminNav from '@/components/admin/SuperAdminNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { adminApi } from '@/services/api';
import { User } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserCheck, 
  UserX,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const { toast } = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [currentPage, search, selectedRole, selectedStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers(
        currentPage,
        itemsPerPage,
        search,
        selectedRole ? parseInt(selectedRole) : undefined,
        selectedStatus ? selectedStatus === 'active' : selectedStatus === 'inactive' ? false : undefined
      );

      setUsers(response.data);
      setTotalPages(response.totalPages);
      setTotalUsers(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      // For now, hardcode roles since we don't have a roles endpoint
      setRoles([
        { id: 1, name: 'SuperAdmin', description: 'Super Administrator' },
        { id: 2, name: 'HiringManager', description: 'Hiring Manager' },
        { id: 3, name: 'Candidate', description: 'Job Candidate' }
      ]);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, isActive);
      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: number, roleId: number) => {
    try {
      await adminApi.updateUserRole(userId, roleId);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'SuperAdmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HiringManager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Candidate':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  if (loading && users.length === 0) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <div className="flex">
          <SuperAdminNav />
          <div className="flex-1">
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <div className="flex">
        <SuperAdminNav />
        <div className="flex-1">
          <div className="py-8 px-4">
            <div className="container mx-auto max-w-7xl">
              {/* Page Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Manage system users, roles, and permissions
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="search">Search Users</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search by name, email..."
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={selectedRole} onValueChange={(value) => {
                        setSelectedRole(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All roles</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={selectedStatus} onValueChange={(value) => {
                        setSelectedStatus(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="text-sm text-muted-foreground">
                        {totalUsers} users found
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Users ({totalUsers})</CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">Loading users...</p>
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">No users found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.phone && (
                                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(user.role?.name || '')}>
                                {user.role?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  user.is_active ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.is_active ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserStatus(user.id, false)}
                                      className="text-red-600"
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateUserStatus(user.id, true)}
                                      className="text-green-600"
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newRole = user.role?.name === 'SuperAdmin' ? 2 : 1;
                                      handleUpdateUserRole(user.id, newRole);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Change Role
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Details Dialog */}
              <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                      Complete information about selected user
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <p className="font-medium">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Badge className={getRoleColor(selectedUser.role?.name || '')}>
                          {selectedUser.role?.name || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedUser.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={selectedUser.is_active ? 'text-green-600' : 'text-red-600'}>
                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label>Joined</Label>
                        <p className="font-medium">
                          {new Date(selectedUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedUser.updated_at && (
                        <div>
                          <Label>Last Updated</Label>
                          <p className="font-medium">
                            {new Date(selectedUser.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
