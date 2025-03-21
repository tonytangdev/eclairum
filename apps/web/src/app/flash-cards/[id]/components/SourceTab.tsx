import { Card, CardContent } from "@/components/ui/card"

interface SourceTabProps {
  textContent: string;
}

export function SourceTab({ textContent }: SourceTabProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-lg font-medium mb-2">Source Text</h3>
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </CardContent>
    </Card>
  )
}
