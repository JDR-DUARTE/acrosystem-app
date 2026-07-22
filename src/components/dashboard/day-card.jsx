export default function DayCard({ day, cupo = 7, members = [] }) {
  return (
    <div className="flex min-h-[260px] flex-col rounded-2xl bg-acro-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium text-acro-text">{day}</h3>
        <span className="text-sm text-acro-muted">
          {members.length}/{cupo}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="my-auto text-center text-sm text-acro-muted">
          Sin miembros agendados
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="truncate rounded-lg bg-acro-dark px-3 py-2 text-sm text-acro-text"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
