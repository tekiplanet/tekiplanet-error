import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useAuthStore } from '@/store/useAuthStore';
import { twoFactorService } from '@/services/twoFactorService';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';

export function TwoFactorSettings() {
  const { user, updateUser } = useAuthStore();
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qr_code_url: string;
    recovery_codes: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      const data = await twoFactorService.enable();
      setSetupData(data);
      setIsEnabling2FA(true);
    } catch (error: any) {
      toast.error('Failed to enable 2FA', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      await twoFactorService.verify(verificationCode);
      await updateUser({ two_factor_enabled: true });
      setIsEnabling2FA(false);
      setSetupData(null);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled successfully');
    } catch (error: any) {
      toast.error('Failed to verify 2FA code', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      await twoFactorService.disable(verificationCode);
      await updateUser({ two_factor_enabled: false });
      setIsDisabling2FA(false);
      setVerificationCode('');
      toast.success('Two-factor authentication disabled successfully');
    } catch (error: any) {
      toast.error('Failed to disable 2FA', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewRecoveryCodes = async () => {
    try {
      setLoading(true);
      const { recovery_codes } = await twoFactorService.generateRecoveryCodes();
      setSetupData(prev => prev ? { ...prev, recovery_codes } : null);
      toast.success('New recovery codes generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate new recovery codes', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base">Two-Factor Authentication</Label>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <Switch
          checked={user?.two_factor_enabled || false}
          onCheckedChange={(checked) => {
            if (checked) {
              handleEnable2FA();
            } else {
              setIsDisabling2FA(true);
            }
          }}
          disabled={loading}
        />
      </div>

      {user?.two_factor_enabled && (
        <Button
          variant="outline"
          onClick={handleGenerateNewRecoveryCodes}
          disabled={loading}
        >
          Generate New Recovery Codes
        </Button>
      )}

      {/* Enable 2FA Dialog */}
      <Dialog open={isEnabling2FA} onOpenChange={setIsEnabling2FA}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code.
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <QRCodeSVG
                  value={setupData.qr_code_url}
                  size={200}
                  level="H"
                  includeMargin
                  className="border rounded-lg bg-white p-2"
                />
              </div>

              <div className="space-y-2">
                <Label>Manual Entry Code</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all">{setupData.secret}</p>
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleVerify2FA}
                disabled={!verificationCode || loading}
                className="w-full"
              >
                Verify and Enable
              </Button>

              <div className="space-y-2">
                <Label>Recovery Codes</Label>
                <Card className="p-4">
                  <div className="space-y-1">
                    {setupData.recovery_codes.map((code, index) => (
                      <p key={index} className="font-mono text-sm">{code}</p>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Save these recovery codes in a secure place. You can use them to access your account if you lose your authenticator device.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={isDisabling2FA} onOpenChange={setIsDisabling2FA}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current 2FA code to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                Warning: Disabling 2FA will make your account less secure.
              </p>
            </div>

            <Button
              onClick={handleDisable2FA}
              disabled={!verificationCode || loading}
              variant="destructive"
              className="w-full"
            >
              Disable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
