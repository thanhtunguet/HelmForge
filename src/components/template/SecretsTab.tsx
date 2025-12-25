import { useState } from 'react';
import { useHelmStore } from '@/lib/store';
import { TemplateWithRelations, TLSSecret } from '@/types/helm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Trash2, Key, Lock, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SecretsTabProps {
  template: TemplateWithRelations;
}

export function SecretsTab({ template }: SecretsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingSecret, setEditingSecret] = useState<TLSSecret | null>(null);
  
  const addTLSSecret = useHelmStore((state) => state.addTLSSecret);
  const updateTLSSecret = useHelmStore((state) => state.updateTLSSecret);
  const deleteTLSSecret = useHelmStore((state) => state.deleteTLSSecret);

  const [formData, setFormData] = useState({ 
    name: '',
    cert: '',
    key: ''
  });

  const openNew = () => {
    setEditingSecret(null);
    setFormData({ name: '', cert: '', key: '' });
    setDialogOpen(true);
  };

  const openEdit = (secret: TLSSecret) => {
    setEditingSecret(secret);
    setFormData({
      name: secret.name,
      cert: secret.cert || '',
      key: secret.key || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Secret name is required');
      return;
    }

    if (editingSecret) {
      updateTLSSecret(editingSecret.id, {
        name: formData.name,
        cert: formData.cert || undefined,
        key: formData.key || undefined,
      });
      toast.success('TLS secret updated');
    } else {
      const secret: TLSSecret = {
        id: crypto.randomUUID(),
        templateId: template.id,
        name: formData.name,
        type: 'tls',
        cert: formData.cert || undefined,
        key: formData.key || undefined,
      };
      addTLSSecret(secret);
      toast.success('TLS secret added');
    }
    
    setDialogOpen(false);
    setFormData({ name: '', cert: '', key: '' });
    setEditingSecret(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTLSSecret(deleteId);
      toast.success('TLS secret deleted');
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Registry Secret */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Registry Secret</h3>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-mono font-medium">{template.registrySecret.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.registrySecret.server} • {template.registrySecret.username || 'No username'}
                </p>
              </div>
              <Badge variant="secondary">Registry</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TLS Secrets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">TLS Secrets</h3>
            <p className="text-sm text-muted-foreground">
              Certificates for Ingress TLS termination
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add TLS Secret
          </Button>
        </div>

        {template.tlsSecrets.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No TLS secrets defined yet</p>
              <Button variant="outline" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first TLS secret
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Private Key</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {template.tlsSecrets.map((secret) => (
                  <TableRow key={secret.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-success" />
                        <span className="font-mono font-medium">{secret.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">TLS</Badge>
                    </TableCell>
                    <TableCell>
                      {secret.cert ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {secret.key ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(secret)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(secret.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSecret ? 'Edit TLS Secret' : 'Add TLS Secret'}</DialogTitle>
            <DialogDescription>
              {editingSecret 
                ? 'Update the TLS secret configuration' 
                : 'Create a TLS secret for Ingress HTTPS termination'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Secret Name *</Label>
              <Input
                id="name"
                placeholder="wildcard-tls"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert">Certificate (tls.crt)</Label>
              <Textarea
                id="cert"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={formData.cert}
                onChange={(e) => setFormData({ ...formData, cert: e.target.value })}
                className="font-mono text-xs min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Paste the PEM-encoded certificate or leave empty to set per version
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Private Key (tls.key)</Label>
              <Textarea
                id="key"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                className="font-mono text-xs min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Paste the PEM-encoded private key or leave empty to set per version
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSecret ? 'Update' : 'Add'} TLS Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete TLS Secret</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this TLS secret? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
