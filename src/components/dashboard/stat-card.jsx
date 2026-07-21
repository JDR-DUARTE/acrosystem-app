import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "flex min-h-[128px] flex-col justify-between rounded-2xl bg-acro-surface p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-acro-accent" />
        <span className="text-sm text-acro-text">{label}</span>
      </div>
      <span className="self-end text-5xl font-semibold text-acro-text">
        {value}
      </span>
    </div>
  );
}
