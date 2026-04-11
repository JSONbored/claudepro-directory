"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

import { cn } from "@/lib";

type ToastVariant = "success" | "info" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  leaving: boolean;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastIcon(variant: ToastVariant) {
  if (variant === "success") return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (variant === "error") return <TriangleAlert className="size-4 text-red-500" />;
  return <Info className="size-4 text-primary" />;
}

function getToastTitleClass(variant: ToastVariant) {
  if (variant === "success") return "text-emerald-500";
  if (variant === "error") return "text-destructive";
  return "text-primary";
}

function getToastSurfaceClass(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-500/45 bg-card/95 shadow-[0_10px_30px_-16px_color-mix(in_oklab,var(--chart-2)_45%,transparent)]";
  }
  if (variant === "error") {
    return "border-destructive/45 bg-card/95 shadow-[0_10px_30px_-16px_color-mix(in_oklab,var(--destructive)_40%,transparent)]";
  }
  return "border-primary/45 bg-card/95 shadow-[0_10px_30px_-16px_color-mix(in_oklab,var(--primary)_40%,transparent)]";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((item) => (item.id === id ? { ...item, leaving: true } : item))
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 220);
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    const variant = toast.variant ?? "info";
    setToasts((current) => [
      ...current,
      { id, title: toast.title, description: toast.description, variant, leaving: false }
    ]);
    window.setTimeout(() => dismissToast(id), 2200);
  }, [dismissToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            aria-live={toast.variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 backdrop-blur transition toast-enter",
              getToastSurfaceClass(toast.variant),
              toast.leaving && "toast-exit",
            )}
          >
            {getToastIcon(toast.variant)}
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", getToastTitleClass(toast.variant))}>
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="inline-flex size-6 items-center justify-center rounded-md border border-border/70 bg-background/60 text-muted-foreground transition hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
