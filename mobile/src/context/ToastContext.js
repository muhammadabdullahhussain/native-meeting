import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const showToast = useCallback((title, sub, type = 'info') => {
        setToast({ title, sub, type });
        // Auto-dismiss after 3.5 seconds for premium feel
        setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    /**
     * confirmAction({ title, message, onConfirm, confirmText, confirmStyle })
     */
    const confirmAction = useCallback((config) => {
        setConfirm(config);
    }, []);

    const hideConfirm = useCallback(() => {
        setConfirm(null);
    }, []);

    return (
        <ToastContext.Provider value={{
            showToast, hideToast, toast,
            confirmAction, hideConfirm, confirm
        }}>
            {children}
        </ToastContext.Provider>
    );
};
