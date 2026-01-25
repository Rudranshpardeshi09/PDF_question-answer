import { Card } from "@/components/ui/card";

export default function SourcesPanel({ sources }) {
  if (!sources?.length) return null;

  return (
    <Card className="mt-2 p-3 bg-background">
      <p className="text-xs font-semibold mb-2">Sources</p>
      {sources.map((s, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          Page {s.page}: {s.text}
        </p>
      ))}
    </Card>
  );
}
