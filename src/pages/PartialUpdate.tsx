import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHelmStore } from '@/lib/store';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { ChevronLeft, Save } from 'lucide-react';
import { PartialUpdateSelection, PartialUpdateValues, PartialUpdateRequest } from '@/types/helm';
import { EntityTreeSelector } from '@/components/template/EntityTreeSelector';
import { PartialUpdateForm } from '@/components/template/PartialUpdateForm';
import { toast } from 'sonner';

export default function PartialUpdate() {
  const { templateId, versionId } = useParams<{ templateId: string; versionId: string }>();
  const navigate = useNavigate();
  const { getTemplateWithRelations, chartVersions, createPartialUpdate } = useHelmStore();
  
  const [versionName, setVersionName] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [selection, setSelection] = useState<PartialUpdateSelection>({
    services: {},
    configMaps: {},
    secrets: {},
  });
  const [values, setValues] = useState<PartialUpdateValues>({
    imageTags: {},
    configMapValues: {},
    opaqueSecretValues: {},
    tlsSecretValues: {},
  });
  const [isCreating, setIsCreating] = useState(false);

  const template = templateId ? getTemplateWithRelations(templateId) : undefined;
  const sourceVersion = chartVersions.find(v => v.id === versionId);

  useEffect(() => {
    if (sourceVersion) {
      setAppVersion(sourceVersion.appVersion || '');
    }
  }, [sourceVersion]);

  if (!template || !sourceVersion) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Template or version not found</p>
        </div>
      </MainLayout>
    );
  }

  const handleCreate = async () => {
    if (!versionName.trim()) {
      toast.error('Version name is required');
      return;
    }

    // Check if version name already exists
    const existingVersion = template.versions.find(v => v.versionName === versionName.trim());
    if (existingVersion) {
      toast.error('Version name already exists');
      return;
    }

    // Validate that at least one entity is selected
    const hasSelectedServices = Object.values(selection.services).some(Boolean);
    const hasSelectedConfigMaps = Object.values(selection.configMaps).some(configMap => 
      Object.values(configMap).some(Boolean)
    );
    const hasSelectedSecrets = Object.values(selection.secrets).some(secret => 
      Object.values(secret).some(Boolean)
    );

    if (!hasSelectedServices && !hasSelectedConfigMaps && !hasSelectedSecrets) {
      toast.error('Please select at least one entity to update');
      return;
    }

    const request: PartialUpdateRequest = {
      sourceVersionId: sourceVersion.id,
      selection,
      values,
      newVersionName: versionName.trim(),
      appVersion: appVersion.trim() || undefined,
      releaseNotes: releaseNotes.trim() || undefined,
    };

    setIsCreating(true);
    try {
      await createPartialUpdate(request);
      navigate(`/templates/${templateId}/versions/${request.sourceVersionId}`);
    } catch (error) {
      console.error('Failed to create partial update:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/templates/${templateId}/versions/${versionId}`)}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Partial Update</h1>
            <p className="text-muted-foreground">
              Create a new version with selective updates from {sourceVersion.versionName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entity Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Entities to Update</CardTitle>
              <CardDescription>
                Choose which services, config maps, and secrets to update
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntityTreeSelector
                template={template}
                sourceVersion={sourceVersion}
                selection={selection}
                onSelectionChange={setSelection}
              />
            </CardContent>
          </Card>

          {/* Values Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configure Values</CardTitle>
              <CardDescription>
                Set new values for selected entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartialUpdateForm
                template={template}
                sourceVersion={sourceVersion}
                selection={selection}
                values={values}
                onValuesChange={setValues}
              />
            </CardContent>
          </Card>
        </div>

        {/* Version Info & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Version Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="versionName">Version Name *</Label>
                <Input
                  id="versionName"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g., v2.1.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appVersion">App Version</Label>
                <Input
                  id="appVersion"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="e.g., 2.1.1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="releaseNotes">Release Notes</Label>
              <p className="text-sm text-muted-foreground">
                Describe the changes in this partial update. Supports Markdown.
              </p>
              <MarkdownEditor
                value={releaseNotes}
                onChange={(val) => setReleaseNotes(val)}
                height="400px"
                placeholder="## What's New

- Feature 1
- Feature 2

## Bug Fixes

- Fix 1
- Fix 2

## Changes

- Change 1
- Change 2
"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={isCreating}>
                <Save className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Version'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}