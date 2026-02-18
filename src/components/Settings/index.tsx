import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Settings: React.FC = () => {
  const { openaiKey, anthropicKey, loading, saveKeys } = useApiKeys();

  const [openai, setOpenai] = useState('');
  const [anthropic, setAnthropic] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOpenai(openaiKey);
    setAnthropic(anthropicKey);
  }, [openaiKey, anthropicKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKeys(openai.trim(), anthropic.trim());
      toast('Settings saved', { description: 'Your API keys have been updated.' });
    } catch (err) {
      toast('Error saving settings', {
        description: err instanceof Error ? err.message : 'Please try again.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' },
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

  const hasChanges = openai.trim() !== openaiKey || anthropic.trim() !== anthropicKey;

  return (
    <div className="max-w-xl mx-auto animate-in fade-in-0 duration-300">
      <div className="mb-6">
        <h1 className="text-xl font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your API keys. Keys are stored securely in your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys</CardTitle>
          <CardDescription>
            Enter your API keys to use AI models. At least one key is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showOpenai ? 'text' : 'password'}
                value={openai}
                onChange={(e) => setOpenai(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
