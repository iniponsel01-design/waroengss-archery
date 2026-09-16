interface AdminStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
  bgColor?: string;
}

export function AdminStatCard({
  icon,
  label,
  value,
  subLabel,
  bgColor = "bg-gray-50",
}: AdminStatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {subLabel && (
        <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>
      )}
    </div>
  );
}
