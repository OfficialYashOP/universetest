import { useState, useEffect } from "react";
import { Shield, Copy, Check, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSafetyNumber, refreshKeys } from "@/lib/e2ee";
import { useToast } from "@/hooks/use-toast";

interface SafetyNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  peerId: string;
  peerName: string;
}

export function SafetyNumberDialog({
  open,
  onOpenChange,
  userId,
  peerId,
  peerName,
}: SafetyNumberDialogProps) {
  const [safetyNumber, setSafetyNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSafetyNumber();
    }
  }, [open, userId, peerId]);

  const loadSafetyNumber = async () => {
    setLoading(true);
    setError(null);
    const result = await getSafetyNumber(userId, peerId);
    setSafetyNumber(result.safetyNumber);
    setError(result.error || null);
    setCanRefresh(result.canRefresh || false);
    setLoading(false);
  };

  const handleRefreshKeys = async () => {
    setRefreshing(true);
    const success = await refreshKeys(userId);
    if (success) {
      toast({ title: "Encryption keys refreshed" });
      await loadSafetyNumber();
    } else {
      toast({ title: "Failed to refresh keys", variant: "destructive" });
    }
    setRefreshing(false);
  };

  const handleCopy = async () => {
    if (safetyNumber) {
      await navigator.clipboard.writeText(safetyNumber);
      setCopied(true);
      toast({ title: "Safety number copied" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verify Safety Number
          </DialogTitle>
          <DialogDescription>
            Compare this number with {peerName} to verify end-to-end encryption
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading safety number...
              </div>
            </div>
          ) : safetyNumber ? (
            <>
              <div className="bg-muted rounded-lg p-4 font-mono text-center text-lg tracking-wider">
                {safetyNumber.split('\n').map((line, i) => (
                  <div key={i} className="py-1">{line}</div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-muted-foreground">
                  If the numbers match on both devices, your conversation is secure. 
                  If they don't match, someone might be intercepting your messages.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Safety Number
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <p className="text-muted-foreground">
                {error || "Unable to generate safety number. Please try again later."}
              </p>
              
              {canRefresh && (
                <Button
                  variant="outline"
                  onClick={handleRefreshKeys}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Encryption Keys
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
