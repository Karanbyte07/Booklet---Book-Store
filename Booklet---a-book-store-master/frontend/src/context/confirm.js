import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FiAlertTriangle } from "react-icons/fi";

const ConfirmContext = createContext(null);

const DEFAULT_CONFIRM_OPTIONS = {
  title: "Please confirm",
  message: "Do you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "danger",
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialog(null);
  }, []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        ...DEFAULT_CONFIRM_OPTIONS,
        ...options,
      });
    });
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog, closeDialog]);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  const confirmButtonClass =
    dialog?.tone === "danger"
      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/40"
      : "bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white border-accent-400/40";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 fx-confirm-backdrop"
            onClick={() => closeDialog(false)}
            aria-label="Close confirmation dialog"
          />

          <div
            className="fx-confirm-panel relative z-[131] w-full max-w-md overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-[0_40px_80px_-34px_rgba(13,14,25,0.55)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <div className="p-5 sm:p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
                <FiAlertTriangle className="h-5 w-5" />
              </div>

              <h3
                id="confirm-dialog-title"
                className="mt-3 text-lg font-semibold text-primary-900"
              >
                {dialog.title}
              </h3>
              <p
                id="confirm-dialog-description"
                className="mt-1.5 text-sm leading-relaxed text-primary-600"
              >
                {dialog.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-primary-100 bg-primary-50/65 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => closeDialog(false)}
                className="h-10 rounded-xl border border-primary-200 bg-white px-4 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeDialog(true)}
                className={`h-10 rounded-xl border px-4 text-sm font-semibold shadow-sm ${confirmButtonClass}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);

  return useCallback(
    async (options = {}) => {
      if (!confirm) {
        return window.confirm(options.message || options.title || "Are you sure?");
      }
      return confirm(options);
    },
    [confirm]
  );
};
