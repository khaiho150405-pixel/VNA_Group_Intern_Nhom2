import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

interface FormDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const FormDialog: React.FC<FormDialogProps> = ({ open, title, children, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        {onClose && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            style={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
};

export default FormDialog;