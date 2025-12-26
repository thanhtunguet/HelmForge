import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { user, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Check if user is Google authenticated
  const isGoogleAuth = user?.app_metadata?.provider === 'google' || 
    user?.identities?.some(identity => identity.provider === 'google');

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  // Validate current password (for traditional auth)
  const validateCurrentPassword = (value: string) => {
    if (!isGoogleAuth) {
      if (!value.trim()) {
        return 'Current password is required';
      }
      try {
        passwordSchema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0].message;
        }
      }
    }
    return undefined;
  };

  // Validate new password
  const validateNewPassword = (value: string) => {
    if (!value.trim()) {
      return 'New password is required';
    }
    try {
      passwordSchema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message;
      }
    }
    return undefined;
  };

  // Validate confirm password
  const validateConfirmPassword = (value: string, newPwd: string) => {
    if (!value.trim()) {
      return 'Please confirm your new password';
    }
    if (value !== newPwd) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: typeof errors = {};
    
    if (!isGoogleAuth) {
      const currentPwdError = validateCurrentPassword(currentPassword);
      if (currentPwdError) {
        newErrors.currentPassword = currentPwdError;
      }
    }
    
    const newPwdError = validateNewPassword(newPassword);
    if (newPwdError) {
      newErrors.newPassword = newPwdError;
    }
    
    const confirmPwdError = validateConfirmPassword(confirmPassword, newPassword);
    if (confirmPwdError) {
      newErrors.confirmPassword = confirmPwdError;
    }

    // If there are errors, set them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and proceed
    setErrors({});
    setLoading(true);

    try {
      // Change password
      const { error } = await changePassword(newPassword, isGoogleAuth ? undefined : currentPassword);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password changed successfully');
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes with validation
  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    if (errors.currentPassword) {
      const error = validateCurrentPassword(value);
      setErrors(prev => ({ ...prev, currentPassword: error }));
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (errors.newPassword) {
      const error = validateNewPassword(value);
      setErrors(prev => ({ ...prev, newPassword: error }));
    }
    // Also re-validate confirm password if it has been entered
    if (confirmPassword && errors.confirmPassword) {
      const error = validateConfirmPassword(confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      const error = validateConfirmPassword(value, newPassword);
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            {isGoogleAuth
              ? 'Enter your new password below.'
              : 'Enter your current password and new password below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!isGoogleAuth && (
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                  disabled={loading}
                  className={cn(errors.currentPassword && 'border-destructive')}
                  aria-invalid={!!errors.currentPassword}
                  aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                />
                {errors.currentPassword && (
                  <p id="current-password-error" className="text-sm text-destructive">
                    {errors.currentPassword}
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                disabled={loading}
                className={cn(errors.newPassword && 'border-destructive')}
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
              />
              {errors.newPassword ? (
                <p id="new-password-error" className="text-sm text-destructive">
                  {errors.newPassword}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                disabled={loading}
                className={cn(errors.confirmPassword && 'border-destructive')}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

