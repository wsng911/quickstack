'use client'

import { createContext, useContext } from 'react';

interface DialogContextType {
  closeDialog: (result?: any) => void;
}

export const DialogContext = createContext<DialogContextType | null>(null);

export const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogContext must be used within a Dialog');
  }
  return context;
};