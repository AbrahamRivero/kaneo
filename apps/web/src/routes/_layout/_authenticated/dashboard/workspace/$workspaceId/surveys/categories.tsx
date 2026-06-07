import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetCategories } from "@/hooks/queries/survey/use-get-categories";
import { useUpsertCategories } from "@/hooks/mutations/survey";
import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/surveys/categories",
)({
  component: CategoriesConfigPage,
});

function CategoriesConfigPage() {
  const { workspaceId } = Route.useParams();
  const { data: categories, isLoading } = useGetCategories(workspaceId);
  const upsert = useUpsertCategories();

  const [items, setItems] = useState<
    { id?: string; name: string; displayOrder: number }[]
  >([]);
  const [initialized, setInitialized] = useState(false);

  if (categories && !initialized) {
    setItems(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: c.displayOrder,
      })),
    );
    setInitialized(true);
  }

  const handleAdd = () => {
    setItems([...items, { name: "", displayOrder: items.length }]);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, name: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], name };
    setItems(updated);
  };

  const handleSave = async () => {
    const valid = items.filter((i) => i.name.trim());
    await upsert.mutateAsync({
      workspaceId,
      categories: valid.map((i, idx) => ({
        id: i.id,
        name: i.name.trim(),
        displayOrder: idx,
      })),
    });
  };

  return (
    <WorkspaceLayout
      title="Survey Categories"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {upsert.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Survey Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the rating categories used in surveys. These will appear
              when creating a new survey.
            </p>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No categories yet. Click "Add Category" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-4"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    value={item.name}
                    onChange={(e) => handleChange(i, e.target.value)}
                    placeholder="Category name (e.g. Experiencia General)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
