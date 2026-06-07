import { CategoryRatingInput } from "@/components/survey/category-rating-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSurvey } from "@/hooks/mutations/survey";
import { useGetCategories } from "@/hooks/queries/survey/use-get-categories";
import { Plus } from "lucide-react";
import { useState } from "react";

interface CreateSurveyModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function CreateSurveyModal({
  open,
  onClose,
  workspaceId,
}: CreateSurveyModalProps) {
  const { data: categories } = useGetCategories(workspaceId);
  const createSurvey = useCreateSurvey();

  const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  const [date, setDate] = useState(today());
  const [overallVeryGood, setOverallVeryGood] = useState(0);
  const [overallGood, setOverallGood] = useState(0);
  const [overallNoAnswer, setOverallNoAnswer] = useState(0);
  const [suggestions, setSuggestions] = useState("");
  const [ratings, setRatings] = useState<
    Record<
      string,
      {
        excellent: number;
        good: number;
        average: number;
        bad: number;
        empty: number;
      }
    >
  >({});

  const handleRatingChange = (
    categoryId: string,
    values: {
      excellent: number;
      good: number;
      average: number;
      bad: number;
      empty: number;
    },
  ) => {
    setRatings((prev) => ({ ...prev, [categoryId]: values }));
  };

  const handleSubmit = async () => {
    if (!categories || categories.length === 0) return;

    const totalApplied = Object.values(ratings).reduce(
      (sum, r) =>
        Math.max(sum, r.excellent + r.good + r.average + r.bad + r.empty),
      0,
    );
    const totalAnswered = Object.values(ratings).reduce(
      (sum, r) => Math.max(sum, r.excellent + r.good + r.average + r.bad),
      0,
    );

    await createSurvey.mutateAsync({
      workspaceId,
      date,
      totalApplied,
      totalAnswered,
      overallVeryGood,
      overallGood,
      overallNoAnswer,
      ratings: categories.map((cat) => {
        const r = ratings[cat.id] || {
          excellent: 0,
          good: 0,
          average: 0,
          bad: 0,
          empty: 0,
        };
        return {
          categoryConfigId: cat.id,
          ...r,
          applied: r.excellent + r.good + r.average + r.bad + r.empty,
          answered: r.excellent + r.good + r.average + r.bad,
        };
      }),
      suggestions: suggestions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });

    onClose();
  };

  const computeScore = (values: {
    excellent: number;
    good: number;
    average: number;
    bad: number;
  }) => {
    const answered =
      values.excellent + values.good + values.average + values.bad;
    if (answered === 0) return 0;
    const totalPoints =
      values.excellent * 5 +
      values.good * 4 +
      values.average * 3 +
      values.bad * 2;
    return Math.round((totalPoints / answered) * 10);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Survey</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Category Ratings</h3>
            {categories?.map((cat) => {
              const r = ratings[cat.id] || {
                excellent: 0,
                good: 0,
                average: 0,
                bad: 0,
                empty: 0,
              };
              return (
                <CategoryRatingInput
                  key={cat.id}
                  categoryName={cat.name}
                  values={r}
                  score={computeScore(r)}
                  onChange={(values) => handleRatingChange(cat.id, values)}
                />
              );
            })}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Overall Rating</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Muy Bueno</Label>
                <Input
                  type="number"
                  min={0}
                  value={overallVeryGood}
                  onChange={(e) => setOverallVeryGood(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bueno</Label>
                <Input
                  type="number"
                  min={0}
                  value={overallGood}
                  onChange={(e) => setOverallGood(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No Respondió</Label>
                <Input
                  type="number"
                  min={0}
                  value={overallNoAnswer}
                  onChange={(e) =>
                    setOverallNoAnswer(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Suggestions (one per line)</Label>
            <Textarea
              rows={5}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Enter each suggestion on a new line..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createSurvey.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              {createSurvey.isPending ? "Creating..." : "Create Survey"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
