import { Calendar, FolderOpen, Images } from "lucide-react";
import { formatNumber } from "@/lib/utils/date";

interface EventStatsProps {
  days: number;
  albums: number;
  photos: number;
}

export function EventStats({ days, albums, photos }: EventStatsProps) {
  const stats = [
    { icon: Calendar, label: "Hari", value: days },
    { icon: FolderOpen, label: "Album", value: albums },
    { icon: Images, label: "Foto", value: photos },
  ];

  return (
    <div className="flex flex-wrap gap-6">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Icon size={18} className="text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">
              {formatNumber(value)}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
