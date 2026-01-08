import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Server, FileText, Key, Lock } from 'lucide-react';
import { TemplateWithRelations, ChartVersion, PartialUpdateSelection } from '@/types/helm';
import { useState } from 'react';

interface EntityTreeSelectorProps {
  template: TemplateWithRelations;
  sourceVersion: ChartVersion;
  selection: PartialUpdateSelection;
  onSelectionChange: (selection: PartialUpdateSelection) => void;
}

export function EntityTreeSelector({ 
  template, 
  sourceVersion, 
  selection, 
  onSelectionChange 
}: EntityTreeSelectorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    services: true,
    configMaps: true,
    secrets: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    onSelectionChange({
      ...selection,
      services: {
        ...selection.services,
        [serviceId]: checked,
      },
    });
  };

  const handleConfigMapToggle = (configMapId: string, checked: boolean) => {
    const newConfigMaps = { ...selection.configMaps };
    if (checked) {
      // Select all keys when configmap is selected
      const configMap = template.configMaps.find(cm => cm.id === configMapId);
      if (configMap) {
        newConfigMaps[configMapId] = {};
        configMap.keys.forEach(key => {
          newConfigMaps[configMapId][key.name] = true;
        });
      }
    } else {
      // Deselect all keys when configmap is deselected
      delete newConfigMaps[configMapId];
    }
    onSelectionChange({
      ...selection,
      configMaps: newConfigMaps,
    });
  };

  const handleConfigMapKeyToggle = (configMapId: string, keyName: string, checked: boolean) => {
    const newConfigMaps = { ...selection.configMaps };
    if (!newConfigMaps[configMapId]) {
      newConfigMaps[configMapId] = {};
    }
    newConfigMaps[configMapId][keyName] = checked;
    
    // Remove the configmap entry if no keys are selected
    if (!Object.values(newConfigMaps[configMapId]).some(Boolean)) {
      delete newConfigMaps[configMapId];
    }
    
    onSelectionChange({
      ...selection,
      configMaps: newConfigMaps,
    });
  };

  const handleSecretToggle = (secretId: string, checked: boolean, isOpaque: boolean) => {
    const newSecrets = { ...selection.secrets };
    if (checked) {
      if (isOpaque) {
        // Select all keys for opaque secrets
        const secret = template.opaqueSecrets.find(s => s.id === secretId);
        if (secret) {
          newSecrets[secretId] = {};
          secret.keys.forEach(key => {
            newSecrets[secretId][key.name] = true;
          });
        }
      } else {
        // TLS secrets have fixed keys
        newSecrets[secretId] = {
          'tls.crt': true,
          'tls.key': true,
        };
      }
    } else {
      delete newSecrets[secretId];
    }
    onSelectionChange({
      ...selection,
      secrets: newSecrets,
    });
  };

  const handleSecretKeyToggle = (secretId: string, keyName: string, checked: boolean) => {
    const newSecrets = { ...selection.secrets };
    if (!newSecrets[secretId]) {
      newSecrets[secretId] = {};
    }
    newSecrets[secretId][keyName] = checked;
    
    if (!Object.values(newSecrets[secretId]).some(Boolean)) {
      delete newSecrets[secretId];
    }
    
    onSelectionChange({
      ...selection,
      secrets: newSecrets,
    });
  };

  // Check if configmap is fully selected
  const isConfigMapSelected = (configMapId: string) => {
    const configMap = template.configMaps.find(cm => cm.id === configMapId);
    if (!configMap || !selection.configMaps[configMapId]) return false;
    return configMap.keys.every(key => selection.configMaps[configMapId][key.name]);
  };

  // Check if secret is fully selected
  const isSecretSelected = (secretId: string) => {
    const opaqueSecret = template.opaqueSecrets.find(s => s.id === secretId);
    const tlsSecret = template.tlsSecrets.find(s => s.id === secretId);
    
    if (!selection.secrets[secretId]) return false;
    
    if (opaqueSecret) {
      return opaqueSecret.keys.every(key => selection.secrets[secretId][key.name]);
    } else if (tlsSecret) {
      return selection.secrets[secretId]['tls.crt'] && selection.secrets[secretId]['tls.key'];
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Services Section */}
      <Collapsible open={expandedSections.services} onOpenChange={() => toggleSection('services')}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          {expandedSections.services ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Server className="h-4 w-4" />
          <span className="font-medium">Services ({template.services.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {template.services.map(service => (
            <div key={service.id} className="flex items-center gap-2 pl-6">
              <Checkbox
                id={`service-${service.id}`}
                checked={selection.services[service.id] || false}
                onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
              />
              <label htmlFor={`service-${service.id}`} className="text-sm">
                {service.name}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* ConfigMaps Section */}
      <Collapsible open={expandedSections.configMaps} onOpenChange={() => toggleSection('configMaps')}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          {expandedSections.configMaps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <FileText className="h-4 w-4" />
          <span className="font-medium">ConfigMaps ({template.configMaps.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">
          {template.configMaps.map(configMap => (
            <div key={configMap.id} className="pl-6">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`configmap-${configMap.id}`}
                  checked={isConfigMapSelected(configMap.id)}
                  onCheckedChange={(checked) => handleConfigMapToggle(configMap.id, checked as boolean)}
                />
                <label htmlFor={`configmap-${configMap.id}`} className="text-sm font-medium">
                  {configMap.name}
                </label>
              </div>
              <div className="space-y-1 pl-6">
                {configMap.keys.map(key => (
                  <div key={key.name} className="flex items-center gap-2">
                    <Checkbox
                      id={`configmap-${configMap.id}-${key.name}`}
                      checked={selection.configMaps[configMap.id]?.[key.name] || false}
                      onCheckedChange={(checked) => handleConfigMapKeyToggle(configMap.id, key.name, checked as boolean)}
                    />
                    <label htmlFor={`configmap-${configMap.id}-${key.name}`} className="text-xs text-muted-foreground">
                      {key.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Secrets Section */}
      <Collapsible open={expandedSections.secrets} onOpenChange={() => toggleSection('secrets')}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          {expandedSections.secrets ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Key className="h-4 w-4" />
          <span className="font-medium">Secrets ({template.tlsSecrets.length + template.opaqueSecrets.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">
          {/* TLS Secrets */}
          {template.tlsSecrets.map(secret => (
            <div key={secret.id} className="pl-6">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`tls-secret-${secret.id}`}
                  checked={isSecretSelected(secret.id)}
                  onCheckedChange={(checked) => handleSecretToggle(secret.id, checked as boolean, false)}
                />
                <Lock className="h-3 w-3" />
                <label htmlFor={`tls-secret-${secret.id}`} className="text-sm font-medium">
                  {secret.name} (TLS)
                </label>
              </div>
              <div className="space-y-1 pl-6">
                {['tls.crt', 'tls.key'].map(keyName => (
                  <div key={keyName} className="flex items-center gap-2">
                    <Checkbox
                      id={`tls-secret-${secret.id}-${keyName}`}
                      checked={selection.secrets[secret.id]?.[keyName] || false}
                      onCheckedChange={(checked) => handleSecretKeyToggle(secret.id, keyName, checked as boolean)}
                    />
                    <label htmlFor={`tls-secret-${secret.id}-${keyName}`} className="text-xs text-muted-foreground">
                      {keyName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Opaque Secrets */}
          {template.opaqueSecrets.map(secret => (
            <div key={secret.id} className="pl-6">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`opaque-secret-${secret.id}`}
                  checked={isSecretSelected(secret.id)}
                  onCheckedChange={(checked) => handleSecretToggle(secret.id, checked as boolean, true)}
                />
                <Key className="h-3 w-3" />
                <label htmlFor={`opaque-secret-${secret.id}`} className="text-sm font-medium">
                  {secret.name} (Opaque)
                </label>
              </div>
              <div className="space-y-1 pl-6">
                {secret.keys.map(key => (
                  <div key={key.name} className="flex items-center gap-2">
                    <Checkbox
                      id={`opaque-secret-${secret.id}-${key.name}`}
                      checked={selection.secrets[secret.id]?.[key.name] || false}
                      onCheckedChange={(checked) => handleSecretKeyToggle(secret.id, key.name, checked as boolean)}
                    />
                    <label htmlFor={`opaque-secret-${secret.id}-${key.name}`} className="text-xs text-muted-foreground">
                      {key.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}