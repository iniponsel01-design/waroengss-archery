import { DriveConnectionStatus } from "@/components/admin/DriveConnectionStatus";

export const dynamic = "force-dynamic";

export default function DriveConnectionsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Drive Connection</h1>
        <p className="text-gray-500 text-sm mt-1">
          Status koneksi ke Google Drive menggunakan Service Account
        </p>
      </div>
      <DriveConnectionStatus />
    </div>
  );
}
