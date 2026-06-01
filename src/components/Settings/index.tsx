import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';

export const Settings: React.FC = () => {
  const { anthropicKey, loading, saveKeys } = useApiKeys();

  const [anthropic, setAnthropic] = useState('');
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnthropic(anthropicKey);
  }, [anthropicKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKeys(anthropic.trim());
      toast('Settings saved', { description: 'Your API keys have been updated.' });
    } catch (err) {
      toast.error('Error saving settings', {
        description: err instanceof Error ? err.message : 'Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-muted-foreground text-sm">
        Loading settings...
      </div>
    );
  }

  const hasChanges = anthropic.trim() !== anthropicKey;

  return (
    <div className="max-w-xl mx-auto animate-in fade-in-0 duration-300">
      <PageHeader
        index="CFG"
        title="Settings"
        description="Manage your API keys. Keys are stored securely in your account."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys</CardTitle>
          <CardDescription>
            Enter your Anthropic API key to use AI models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <div className="relative">
              <Input
                id="anthropic-key"
                type={showAnthropic ? 'text' : 'password'}
                value={anthropic}
                onChange={(e) => setAnthropic(e.target.value)}
                placeholder="sk-ant-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                aria-label={showAnthropic ? 'Hide Anthropic API key' : 'Show Anthropic API key'}
                title={showAnthropic ? 'Hide key' : 'Show key'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;
