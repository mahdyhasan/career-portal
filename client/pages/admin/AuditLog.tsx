import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Settings, 
  Eye, 
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface AuditLogEntry {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  user_email: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface PaginatedAuditLog {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, search, selectedAction, selectedUser, startDate, endDate]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLog(
        currentPage,
        itemsPerPage,
        {
          action: selectedAction || undefined,
          user_id: selectedUser ? parseInt(selectedUser) : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      );

      setLogs(response.data);
      setTotalPages(response.totalPages);
      setTotalLogs(response.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAuditLogs();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedAction('all');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'login':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'logout':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'job':
        return <Settings className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <SuperAdminLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </SuperAdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <SuperAdminLayout>
          <div className="py-8 px-4">
            <div className="container mx-auto max-w-7xl">
              {/* Page Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Track and monitor system activity and changes
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="search">Search</Label>
                      <Input
                        id="search"
                        placeholder="Search details..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="action">Action</Label>
                      <Select value={selectedAction} onValueChange={(value) => {
                        setSelectedAction(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All actions</SelectItem>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                          <SelectItem value="login">Login</SelectItem>
                          <SelectItem value="logout">Logout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="user">User ID</Label>
                      <Input
                        id="user"
                        placeholder="User ID"
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Logs Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs ({totalLogs})</CardTitle>
                  <CardDescription>
                    Recent system activities and administrative actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-2">Loading audit logs...</p>
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">No audit logs found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {new Date(log.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(log.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getEntityTypeIcon(log.entity_type)}
                                <div>
                                  <p className="font-medium">{log.entity_type}</p>
                                  {log.entity_id && (
                                    <p className="text-sm text-muted-foreground">
                                      ID: {log.entity_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.user_email}</p>
                                {log.user_id && (
                                  <p className="text-sm text-muted-foreground">
                                    ID: {log.user_id}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <p className="text-sm">{log.details}</p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.ip_address}
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
            </div>
          </div>
        </SuperAdminLayout>
    </ProtectedRoute>
  );
}
