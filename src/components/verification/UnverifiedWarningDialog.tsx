import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface UnverifiedWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  actionType: "follow" | "message";
  userName?: string;
}

export const UnverifiedWarningDialog = ({
  open,
  onOpenChange,
  onConfirm,
  actionType,
  userName,
}: UnverifiedWarningDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center">
            Unverified User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              <span className="font-medium text-foreground">{userName || "This user"}</span> is not verified.
            </p>
            <p className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Proceed with caution. They may be a spam or scam account.
            </p>
            <p className="text-sm pt-2">
              Verified users display a blue tick badge on their profile.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel className="sm:min-w-[100px]">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="sm:min-w-[100px]"
          >
            {actionType === "follow" ? "Follow Anyway" : "Message Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};