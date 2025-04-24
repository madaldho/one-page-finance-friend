import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  // Dialog control props - support both patterns
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;

  // Action props
  onConfirm: () => void;
  
  // Content props
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  isLoading = false,
}) => {
  // Support both control patterns
  const isDialogOpen = open !== undefined ? open : isOpen;
  
  const handleOpenChange = (newOpenState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpenState);
    } else if (!newOpenState && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {itemName && <span className="font-medium"> {itemName}</span>}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="mt-2 sm:mt-0"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              handleOpenChange(false);
            }}
            className="mt-2 sm:mt-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog; 