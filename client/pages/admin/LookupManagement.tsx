import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi, lookupApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Briefcase,
  MapPin,
  User,
  Award,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface LookupItem {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Skill extends LookupItem {
  category?: string;
  is_approved?: boolean;
}

export default function LookupManagement() {
  const [activeTab, setActiveTab] = useState('job-types');
  const [jobTypes, setJobTypes] = useState<LookupItem[]>([]);
  const [jobStatuses, setJobStatuses] = useState<LookupItem[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<LookupItem[]>([]);
  const [companies, setCompanies] = useState<LookupItem[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadLookupData();
  }, [activeTab]);

  const loadLookupData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'job-types':
          const types = await lookupApi.getJobTypes();
          setJobTypes(types);
          break;
        case 'job-statuses':
          const statuses = await lookupApi.getJobStatuses();
          setJobStatuses(statuses);
          break;
        case 'experience-levels':
          const levels = await lookupApi.getExperienceLevels();
          setExperienceLevels(levels);
          break;
        case 'companies':
          const comps = await lookupApi.getCompanies();
          setCompanies(comps);
          break;
        case 'departments':
          const depts = await lookupApi.getDepartments();
          setDepartments(depts);
          break;
        case 'skills':
          const skillsData = await lookupApi.getSkills('', false);
          setSkills(skillsData.skills || []);
          break;
        case 'countries':
          // Mock countries data - in real app this would come from API
          const mockCountries: LookupItem[] = [
            { id: 1, name: 'United States', is_active: true },
            { id: 2, name: 'United Kingdom', is_active: true },
            { id: 3, name: 'Canada', is_active: true },
            { id: 4, name: 'Australia', is_active: true },
            { id: 5, name: 'Germany', is_active: true },
            { id: 6, name: 'France', is_active: true },
            { id: 7, name: 'India', is_active: true },
            { id: 8, name: 'Bangladesh', is_active: true },
          ];
          setCountries(mockCountries);
          break;
      }
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLookupData();
  };

  const handleCreate = () => {
    setEditMode('create');
    setEditItem({
      name: '',
      description: '',
      is_active: true,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditMode('edit');
    setEditItem({ ...item });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editMode === 'create') {
        switch (activeTab) {
          case 'skills':
            await lookupApi.createSkill({ name: editItem.name });
            break;
          // Add other create operations as needed
        }
      } else {
        // Update operations would go here
        console.log('Update item:', editItem);
      }
      
      setEditDialogOpen(false);
      await loadLookupData();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      // Delete operations would go here
      console.log('Delete item:', id);
      await loadLookupData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      // Toggle status operations would go here
      console.log('Toggle status:', id, isActive);
      await loadLookupData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'job-types': return jobTypes;
      case 'job-statuses': return jobStatuses;
      case 'experience-levels': return experienceLevels;
      case 'companies': return companies;
      case 'departments': return departments;
      case 'skills': return skills;
      case 'countries': return countries;
      default: return [];
    }
  };

  const getFilteredData = () => {
    const data = getCurrentData();
    if (!searchTerm) return data;
    
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'job-types': return <Briefcase className="h-4 w-4" />;
      case 'job-statuses': return <Award className="h-4 w-4" />;
      case 'experience-levels': return <User className="h-4 w-4" />;
      case 'companies': return <Database className="h-4 w-4" />;
      case 'departments': return <Database className="h-4 w-4" />;
      case 'skills': return <Award className="h-4 w-4" />;
      case 'countries': return <MapPin className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (item: any) => {
    if (item.is_approved === false) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
    if (item.is_active === false) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  };

  if (loading) {
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
                  <Database className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Lookup Management</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Manage system lookup data and configurable fields
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
                <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="job-types" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Job Types
                </TabsTrigger>
                <TabsTrigger value="job-statuses" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Job Statuses
                </TabsTrigger>
                <TabsTrigger value="experience-levels" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Experience Levels
                </TabsTrigger>
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Companies
                </TabsTrigger>
                <TabsTrigger value="departments" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Departments
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Skills
                </TabsTrigger>
                <TabsTrigger value="countries" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Countries
                </TabsTrigger>
              </TabsList>

              {/* Search and Filters */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>

              {/* Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTabIcon(activeTab)}
                    {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </CardTitle>
                  <CardDescription>
                    Manage and configure system {activeTab.replace('-', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredData().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">No items found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredData().map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(item)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Skills Tab Special Content */}
              {activeTab === 'skills' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Skills Management</CardTitle>
                    <CardDescription>
                      Review and approve user-submitted skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {skills.filter(s => !s.is_approved).map((skill) => (
                          <TableRow key={skill.id}>
                            <TableCell className="font-medium">{skill.name}</TableCell>
                            <TableCell>{skill.category || '-'}</TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Pending Approval
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {skill.created_at ? new Date(skill.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </Tabs>
          </div>
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editMode === 'create' ? 'Create New' : 'Edit'} {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </DialogTitle>
              <DialogDescription>
                {editMode === 'create' ? 'Add a new item to the system.' : 'Edit the existing item.'}
              </DialogDescription>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editItem.description || ''}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                
                {activeTab !== 'skills' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editItem.is_active}
                      onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    {editMode === 'create' ? 'Create' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
