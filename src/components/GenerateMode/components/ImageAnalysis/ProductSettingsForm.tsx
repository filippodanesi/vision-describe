import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { ProductSettings } from '../../types';
import { AVAILABLE_LANGUAGES, CERTIFICATION_OPTIONS } from '../../types';

interface ProductSettingsFormProps {
  settings: ProductSettings;
  onSettingsChange: (settings: ProductSettings) => void;
  onNext: () => void;
}

export const ProductSettingsForm: React.FC<ProductSettingsFormProps> = ({
  settings,
  onSettingsChange,
  onNext,
}) => {
  const toggleCertification = (cert: string) => {
    const current = settings.certifications
      ? settings.certifications.split(', ').filter(Boolean)
      : [];
    const updated = current.includes(cert)
      ? current.filter(c => c !== cert)
      : [...current, cert];
    onSettingsChange({ ...settings, certifications: updated.join(', ') });
  };

  const selectedCerts = settings.certifications
    ? settings.certifications.split(', ').filter(Boolean)
    : [];

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Product Settings</CardTitle>
        <CardDescription>Configure the language, category, and certifications for the description</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Target Language</Label>
          <Select
            value={settings.language}
            onValueChange={(v) => onSettingsChange({ ...settings, language: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product Category</Label>
          <Input
            placeholder="e.g., wired bra, nightdress, bikini top"
            value={settings.category}
            onChange={(e) => onSettingsChange({ ...settings, category: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            The exact product type — used as the grammatical starting point
          </p>
        </div>

        <div className="space-y-2">
          <Label>Certifications (optional)</Label>
          <div className="grid grid-cols-1 gap-2">
            {CERTIFICATION_OPTIONS.map((cert) => (
              <div key={cert} className="flex items-center space-x-2">
                <Checkbox
                  id={cert}
                  checked={selectedCerts.includes(cert)}
                  onCheckedChange={() => toggleCertification(cert)}
                />
                <label htmlFor={cert} className="text-sm cursor-pointer">
                  {cert}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={onNext}
          disabled={!settings.category.trim()}
          className="w-full"
        >
          Next: Upload Images
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
