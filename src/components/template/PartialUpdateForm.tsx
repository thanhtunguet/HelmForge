import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateWithRelations, ChartVersion, PartialUpdateSelection, PartialUpdateValues } from '@/types/helm';
import { Server, FileText, Key, Lock } from 'lucide-react';

interface PartialUpdateFormProps {
  template: TemplateWithRelations;
  sourceVersion: ChartVersion;
  selection: PartialUpdateSelection;
  values: PartialUpdateValues;
  onValuesChange: (values: PartialUpdateValues) => void;
}

export function PartialUpdateForm({ 
  template, 
  sourceVersion, 
  selection, 
  values, 
  onValuesChange 
}: PartialUpdateFormProps) {
  
  const handleImageTagChange = (serviceId: string, value: string) => {
    onValuesChange({
      ...values,
      imageTags: {
        ...values.imageTags,
        [serviceId]: value,
      },
    });
  };

  const handleConfigMapValueChange = (configMapId: string, keyName: string, value: string) => {
    onValuesChange({
      ...values,
      configMapValues: {
        ...values.configMapValues,
        [configMapId]: {
          ...values.configMapValues[configMapId],
          [keyName]: value,
        },
      },
    });
  };

  const handleOpaqueSecretValueChange = (secretId: string, keyName: string, value: string) => {
    onValuesChange({
      ...values,
      opaqueSecretValues: {
        ...values.opaqueSecretValues,
        [secretId]: {
          ...values.opaqueSecretValues[secretId],
          [keyName]: value,
        },
      },
    });
  };

  const handleTLSSecretValueChange = (secretId: string, field: 'crt' | 'key', value: string) => {
    onValuesChange({
      ...values,
      tlsSecretValues: {
        ...values.tlsSecretValues,
        [secretId]: {
          ...values.tlsSecretValues[secretId],
          [field]: value,
        },
      },
    });
  };

  // Get current value from source version or default
  const getCurrentImageTag = (serviceId: string) => {
    return values.imageTags[serviceId] || sourceVersion.values.imageTags?.[serviceId] || '';
  };

  const getCurrentConfigMapValue = (configMapId: string, keyName: string) => {
    return values.configMapValues[configMapId]?.[keyName] || 
           sourceVersion.values.configMapValues?.[configMapId]?.[keyName] || '';
  };

  const getCurrentOpaqueSecretValue = (secretId: string, keyName: string) => {
    return values.opaqueSecretValues[secretId]?.[keyName] || 
           sourceVersion.values.opaqueSecretValues?.[secretId]?.[keyName] || '';
  };

  const getCurrentTLSSecretValue = (secretId: string, field: 'crt' | 'key') => {
    return values.tlsSecretValues[secretId]?.[field] || 
           sourceVersion.values.tlsSecretValues?.[secretId]?.[field] || '';
  };

  const selectedServices = template.services.filter(service => selection.services[service.id]);
  const selectedConfigMaps = template.configMaps.filter(configMap => 
    selection.configMaps[configMap.id] && Object.keys(selection.configMaps[configMap.id]).length > 0
  );
  const selectedTLSSecrets = template.tlsSecrets.filter(secret => 
    selection.secrets[secret.id] && Object.keys(selection.secrets[secret.id]).length > 0
  );
  const selectedOpaqueSecrets = template.opaqueSecrets.filter(secret => 
    selection.secrets[secret.id] && Object.keys(selection.secrets[secret.id]).length > 0
  );

  if (selectedServices.length === 0 && selectedConfigMaps.length === 0 && 
      selectedTLSSecrets.length === 0 && selectedOpaqueSecrets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select entities from the tree to configure their values</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {/* Services Image Tags */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4" />
              Service Image Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedServices.map(service => (
              <div key={service.id} className="space-y-2">
                <Label htmlFor={`service-${service.id}`} className="text-xs font-medium">
                  {service.name}
                </Label>
                <Input
                  id={`service-${service.id}`}
                  value={getCurrentImageTag(service.id)}
                  onChange={(e) => handleImageTagChange(service.id, e.target.value)}
                  placeholder="e.g., myapp:v2.1.1"
                  className="text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ConfigMap Values */}
      {selectedConfigMaps.map(configMap => (
        <Card key={configMap.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {configMap.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(selection.configMaps[configMap.id] || {}).map(([keyName, isSelected]) => 
              isSelected ? (
                <div key={keyName} className="space-y-2">
                  <Label htmlFor={`configmap-${configMap.id}-${keyName}`} className="text-xs font-medium">
                    {keyName}
                  </Label>
                  <Input
                    id={`configmap-${configMap.id}-${keyName}`}
                    value={getCurrentConfigMapValue(configMap.id, keyName)}
                    onChange={(e) => handleConfigMapValueChange(configMap.id, keyName, e.target.value)}
                    placeholder={`Enter value for ${keyName}`}
                    className="text-sm"
                  />
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      ))}

      {/* TLS Secret Values */}
      {selectedTLSSecrets.map(secret => (
        <Card key={secret.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {secret.name} (TLS)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(selection.secrets[secret.id] || {}).map(([keyName, isSelected]) => 
              isSelected ? (
                <div key={keyName} className="space-y-2">
                  <Label htmlFor={`tls-${secret.id}-${keyName}`} className="text-xs font-medium">
                    {keyName}
                  </Label>
                  <Textarea
                    id={`tls-${secret.id}-${keyName}`}
                    value={getCurrentTLSSecretValue(secret.id, keyName as 'crt' | 'key')}
                    onChange={(e) => handleTLSSecretValueChange(secret.id, keyName as 'crt' | 'key', e.target.value)}
                    placeholder={`Enter ${keyName === 'tls.crt' ? 'certificate' : 'private key'} content`}
                    rows={4}
                    className="text-sm font-mono"
                  />
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      ))}

      {/* Opaque Secret Values */}
      {selectedOpaqueSecrets.map(secret => (
        <Card key={secret.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4" />
              {secret.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(selection.secrets[secret.id] || {}).map(([keyName, isSelected]) => 
              isSelected ? (
                <div key={keyName} className="space-y-2">
                  <Label htmlFor={`opaque-${secret.id}-${keyName}`} className="text-xs font-medium">
                    {keyName}
                  </Label>
                  <Input
                    id={`opaque-${secret.id}-${keyName}`}
                    type="password"
                    value={getCurrentOpaqueSecretValue(secret.id, keyName)}
                    onChange={(e) => handleOpaqueSecretValueChange(secret.id, keyName, e.target.value)}
                    placeholder={`Enter value for ${keyName}`}
                    className="text-sm"
                  />
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}