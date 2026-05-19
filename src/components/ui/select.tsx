"use client";

import * as React from "react";
import * as RSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

type SelectProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
};

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder,
  className,
}: SelectProps<T>) {
  return (
    <RSelect.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
    >
      <RSelect.Trigger
        aria-label={ariaLabel}
        className={
          "group flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white outline-none transition-all " +
          "hover:border-orange-300/50 hover:bg-white/[0.07] focus-visible:border-orange-300/80 focus-visible:ring-2 focus-visible:ring-orange-400/30 " +
          "data-[state=open]:border-orange-300/80 data-[state=open]:ring-2 data-[state=open]:ring-orange-400/30 " +
          (className ?? "")
        }
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className="text-orange-300/80 transition-transform group-data-[state=open]:rotate-180">
          <ChevronDown className="size-4" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="select-popover z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/10 bg-[#150a24]/95 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(251,146,60,0.06) 0%, rgba(217,70,239,0.06) 100%)",
          }}
        >
          <RSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RSelect.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/85 outline-none transition-colors data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-orange-400/20 data-[highlighted]:to-fuchsia-500/20 data-[highlighted]:text-white data-[state=checked]:text-orange-200"
              >
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
                <RSelect.ItemIndicator>
                  <Check className="size-4 text-orange-300" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
