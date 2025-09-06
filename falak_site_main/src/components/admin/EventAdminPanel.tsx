"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import {
  EventCreateSchema,
  EventUpdateSchema,
  PassCreateSchema,
  PassUpdateSchema,
} from "@/lib/actions/schemas";
import {
  saListEvents,
  saCreateEvent,
  saUpdateEvent,
  saDeleteEvent,
  saListPasses,
  saCreatePass,
  saUpdatePass,
  saDeletePass,
} from "@/lib/actions/adminAggregations";

// Types for rows coming from Supabase
type EventRow = {
  id: string;
  name: string;
  sub_cluster: string;
  description?: string | null;
  rules?: string | null;
  date?: string | Date | null;
  time?: string;
  venue: string;
  cluster_name?: string | null;
  enable?: boolean | null;
  image_url?: string | null;
};

type PassRow = {
  id: string;
  pass_name: string;
  cost: number | string;
  description?: string | null;
  enable?: boolean | null;
  status?: boolean | null;
  event_id?: string | null;
  quanatity?: number | string | null;
};

function useSearch<T>(items: T[], q: string, key: keyof T) {
  return useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((it) => String(it[key] ?? "").toLowerCase().includes(qq));
  }, [items, q, key]);
}

export default function EventAdminPanel() {
  const [tab, setTab] = useState<"events" | "passes">("events");
  const [q, setQ] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [passes, setPasses] = useState<PassRow[]>([]);
  const [openForm, setOpenForm] = useState<null | { kind: "event" | "pass"; row?: EventRow | PassRow }>(null);

  async function refresh() {
    const [ev, ps] = await Promise.all([saListEvents(), saListPasses()]);
    if (ev.ok) setEvents((ev.data as EventRow[]) || []);
    if (ps.ok) setPasses((ps.data as PassRow[]) || []);
  }
  useEffect(() => {
    refresh();
  }, []);

  const filteredEvents = useSearch(events, q, "name");
  const filteredPasses = useSearch(passes, q, "pass_name");

  async function onSubmitEvent(form: EventCreatePayload | EventUpdatePayload) {
    const isUpdate = "id" in form && !!form.id;
    if (isUpdate) {
      const parsed = EventUpdateSchema.safeParse(form);
      if (!parsed.success) {
        toast.error("Invalid event data");
        return;
      }
      const res = await saUpdateEvent(parsed.data);
      if (!res.ok) toast.error(res.error);
      else toast.success("Event updated");
    } else {
      const parsed = EventCreateSchema.safeParse(form);
      if (!parsed.success) {
        toast.error("Invalid event data");
        return;
      }
      const res = await saCreateEvent(parsed.data);
      if (!res.ok) toast.error(res.error);
      else toast.success("Event created");
    }
    setOpenForm(null);
    refresh();
  }

  async function onSubmitPass(form: PassCreatePayload | PassUpdatePayload) {
    const isUpdate = "id" in form && !!form.id;
    if (isUpdate) {
      const parsed = PassUpdateSchema.safeParse(form);
      if (!parsed.success) {
        toast.error("Invalid pass data");
        return;
      }
      const res = await saUpdatePass(parsed.data);
      if (!res.ok) toast.error(res.error);
      else toast.success("Pass updated");
    } else {
      const parsed = PassCreateSchema.safeParse(form);
      if (!parsed.success) {
        toast.error("Invalid pass data");
        return;
      }
      const res = await saCreatePass(parsed.data);
      if (!res.ok) toast.error(res.error);
      else toast.success("Pass created");
    }
    setOpenForm(null);
    refresh();
  }

  async function onDelete(kind: "event" | "pass", id: string) {
    const res = kind === "event" ? await saDeleteEvent(id) : await saDeletePass(id);
    if (!res.ok) toast.error(res.error);
    else toast.success("Deleted");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-md border p-1">
          <button onClick={() => setTab("events")} className={`px-3 py-1 rounded ${tab === "events" ? "bg-primary text-white" : ""}`}>Events</button>
          <button onClick={() => setTab("passes")} className={`px-3 py-1 rounded ${tab === "passes" ? "bg-primary text-white" : ""}`}>Passes</button>
        </div>
        <Input placeholder="Search by name/title" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Button onClick={() => setOpenForm({ kind: tab === "events" ? "event" : "pass" })}>Create</Button>
      </div>

      {tab === "events" ? (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Image</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Sub cluster</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Venue</th>
                  <th className="p-2">Enabled</th>
                  <th className="p-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => {
                  const dateText = !e.date
                    ? ""
                    : typeof e.date === "string"
                    ? e.date.slice(0, 10)
                    : e.date instanceof Date
                    ? e.date.toISOString().slice(0, 10)
                    : String(e.date);
                  const enabled = (e.enable ?? true) as boolean;
                  return (
                    <tr key={e.id} className="border-b">
                      <td className="p-2">
                        {e.image_url ? (
                          <img 
                            src={e.image_url} 
                            alt={e.name} 
                            className="w-16 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-2">{e.name}</td>
                      <td className="p-2">{e.sub_cluster}</td>
                      <td className="p-2">{dateText}</td>
                      <td className="p-2">{e.venue}</td>
                      <td className="p-2">{String(enabled)}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOpenForm({ kind: "event", row: e })}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete("event", e.id)}>Delete</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Pass name</th>
                  <th className="p-2">Cost</th>
                  <th className="p-2">Enabled</th>
                  <th className="p-2">Event</th>
                  <th className="p-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPasses.map((p) => {
                  const enabled = (p.enable ?? p.status ?? true) as boolean;
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{p.pass_name}</td>
                      <td className="p-2">{typeof p.cost === "number" ? p.cost : p.cost}</td>
                      <td className="p-2">{String(enabled)}</td>
                      <td className="p-2">{p.event_id || "-"}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOpenForm({ kind: "pass", row: p })}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => onDelete("pass", p.id)}>Delete</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{openForm.row ? "Edit" : "Create"} {openForm.kind === "event" ? "Event" : "Pass"}</h3>
              <button onClick={() => setOpenForm(null)} className="text-sm">Close</button>
            </div>

            {openForm.kind === "event" ? (
              <EventForm row={openForm.row as EventRow} onSubmit={onSubmitEvent} />
            ) : (
              <PassForm row={openForm.row as PassRow} events={events} onSubmit={onSubmitPass} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Payload types for submit (matching zod schemas)
type EventCreatePayload = {
  name: string;
  sub_cluster: string;
  description?: string | null;
  rules?: string | null;
  date: Date;
  time: string;
  venue: string;
  cluster_name?: string | null;
  enable?: boolean;
  image_url?: string | null;
};

type EventUpdatePayload = Partial<EventCreatePayload> & { id: string };

type EventFormState = {
  id?: string;
  name: string;
  sub_cluster: string;
  description?: string | null;
  rules?: string | null;
  date: string; // yyyy-mm-dd
  time: string;
  venue: string;
  cluster_name?: string | null;
  enable?: boolean;
  image_url?: string | null;
};

function EventForm({ row, onSubmit }: { row?: EventRow; onSubmit: (v: EventCreatePayload | EventUpdatePayload) => void }) {
  // Load Cloudinary script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://upload-widget.cloudinary.com/global/all.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const [form, setForm] = useState<EventFormState>(() => {
    const dateStr = !row?.date
      ? ""
      : typeof row.date === "string"
      ? row.date.slice(0, 10)
      : row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : "";
    return {
      id: row?.id,
      name: row?.name || "",
      sub_cluster: row?.sub_cluster || "",
      description: row?.description ?? "",
      rules: row?.rules ?? "",
      date: dateStr,
      time: row?.time || "",
      venue: row?.venue || "",
      cluster_name: row?.cluster_name ?? "",
      enable: (row?.enable ?? true) as boolean,
      image_url: row?.image_url ?? "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange<K extends keyof EventFormState>(name: K, value: EventFormState[K]) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate(): EventCreatePayload | EventUpdatePayload | null {
    const payloadBase: EventCreatePayload = {
      name: form.name,
      sub_cluster: form.sub_cluster,
      description: form.description ?? null,
      rules: form.rules ?? null,
      date: form.date ? new Date(form.date) : new Date(),
      time: form.time,
      venue: form.venue,
      cluster_name: form.cluster_name ?? null,
      enable: !!form.enable,
      image_url: form.image_url ?? null,
    };
    const payload = form.id ? ({ id: form.id, ...payloadBase } as EventUpdatePayload) : payloadBase;
    const parsed = (form.id ? EventUpdateSchema : EventCreateSchema).safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return null;
    }
    setErrors({});
    return parsed.data as EventCreatePayload | EventUpdatePayload;
  }

  // Cloudinary upload handler
  const handleCloudinaryUpload = (result: any) => {
    if (result.event === "success") {
      const imageUrl = result.info.secure_url;
      handleChange("image_url", imageUrl);
      toast.success("Image uploaded successfully!");
    }
  };

  return (
    <Form>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </FormControl>
          {errors.name && <FormMessage>{errors.name}</FormMessage>}
        </FormItem>
        <FormItem>
          <FormLabel>Sub cluster</FormLabel>
          <FormControl>
            <Input value={form.sub_cluster} onChange={(e) => handleChange("sub_cluster", e.target.value)} />
          </FormControl>
          {errors.sub_cluster && <FormMessage>{errors.sub_cluster}</FormMessage>}
        </FormItem>
        <FormItem className="sm:col-span-2">
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input value={form.description ?? ""} onChange={(e) => handleChange("description", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem className="sm:col-span-2">
          <FormLabel>Rules</FormLabel>
          <FormControl>
            <Input value={form.rules ?? ""} onChange={(e) => handleChange("rules", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem className="sm:col-span-2">
          <FormLabel>Event Image</FormLabel>
          <FormControl>
            <div className="space-y-2">
              {form.image_url && (
                <div className="mb-2">
                  <img 
                    src={form.image_url} 
                    alt="Event preview" 
                    className="w-32 h-20 object-cover rounded border"
                  />
                </div>
              )}
              <div id="cloudinary-upload-widget" className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    // @ts-ignore
                    if (window.cloudinary) {
                      // @ts-ignore
                      window.cloudinary.createUploadWidget(
                        {
                          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                          uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
                          sources: ['local', 'url', 'camera'],
                          multiple: false,
                          cropping: true,
                          croppingAspectRatio: 16/9,
                          showAdvancedOptions: false,
                          resourceType: 'image',
                          folder: 'events'
                        },
                        handleCloudinaryUpload
                      ).open();
                    } else {
                      toast.error("Cloudinary not loaded. Please refresh the page.");
                    }
                  }}
                  className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                >
                  {form.image_url ? "Change Image" : "Upload Event Image"}
                </button>
              </div>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => handleChange("image_url", "")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove Image
                </button>
              )}
            </div>
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Date</FormLabel>
          <FormControl>
            <Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Time</FormLabel>
          <FormControl>
            <Input type="time" value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Venue</FormLabel>
          <FormControl>
            <Input value={form.venue} onChange={(e) => handleChange("venue", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Cluster name</FormLabel>
          <FormControl>
            <Input value={form.cluster_name ?? ""} onChange={(e) => handleChange("cluster_name", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Enabled</FormLabel>
          <FormControl>
            <input type="checkbox" checked={!!form.enable} onChange={(e) => handleChange("enable", e.target.checked)} />
          </FormControl>
        </FormItem>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => { const v = validate(); if (v) onSubmit(v); }}>Save</Button>
      </div>
    </Form>
  );
}

type PassCreatePayload = {
  pass_name: string;
  cost: number | string;
  description?: string | null;
  enable?: boolean;
  status?: boolean;
  quanatity?: number | string | null;
  event_id?: string;
};

type PassUpdatePayload = Partial<PassCreatePayload> & { id: string };

type PassFormState = {
  id?: string;
  pass_name: string;
  cost: string;
  description?: string | null;
  enable?: boolean;
  status?: boolean;
  quanatity?: string;
  event_id?: string;
};

function PassForm({ row, events, onSubmit }: { row?: PassRow; events: EventRow[]; onSubmit: (v: PassCreatePayload | PassUpdatePayload) => void }) {
  const [form, setForm] = useState<PassFormState>(() => ({
    id: row?.id,
    pass_name: row?.pass_name || "",
    cost: typeof row?.cost === "number" ? String(row?.cost) : (row?.cost || ""),
    description: row?.description ?? "",
    enable: (row?.enable ?? row?.status ?? true) as boolean,
    event_id: (row?.event_id ?? "") || "",
    quanatity: row?.quanatity ? String(row.quanatity) : "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange<K extends keyof PassFormState>(name: K, value: PassFormState[K]) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate(): PassCreatePayload | PassUpdatePayload | null {
    const casted: PassCreatePayload = {
      pass_name: form.pass_name,
      cost: form.cost === "" ? 0 : Number(form.cost),
      description: form.description ?? null,
      enable: !!form.enable,
      status: form.status,
      quanatity: form.quanatity === "" ? null : Number(form.quanatity),
      event_id: form.event_id || undefined,
    };
    const payload = form.id ? ({ id: form.id, ...casted } as PassUpdatePayload) : casted;
    const parsed = (form.id ? PassUpdateSchema : PassCreateSchema).safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return null;
    }
    setErrors({});
    return parsed.data as PassCreatePayload | PassUpdatePayload;
  }

  return (
    <Form>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormItem>
          <FormLabel>Pass name</FormLabel>
          <FormControl>
            <Input value={form.pass_name} onChange={(e) => handleChange("pass_name", e.target.value)} />
          </FormControl>
          {errors.pass_name && <FormMessage>{errors.pass_name}</FormMessage>}
        </FormItem>
        <FormItem>
          <FormLabel>Cost</FormLabel>
          <FormControl>
            <Input value={form.cost} onChange={(e) => handleChange("cost", e.target.value)} />
          </FormControl>
          {errors.cost && <FormMessage>{errors.cost}</FormMessage>}
        </FormItem>
        <FormItem className="sm:col-span-2">
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input value={form.description ?? ""} onChange={(e) => handleChange("description", e.target.value)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Enabled</FormLabel>
          <FormControl>
            <input type="checkbox" checked={!!form.enable} onChange={(e) => handleChange("enable", e.target.checked)} />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Event</FormLabel>
          <FormControl>
            <select value={form.event_id || ""} onChange={(e) => handleChange("event_id", e.target.value)} className="h-9 rounded-md border px-3">
              <option value="">Pro Show</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Quantity</FormLabel>
          <FormControl>
            <Input value={form.quanatity ?? ""} onChange={(e) => handleChange("quanatity", e.target.value)} />
          </FormControl>
        </FormItem>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => { const v = validate(); if (v) onSubmit(v); }}>Save</Button>
      </div>
    </Form>
  );
}
