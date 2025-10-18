'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isAddVideoModalOpen: boolean;
  openAddVideoModal: () => void;
  closeAddVideoModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);

  const openAddVideoModal = () => setIsAddVideoModalOpen(true);
  const closeAddVideoModal = () => setIsAddVideoModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isAddVideoModalOpen,
        openAddVideoModal,
        closeAddVideoModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
