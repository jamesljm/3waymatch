'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ToleranceConfig {
  id: string;
  name: string;
  isDefault: boolean;
  priceTolerancePct: number;
  qtyTolerancePct: number;
  taxTolerancePct: number;
  amountToleranceAbs: number;
  autoApproveThreshold: number;
  reviewThreshold: number;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ToleranceConfig[]>([]);
  const [editing, setEditing] = useState<ToleranceConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data } = await api.get('/settings/tolerance');
    setConfigs(data.data);
    if (data.data.length > 0 && !editing) {
      setEditing({ ...data.data[0] });
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/settings/tolerance/${editing.id}`, {
        priceTolerancePct: editing.priceTolerancePct,
        qtyTolerancePct: editing.qtyTolerancePct,
        taxTolerancePct: editing.taxTolerancePct,
        amountToleranceAbs: editing.amountToleranceAbs,
        autoApproveThreshold: editing.autoApproveThreshold,
        reviewThreshold: editing.reviewThreshold,
      });
      setMessage('Settings saved');
      fetchConfigs();
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matching Tolerances</CardTitle>
          <CardDescription>
            Configure thresholds for automatic matching. Values outside these tolerances will be
            flagged for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Price Tolerance (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editing.priceTolerancePct}
                onChange={(e) =>
                  setEditing({ ...editing, priceTolerancePct: parseFloat(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Allowed price difference between PO, DO, and Invoice
              </p>
            </div>
            <div className="space-y-2">
              <Label>Quantity Tolerance (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editing.qtyTolerancePct}
                onChange={(e) =>
                  setEditing({ ...editing, qtyTolerancePct: parseFloat(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Allowed quantity difference (e.g., partial deliveries)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tax Tolerance (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editing.taxTolerancePct}
                onChange={(e) =>
                  setEditing({ ...editing, taxTolerancePct: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Amount Tolerance (absolute, MYR)</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.amountToleranceAbs}
                onChange={(e) =>
                  setEditing({ ...editing, amountToleranceAbs: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 font-medium">Auto-Matching Thresholds</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Auto-Approve Threshold (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editing.autoApproveThreshold}
                  onChange={(e) =>
                    setEditing({ ...editing, autoApproveThreshold: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Match sets scoring above this are auto-approved
                </p>
              </div>
              <div className="space-y-2">
                <Label>Review Threshold (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editing.reviewThreshold}
                  onChange={(e) =>
                    setEditing({ ...editing, reviewThreshold: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Scores below this become exceptions requiring review
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
            {message && (
              <span className={`text-sm ${message.includes('Failed') ? 'text-destructive' : 'text-green-700'}`}>
                {message}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
