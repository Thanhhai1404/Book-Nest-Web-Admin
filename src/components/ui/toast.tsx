import * as React from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive";

export type ToastState = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

export type ToastContextValue = {
  toasts: ToastState[];
  push: (toast: Omit<ToastState, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: Omit<ToastState, "id">) => {
      const id = crypto?.randomUUID?.() ?? String(Date.now());
      setToasts((t) => [...t, { id, ...toast }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return {
    toast: (t: Omit<ToastState, "id">) => ctx.push(t),
    dismiss: ctx.dismiss,
    toasts: ctx.toasts,
  };
}

export function Toaster() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {ctx.toasts.map((t) => {
        const isDestructive = t.variant === "destructive";
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur",
              isDestructive && "border-red-200 bg-red-50/90",
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                {t.title ? (
                  <div className={cn("text-sm font-semibold", isDestructive && "text-red-800")}>
                    {t.title}
                  </div>
                ) : null}
                {t.description ? (
                  <div className={cn("text-sm text-muted-foreground", isDestructive && "text-red-700")}>
                    {t.description}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => ctx.dismiss(t.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-slate-100",
                  isDestructive && "text-red-700 hover:bg-red-100",
                )}
              >
                Đóng
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
