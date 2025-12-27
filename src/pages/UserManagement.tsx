import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  UserCog,
  UserX,
  UserCheck,
  Edit,
  Key,
  Shield,
  ShieldCheck,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  banned_until: string | null;
  is_admin?: boolean; // Computed from user_roles
}

type BanDuration = 'day' | 'week' | 'month' | 'permanent';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [disableUser, setDisableUser] = useState<UserProfile | null>(null);
  const [reactivateUser, setReactivateUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formIsAdmin, setFormIsAdmin] = useState(false);
  const [formBanDuration, setFormBanDuration] = useState<BanDuration>('week');

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error || !data || data.length === 0) {
        toast.error('Admin privileges required');
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    }
    
    checkAdminStatus();
  }, [user, navigate]);

  async function fetchUsers() {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to load users');
      console.error(profilesError);
      setLoading(false);
      return;
    }

    // Fetch admin roles
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

    // Merge admin status into profiles
    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      is_admin: adminUserIds.has(profile.id),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  }

  async function callEdgeFunction(action: string, body: unknown) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error('Not authenticated');
      return null;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/user-admin/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Edge function error:', result);
      throw new Error(result.error || result.details || 'Operation failed');
    }

    return result;
  }

  async function handleCreateUser() {
    if (!formEmail.trim() || !formPassword.trim() || !formDisplayName.trim()) {
      toast.error('All fields are required');
      return;
    }

    try {
      await callEdgeFunction('create-user', {
        email: formEmail.trim(),
        password: formPassword.trim(),
        displayName: formDisplayName.trim(),
        isAdmin: formIsAdmin,
      });

      toast.success('User created successfully');
      setIsCreateOpen(false);
      setFormEmail('');
      setFormPassword('');
      setFormDisplayName('');
      setFormIsAdmin(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
      console.error(error);
    }
  }

  async function handleEditUser() {
    if (!selectedUser || !formDisplayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      await callEdgeFunction('update-user', {
        userId: selectedUser.id,
        displayName: formDisplayName.trim(),
      });

      toast.success('User updated successfully');
      setIsEditOpen(false);
      setSelectedUser(null);
      setFormDisplayName('');
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
      console.error(error);
    }
  }

  async function handleUpdatePassword() {
    if (!selectedUser || !formPassword.trim()) {
      toast.error('Password is required');
      return;
    }

    try {
      await callEdgeFunction('update-password', {
        userId: selectedUser.id,
        password: formPassword.trim(),
      });

      toast.success('Password updated successfully');
      setIsPasswordOpen(false);
      setSelectedUser(null);
      setFormPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
      console.error(error);
    }
  }

  async function handleDisableUser() {
    if (!disableUser) return;

    try {
      await callEdgeFunction('ban-user', {
        userId: disableUser.id,
        duration: formBanDuration,
      });

      toast.success('User disabled successfully');
      setDisableUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable user');
      console.error(error);
    }
  }

  async function handleReactivateUser() {
    if (!reactivateUser) return;

    try {
      await callEdgeFunction('unban-user', {
        userId: reactivateUser.id,
      });

      toast.success('User reactivated successfully');
      setReactivateUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate user');
      console.error(error);
    }
  }

  function openEditDialog(userProfile: UserProfile) {
    setSelectedUser(userProfile);
    setFormDisplayName(userProfile.display_name || '');
    setIsEditOpen(true);
  }

  function openPasswordDialog(userProfile: UserProfile) {
    setSelectedUser(userProfile);
    setFormPassword('');
    setIsPasswordOpen(true);
  }

  function isUserBanned(userProfile: UserProfile): boolean {
    if (!userProfile.banned_until) return false;
    return new Date(userProfile.banned_until) > new Date();
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userProfile) => {
                    const banned = isUserBanned(userProfile);
                    return (
                      <TableRow key={userProfile.id}>
                        <TableCell>
                          <div className="font-medium">
                            {userProfile.display_name || 'No name'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{userProfile.email}</code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={userProfile.is_admin ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {userProfile.is_admin ? (
                              <>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                User
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={banned ? 'destructive' : 'default'}>
                            {banned ? 'Disabled' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(userProfile.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(userProfile)}
                              disabled={userProfile.id === user?.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPasswordDialog(userProfile)}
                              disabled={userProfile.id === user?.id}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            {banned ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReactivateUser(userProfile)}
                                disabled={userProfile.id === user?.id}
                              >
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDisableUser(userProfile)}
                                disabled={userProfile.id === user?.id}
                              >
                                <UserX className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user account to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="John Doe"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter a secure password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-admin"
                  checked={formIsAdmin}
                  onCheckedChange={setFormIsAdmin}
                />
                <Label htmlFor="is-admin" className="cursor-pointer">
                  Grant admin privileges
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  placeholder="John Doe"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Password Dialog */}
        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePassword}>Update Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable User Dialog */}
        <AlertDialog open={!!disableUser} onOpenChange={() => setDisableUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disable {disableUser?.display_name}? They will
                not be able to access the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="ban-duration">Ban Duration</Label>
              <Select
                value={formBanDuration}
                onValueChange={(value) => setFormBanDuration(value as BanDuration)}
              >
                <SelectTrigger id="ban-duration" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">1 Day</SelectItem>
                  <SelectItem value="week">1 Week</SelectItem>
                  <SelectItem value="month">1 Month</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableUser}>
                Disable User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reactivate User Dialog */}
        <AlertDialog open={!!reactivateUser} onOpenChange={() => setReactivateUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivate User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reactivate {reactivateUser?.display_name}? They
                will regain access to the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReactivateUser}>
                Reactivate User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
