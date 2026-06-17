"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseJSON } from "@/lib/utils";
import { Plus, Trash2, Save } from "lucide-react";

interface SectionItem {
  title?: string;
  text?: string;
  author?: string;
  company?: string;
  question?: string;
  answer?: string;
}

interface SectionEditorProps {
  section: {
    id: string;
    key: string;
    title: string;
    subtitle: string | null;
    content: string;
    isActive: boolean;
    sortOrder: number;
  };
}

export function SectionEditor({ section }: SectionEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: section.title,
    subtitle: section.subtitle || "",
    isActive: section.isActive,
    sortOrder: section.sortOrder.toString(),
  });
  const [items, setItems] = useState<SectionItem[]>(parseJSON(section.content, []));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sortOrder: parseInt(form.sortOrder),
        content: JSON.stringify(items),
      }),
    });
    router.refresh();
    setSaving(false);
  }

  function addItem() {
    const template = section.key === "testimonials"
      ? { author: "", company: "", text: "" }
      : section.key === "faq"
        ? { question: "", answer: "" }
        : { title: "", text: "" };
    setItems([...items, template]);
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 capitalize">{section.key.replace(/_/g, " ")}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active on website
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Section Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Subtitle</label>
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2 relative">
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
            {Object.keys(item).map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-500 capitalize">{key}</label>
                <input
                  value={(item as Record<string, string>)[key] || ""}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = { ...updated[i], [key]: e.target.value };
                    setItems(updated);
                  }}
                  className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"
                />
              </div>
            ))}
          </div>
        ))}
        <button type="button" onClick={addItem} className="text-sm text-brand-600 hover:underline flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Section"}
      </button>
    </div>
  );
}
