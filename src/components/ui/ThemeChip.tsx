export interface ThemeChipProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function ThemeChip({ name, color, onRemove }: ThemeChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}1A`, // ~10% opacity
        borderColor: `${color}40`,
        color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  );
}
