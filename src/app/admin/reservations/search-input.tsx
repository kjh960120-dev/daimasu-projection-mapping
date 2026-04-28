"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";

export function ReservationSearch({
  initial,
  filter,
  placeholder,
}: {
  initial: string;
  filter: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function submit(next: string) {
    const sp = new URLSearchParams();
    sp.set("filter", filter);
    if (next) sp.set("q", next);
    startTransition(() => {
      router.push(`/admin/reservations?${sp.toString()}`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(value.trim());
      }}
      className="flex flex-1 items-center gap-2 border border-border bg-background/50 px-3 py-1.5 focus-within:border-gold/60 sm:max-w-md"
    >
      <Search size={14} className="text-text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-text-muted focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            submit("");
          }}
          className="text-text-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted/60">
        {pending ? "..." : "↵"}
      </span>
    </form>
  );
}
