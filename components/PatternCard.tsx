import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PatternCardProps = {
  observation: string;
  tip: string;
};

export function PatternCard({ observation, tip }: PatternCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pattern Inspire noticed</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base text-slate-800">{observation}</p>
        <p className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-base text-slate-900">
          <span className="font-semibold text-accent">Try this next:</span> {tip}
        </p>
      </CardContent>
    </Card>
  );
}
