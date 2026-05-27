import React from 'react';
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
    <section className="max-w-3xl mx-auto">
      <div className="mb-4">
        <p className="label-mono mb-1">Step 01 / Settings</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Product settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Configure the language, category, and certifications for the description.
        </p>
      </div>

      <div className="border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="target-language" className="label-mono">Target language</Label>
            <Select
              value={settings.language}
              onValueChange={(v) => onSettingsChange({ ...settings, language: v })}
            >
              <SelectTrigger id="target-language" className="w-full">
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
            <Label htmlFor="product-category" className="label-mono">Product category</Label>
            <Input
              id="product-category"
              placeholder="e.g. wired bra, nightdress, bikini top"
              value={settings.category}
              onChange={(e) => onSettingsChange({ ...settings, category: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              The exact product type — used as the grammatical starting point.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="label-mono">Certifications (optional)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {CERTIFICATION_OPTIONS.map((cert) => (
              <div key={cert} className="flex items-center gap-2.5">
                <Checkbox
                  id={cert}
                  checked={selectedCerts.includes(cert)}
                  onCheckedChange={() => toggleCertification(cert)}
                />
                <label htmlFor={cert} className="text-sm cursor-pointer text-foreground">
                  {cert}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border flex justify-end">
        <Button
          onClick={onNext}
          disabled={!settings.category.trim()}
        >
          Next: Upload images
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
