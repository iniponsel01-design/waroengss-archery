"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, HardDrive } from "lucide-react";

export function DriveConnectionStatus() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);

  const testConnection = async () => {
    setStatus("loading");
    setFolders([]);
    try {
      const res = await fetch("/api/admin/drive/connect");
      const json = await res.json();

      if (json.success) {
        setStatus("ok");
        setMessage(json.data.connection.message);
        setFolders(json.data.folders.slice(0, 10));
      } else {
        setStatus("error");
        setMessage(json.error || "Connection failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <HardDrive size={20} className="text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">Google Drive (Service Account)</p>
          <p className="text-sm text-gray-400">
            Akses otomatis menggunakan Service Account credentials
          </p>
        </div>
        {status === "ok" && <CheckCircle size={18} className="text-green-500 ml-auto" />}
        {status === "error" && <XCircle size={18} className="text-red-500 ml-auto" />}
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-3 rounded-xl ${
            status === "ok"
              ? "bg-green-50 text-green-700"
              : status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          {message}
        </div>
      )}

      {folders.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Folder terlihat (10 pertama):
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {folders.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-gray-700">{f.name}</span>
                <code className="text-xs text-gray-400 font-mono">{f.id}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={testConnection}
        disabled={status === "loading"}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Testing...
          </>
        ) : (
          "Test Connection"
        )}
      </button>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Pastikan <code className="bg-gray-100 px-1 py-0.5 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> atau file{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">service-account.json</code> sudah dikonfigurasi. Lihat{" "}
          <span className="text-brand-600">GOOGLE_DRIVE_SETUP.md</span> untuk panduan lengkap.
        </p>
      </div>
    </div>
  );
}
