import { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { FileTreeBrowser } from './FileTreeBrowser';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileCode, Play } from 'lucide-react';
import { generateRenderedManifests } from '@/lib/helm-generator';
import { TemplateWithRelations, ChartVersion } from '@/types/helm';
import { Button } from '@/components/ui/button';

interface PlaygroundViewProps {
  template: TemplateWithRelations;
  version: ChartVersion;
}

export function PlaygroundView({ template, version }: PlaygroundViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [releaseName, setReleaseName] = useState('my-release');
  const [namespace, setNamespace] = useState('default');
  const [isGenerated, setIsGenerated] = useState(false);
  const [renderedFiles, setRenderedFiles] = useState<Array<{ name: string; content: string }>>([]);

  const handleGenerate = () => {
    const files = generateRenderedManifests(template, version, releaseName, namespace);
    setRenderedFiles(files);
    setIsGenerated(true);
    
    // Auto-select first file
    if (files.length > 0) {
      setSelectedFile(files[0].name);
      setFileContent(files[0].content);
    }
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile(path);
    setFileContent(content);
  };

  const fileName = selectedFile || 'No file selected';

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="release-name">Release Name</Label>
            <Input
              id="release-name"
              value={releaseName}
              onChange={(e) => setReleaseName(e.target.value)}
              placeholder="my-release"
            />
            <p className="text-xs text-muted-foreground">
              The Helm release name (used in labels)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="namespace">Namespace</Label>
            <Input
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="default"
            />
            <p className="text-xs text-muted-foreground">
              Kubernetes namespace for deployment
            </p>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button onClick={handleGenerate} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Generate Manifests
            </Button>
            <p className="text-xs text-muted-foreground">
              Generate Kubernetes manifests
            </p>
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      {isGenerated && (
        <div className="h-[calc(100vh-22rem)]">
          <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
            {/* File Browser Panel */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col bg-card">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Rendered Manifests</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {renderedFiles.length} manifest{renderedFiles.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <FileTreeBrowser
                  files={renderedFiles}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Editor Panel */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full flex flex-col bg-card">
                {/* Editor Header */}
                <div className="px-4 py-3 border-b flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-medium">{fileName}</span>
                  {selectedFile && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {fileContent.split('\n').length} lines
                    </span>
                  )}
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  {selectedFile ? (
                    <Editor
                      height="100%"
                      language="yaml"
                      value={fileContent}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        folding: true,
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Select a file to view its content</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {!isGenerated && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
            <p className="text-sm">
              Enter a release name and namespace, then click "Generate Manifests" to see the rendered YAML files.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
