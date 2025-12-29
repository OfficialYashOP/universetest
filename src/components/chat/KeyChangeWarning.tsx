import { AlertTriangle, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyChangeWarningProps {
  peerName: string;
  onDismiss: () => void;
  onVerify: () => void;
}

export function KeyChangeWarning({ peerName, onDismiss, onVerify }: KeyChangeWarningProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mx-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-destructive">
            Security code changed
          </p>
          <p className="text-sm text-muted-foreground">
            {peerName}'s security code has changed. This could mean they reinstalled the app, 
            got a new device, or someone is trying to intercept your messages.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onVerify}>
              <Shield className="w-4 h-4 mr-1" />
              Verify
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-4 h-4 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
