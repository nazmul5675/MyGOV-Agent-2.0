"use client";

import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordInputProps = ComponentProps<"input"> & {
  inputClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputClassName, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          {...props}
          type={visible ? "text" : "password"}
          className={cn("h-12 rounded-2xl border-white/40 bg-white/80 pr-12", inputClassName)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
