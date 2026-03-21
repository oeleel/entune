'use client';

// Stretch goal: Presage API integration for patient stress/emotional state detection
// This component will display a stress level indicator on the provider side

export function StressIndicator({ level }: { level: number | null }) {
  if (level === null) return null;

  const getColor = (l: number) => {
    if (l < 30) return 'bg-green-500';
    if (l < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Patient stress:</span>
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(level)}`}
          style={{ width: `${level}%` }}
        />
      </div>
      {level >= 60 && (
        <span className="text-red-600 text-xs font-medium">Elevated</span>
      )}
    </div>
  );
}
