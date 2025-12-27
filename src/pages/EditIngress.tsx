import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHelmStore } from '@/lib/store';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Lock, Network } from 'lucide-react';
import { toast } from 'sonner';
import { Ingress, IngressRule } from '@/types/helm';

export default function EditIngress() {
  const { templateId, ingressId } = useParams();
  const navigate = useNavigate();
  const ingresses = useHelmStore((state) => state.ingresses);
  const templates = useHelmStore((state) => state.templates);
  const services = useHelmStore((state) => state.services);
  const tlsSecrets = useHelmStore((state) => state.tlsSecrets);
  const updateIngress = useHelmStore((state) => state.updateIngress);
  
  const ingress = ingresses.find((i) => i.id === ingressId && i.templateId === templateId);
  const template = templates.find((t) => t.id === templateId);
  
  // Get services for this template
  const templateServices = services.filter((s) => s.templateId === templateId);
  
  // Compute all routes from all services
  const allRoutes: IngressRule[] = templateServices.flatMap(service =>
    service.routes.map(route => ({
      path: route.path,
      serviceName: service.name,
    }))
  );
  
  const [formData, setFormData] = useState({
    name: '',
    mode: 'nginx-gateway' as 'nginx-gateway' | 'direct-services',
    defaultHost: '',
    tlsEnabled: false,
    tlsSecretName: '',
    rules: [] as IngressRule[],
    useAllRoutes: false,
  });

  const [ruleForm, setRuleForm] = useState({ 
    serviceName: '', 
    selectedRoute: '', 
    customPath: '' 
  });

  useEffect(() => {
    if (ingress && template) {
      // Check if current rules match all routes to set useAllRoutes toggle
      const allRoutesSet = new Set(allRoutes.map(r => `${r.path}:${r.serviceName}`));
      const currentRulesSet = new Set(ingress.rules.map(r => `${r.path}:${r.serviceName}`));
      const isUsingAllRoutes = allRoutes.length > 0 && 
        allRoutes.every(r => currentRulesSet.has(`${r.path}:${r.serviceName}`)) &&
        ingress.rules.length === allRoutes.length;

      setFormData({
        name: ingress.name,
        mode: ingress.mode,
        defaultHost: ingress.defaultHost || '',
        tlsEnabled: ingress.tlsEnabled,
        tlsSecretName: ingress.tlsSecretName || '',
        rules: [...ingress.rules],
        useAllRoutes: isUsingAllRoutes,
      });
    }
  }, [ingress, template, allRoutes]);

  if (!ingress || !template) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold">Ingress not found</h2>
          <p className="text-muted-foreground mb-4">
            The requested Ingress does not exist.
          </p>
          <Button variant="outline" onClick={() => navigate(`/templates/${templateId}?tab=ingresses`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Template
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleUseAllRoutesChange = (checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        useAllRoutes: true,
        rules: [...allRoutes],
      });
    } else {
      setFormData({
        ...formData,
        useAllRoutes: false,
        rules: [],
      });
    }
  };

  const selectedService = templateServices.find(s => s.name === ruleForm.serviceName);
  const isCustomRoute = ruleForm.selectedRoute === '__custom__';

  const addRule = () => {
    if (!ruleForm.serviceName) {
      toast.error('Service is required');
      return;
    }
    
    const path = isCustomRoute ? ruleForm.customPath : ruleForm.selectedRoute;
    if (!path) {
      toast.error('Route path is required');
      return;
    }

    setFormData({
      ...formData,
      rules: [
        ...formData.rules,
        {
          path: path.startsWith('/') ? path : `/${path}`,
          serviceName: ruleForm.serviceName,
        },
      ],
    });
    setRuleForm({ serviceName: '', selectedRoute: '', customPath: '' });
  };

  const removeRule = (index: number) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Ingress name is required');
      return;
    }

    const { useAllRoutes, ...ingressData } = formData;

    try {
      await updateIngress(ingress.id, ingressData);
      toast.success('Ingress updated');
      navigate(`/templates/${templateId}?tab=ingresses`);
    } catch (error) {
      // Error is already handled in the store
    }
  };

  // Get TLS secrets for this template
  const templateTlsSecrets = tlsSecrets.filter((s) => s.templateId === templateId);

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 -ml-4"
            onClick={() => navigate(`/templates/${templateId}?tab=ingresses`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Template
          </Button>
          
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Ingress</h1>
              <p className="mt-1 text-muted-foreground">
                Configure ingress rules for external traffic
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ingress Details</CardTitle>
            <CardDescription>
              Configure ingress rules for external traffic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Ingress Name *</Label>
                <Input
                  id="name"
                  placeholder="main-ingress"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Routing Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value: 'nginx-gateway' | 'direct-services') =>
                    setFormData({ ...formData, mode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nginx-gateway">Via Nginx Gateway</SelectItem>
                    <SelectItem value="direct-services">Direct to Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultHost">Default Host (optional)</Label>
              <Input
                id="defaultHost"
                placeholder="app.example.com"
                value={formData.defaultHost}
                onChange={(e) =>
                  setFormData({ ...formData, defaultHost: e.target.value })
                }
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Actual hosts are assigned when creating chart versions
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">TLS Configuration</p>
                  <p className="text-xs text-muted-foreground">Enable HTTPS</p>
                </div>
                <Switch
                  checked={formData.tlsEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, tlsEnabled: checked })
                  }
                />
              </div>
              {formData.tlsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="tlsSecretName">TLS Secret</Label>
                  <Select
                    value={formData.tlsSecretName}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tlsSecretName: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select TLS secret" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTlsSecrets.map((secret) => (
                        <SelectItem key={secret.id} value={secret.name}>
                          {secret.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Routing Rules</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="useAllRoutes" className="text-sm font-normal text-muted-foreground">
                    Use all routes
                  </Label>
                  <Switch
                    id="useAllRoutes"
                    checked={formData.useAllRoutes}
                    onCheckedChange={handleUseAllRoutesChange}
                    disabled={allRoutes.length === 0}
                  />
                </div>
              </div>
              
              {formData.useAllRoutes ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    All {allRoutes.length} route(s) from all services will be included:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allRoutes.map((rule, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">
                        {rule.path} → {rule.serviceName}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select
                        value={ruleForm.serviceName}
                        onValueChange={(value) =>
                          setRuleForm({ ...ruleForm, serviceName: value, selectedRoute: '', customPath: '' })
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select Service" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateServices.map((svc) => (
                            <SelectItem key={svc.id} value={svc.name}>
                              {svc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={ruleForm.selectedRoute}
                        onValueChange={(value) =>
                          setRuleForm({ ...ruleForm, selectedRoute: value, customPath: '' })
                        }
                        disabled={!ruleForm.serviceName}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select Route" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedService?.routes.map((route, idx) => (
                            <SelectItem key={idx} value={route.path}>
                              {route.path}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">Custom Route...</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="secondary" onClick={addRule} disabled={!ruleForm.serviceName}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {isCustomRoute && (
                      <Input
                        placeholder="/custom-path"
                        value={ruleForm.customPath}
                        onChange={(e) => setRuleForm({ ...ruleForm, customPath: e.target.value })}
                        className="font-mono"
                      />
                    )}
                  </div>
                  {formData.rules.length > 0 && (
                    <div className="space-y-2">
                      {formData.rules.map((rule, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                        >
                          <span className="font-mono text-sm">
                            {rule.path} → {rule.serviceName}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeRule(i)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/templates/${templateId}?tab=ingresses`)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Update Ingress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

