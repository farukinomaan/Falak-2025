"use client";

import { useState } from "react";

type Row = { id: string; pass_name: string; description?: string | null; event_id?: string | null; original_id?: string };
interface Props { items: Row[]; eventsById?: Map<string, { id: string; name: string }> }

export default function CheckoutGrid({ items, eventsById }: Props) {
  const [validated, setValidated] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const onValidate = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
  // For now, just mark as validated locally. Server ownership check removed with legacy cart system.
  setValidated((v) => ({ ...v, [id]: true }));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((p) => {
        const isOk = validated[p.id];
        const isBusy = busy[p.id];
        return (
          <div key={p.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="font-medium flex items-center gap-2">
              {eventsById?.get(p.event_id || "")?.name || p.pass_name}
              {isOk ? <span className="text-green-600 text-sm">✓ Valid</span> : null}
            </div>
            {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
            <button disabled={isBusy || isOk} onClick={() => onValidate(p.id)} className="mt-2 px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-60">
              {isOk ? "Done" : isBusy ? "Validating..." : "Validate"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
