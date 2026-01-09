import { useState } from 'react';
import { useHelmStore } from '@/lib/store';
import { TemplateWithRelations } from '@/types/helm';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ReadmeTabProps {
  template: TemplateWithRelations;
}

export function ReadmeTab({ template }: ReadmeTabProps) {
  const updateTemplate = useHelmStore((state) => state.updateTemplate);
  const [readme, setReadme] = useState(template.readme || '');
  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = readme !== (template.readme || '');
  const chartStructureSnippet = buildChartStructureSnippet(template);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTemplate(template.id, { readme });
      toast.success('README saved successfully');
    } catch (error) {
      toast.error('Failed to save README');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertChartStructure = () => {
    if (!readme.trim()) {
      setReadme(`${chartStructureSnippet}\n`);
      return;
    }

    const separator = readme.endsWith('\n') ? '\n' : '\n\n';
    setReadme(`${readme}${separator}${chartStructureSnippet}\n`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">README</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleInsertChartStructure}>
            Chart Structure
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Write documentation for your Helm chart template. Supports GitHub Flavored Markdown.
      </p>
      <MarkdownEditor
        value={readme}
        onChange={setReadme}
        height="500px"
        placeholder="# My Helm Chart

Describe your chart here...

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+

## Installation

```bash
helm install my-release ./my-chart
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
"
      />
    </div>
  );
}

type ChartStructureNode = {
  label: string;
  children?: ChartStructureNode[];
};

function buildTreeLines(rootLabel: string, nodes: ChartStructureNode[]): string[] {
  const lines = [rootLabel];

  const walk = (items: ChartStructureNode[], prefix: string) => {
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${item.label}`);

      if (item.children && item.children.length > 0) {
        const nextPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
        walk(item.children, nextPrefix);
      }
    });
  };

  walk(nodes, '');
  return lines;
}

function buildChartStructureSnippet(template: TemplateWithRelations): string {
  const configMapNodes: ChartStructureNode[] = template.configMaps.length
    ? template.configMaps.map((configMap) => ({
        label: configMap.name,
        children: configMap.keys.length
          ? configMap.keys.map((key) => ({ label: key.name }))
          : [{ label: '(no keys)' }],
      }))
    : [{ label: '(none)' }];

  const registryNode: ChartStructureNode[] = template.registrySecret?.name
    ? [{ label: template.registrySecret.name }]
    : [{ label: '(none)' }];

  const tlsSecretNodes: ChartStructureNode[] = template.tlsSecrets.length
    ? template.tlsSecrets.map((secret) => ({ label: secret.name }))
    : [{ label: '(none)' }];

  const opaqueSecretNodes: ChartStructureNode[] = template.opaqueSecrets.length
    ? template.opaqueSecrets.map((secret) => ({
        label: secret.name,
        children: secret.keys.length
          ? secret.keys.map((key) => ({ label: key.name }))
          : [{ label: '(no keys)' }],
      }))
    : [{ label: '(none)' }];

  const secretNodes: ChartStructureNode[] = [
    { label: 'Registry', children: registryNode },
    { label: 'TLS', children: tlsSecretNodes },
    { label: 'Opaque', children: opaqueSecretNodes },
  ];

  const deploymentNodes: ChartStructureNode[] = template.services.length
    ? template.services.map((service) => {
        const detailNodes: ChartStructureNode[] = [];

        if (service.routes.length) {
          detailNodes.push({
            label: 'Routes',
            children: service.routes.map((route) => ({ label: route.path })),
          });
        }

        if (service.envVars.length) {
          detailNodes.push({
            label: 'Env Vars',
            children: service.envVars.map((envVar) => ({ label: envVar.name })),
          });
        }

        if (service.configMapEnvSources.length) {
          detailNodes.push({
            label: 'ConfigMap Env Sources',
            children: service.configMapEnvSources.map((source) => ({
              label: source.configMapName,
            })),
          });
        }

        if (service.secretEnvSources.length) {
          detailNodes.push({
            label: 'Secret Env Sources',
            children: service.secretEnvSources.map((source) => ({
              label: source.secretName,
            })),
          });
        }

        const portNodes = service.useCustomPorts && service.customPorts.length
          ? service.customPorts.map((port) => ({
              label: `${port.name}: ${port.port}`,
            }))
          : [{ label: `http: ${template.sharedPort}` }];

        detailNodes.push({ label: 'Ports', children: portNodes });

        if (!detailNodes.length) {
          detailNodes.push({ label: '(no details)' });
        }

        return {
          label: service.name,
          children: detailNodes,
        };
      })
    : [{ label: '(none)' }];

  const ingressNodes: ChartStructureNode[] = template.ingresses.length
    ? template.ingresses.map((ingress) => {
        const hostNodes: ChartStructureNode[] = ingress.hosts.length
          ? ingress.hosts.map((host) => ({
              label: host.hostname,
              children: host.paths.length
                ? host.paths.map((path) => ({
                    label: `${path.path} -> ${path.serviceName}`,
                  }))
                : [{ label: '(no paths)' }],
            }))
          : [{ label: '(none)' }];

        const tlsNodes: ChartStructureNode[] = ingress.tls.length
          ? ingress.tls.map((tls) => ({
              label: tls.secretName,
              children: tls.hosts.length
                ? tls.hosts.map((host) => ({ label: host }))
                : [{ label: '(no hosts)' }],
            }))
          : [{ label: '(none)' }];

        return {
          label: ingress.name,
          children: [
            { label: 'Hosts', children: hostNodes },
            { label: 'TLS', children: tlsNodes },
          ],
        };
      })
    : [{ label: '(none)' }];

  const treeLines = buildTreeLines('charts/', [
    { label: 'ConfigMaps', children: configMapNodes },
    { label: 'Secrets', children: secretNodes },
    { label: 'Deployments', children: deploymentNodes },
    { label: 'Ingresses', children: ingressNodes },
  ]);

  return `## Chart Structure

\`\`\`text
${treeLines.join('\n')}
\`\`\`
`;
}
