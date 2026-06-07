import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryRatingInputProps {
  categoryName: string;
  values: {
    excellent: number;
    good: number;
    average: number;
    bad: number;
    empty: number;
  };
  score: number;
  onChange: (values: {
    excellent: number;
    good: number;
    average: number;
    bad: number;
    empty: number;
  }) => void;
}

export function CategoryRatingInput({
  categoryName,
  values,
  score,
  onChange,
}: CategoryRatingInputProps) {
  const fields = [
    {
      key: "excellent" as const,
      label: "E",
      className: "bg-green-50 dark:bg-green-950/20",
    },
    {
      key: "good" as const,
      label: "B",
      className: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      key: "average" as const,
      label: "R",
      className: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      key: "bad" as const,
      label: "M",
      className: "bg-red-50 dark:bg-red-950/20",
    },
    {
      key: "empty" as const,
      label: "Vacías",
      className: "bg-gray-50 dark:bg-gray-950/20",
    },
  ];

  const total =
    values.excellent +
    values.good +
    values.average +
    values.bad +
    values.empty;
  const answered =
    values.excellent + values.good + values.average + values.bad;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
      <h4 className="text-sm font-semibold">{categoryName}</h4>
      <div className="grid grid-cols-5 gap-2">
        {fields.map(({ key, label, className }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) =>
                onChange({
                  ...values,
                  [key]: Number.parseInt(e.target.value) || 0,
                })
              }
              className={`h-8 ${className}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          Aplicadas: <strong>{total}</strong>
        </span>
        <span>
          Contestadas: <strong>{answered}</strong>
        </span>
        {answered > 0 && (
          <span>
            Promedio:{" "}
            <strong className="text-foreground">
              {(score / 10).toFixed(1)}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}
