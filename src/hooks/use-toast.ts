import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

export function toast({ title, description, variant, duration }: ToastOptions) {
  const message = title ?? description ?? "";
  const opts = {
    description: title ? description : undefined,
    duration,
  };
  if (variant === "destructive") {
    return sonnerToast.error(message, opts);
  }
  return sonnerToast(message, opts);
}

export function useToast() {
  return { toast, dismiss: sonnerToast.dismiss };
}
