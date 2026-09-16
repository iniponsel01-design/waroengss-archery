import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {u.role}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Untuk menambah admin, gunakan script atau endpoint setup. Lihat SETUP.md.
      </p>
    </div>
  );
}
