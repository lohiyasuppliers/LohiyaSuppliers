"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, FileText, Download, Upload, Eye, X, Loader2 } from "lucide-react";
import { formatPaise, formatDate } from "@/lib/utils";

interface Bill {
  id: string;
  billNumber: string;
  title: string | null;
  description: string | null;
  amountPaise: number | null;
  billDate: string;
  fileUrl: string | null;
}

export function AdminBillManager({
  clientId,
  initialBills,
}: {
  clientId: string;
  initialBills: Bill[];
}) {
  const [bills, setBills] = useState(initialBills);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    billNumber: "",
    title: "",
    description: "",
    amountRupees: "",
    billDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  function resetForm() {
    setForm({
      billNumber: "",
      title: "",
      description: "",
      amountRupees: "",
      billDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please upload the original bill file (PDF or image).");
      return;
    }

    setSaving(true);
    setUploading(true);

    const uploadData = new FormData();
    uploadData.append("file", selectedFile);
    uploadData.append("clientId", clientId);

    const uploadRes = await fetch("/api/admin/bills/upload", {
      method: "POST",
      body: uploadData,
    });

    if (!uploadRes.ok) {
      alert((await uploadRes.json()).error || "Failed to upload file");
      setSaving(false);
      setUploading(false);
      return;
    }

    const { fileUrl } = await uploadRes.json();
    setUploading(false);

    const res = await fetch("/api/admin/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, fileUrl, ...form }),
    });

    if (res.ok) {
      const bill = await res.json();
      setBills([
        {
          ...bill,
          billDate:
            typeof bill.billDate === "string" ? bill.billDate : new Date(bill.billDate).toISOString(),
        },
        ...bills,
      ]);
      setShowForm(false);
      resetForm();
    } else {
      alert((await res.json()).error || "Failed to create bill");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill? The uploaded file will also be removed.")) return;
    const res = await fetch(`/api/admin/bills/${id}`, { method: "DELETE" });
    if (res.ok) setBills(bills.filter((b) => b.id !== id));
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Client Bills ({bills.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload original bills for this client. They appear in the client&apos;s My Bills page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Upload Bill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border rounded-xl p-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Bill number *"
              value={form.billNumber}
              onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            />
            <input
              placeholder="Title (e.g. Tax Invoice)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount (₹)"
              value={form.amountRupees}
              onChange={(e) => setForm({ ...form, amountRupees: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            />
            <input
              type="date"
              value={form.billDate}
              onChange={(e) => setForm({ ...form, billDate: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm sm:col-span-2 bg-white"
              rows={2}
            />
            <textarea
              placeholder="Internal notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm sm:col-span-2 bg-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Original bill file *
            </label>
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-500 hover:text-brand-600 hover:bg-white transition-colors"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload PDF or image</span>
                <span className="text-xs">PDF, JPEG, PNG, WebP · max 15MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {saving ? (uploading ? "Uploading file..." : "Saving...") : "Save Bill for Client"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {bills.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-xl">
          No bills uploaded yet. Click &quot;Upload Bill&quot; to add one for this client.
        </p>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl text-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{bill.billNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bill.title || "Bill"} · {formatDate(bill.billDate)}
                  {bill.amountPaise != null && ` · ${formatPaise(bill.amountPaise)}`}
                </p>
                {bill.description && (
                  <p className="text-xs text-gray-600 mt-1">{bill.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {bill.fileUrl && (
                  <>
                    <a
                      href={`/api/user/bills/${bill.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 rounded-lg hover:bg-brand-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </a>
                    <a
                      href={`/api/user/bills/${bill.id}/file?download=1`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(bill.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  aria-label="Delete bill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
