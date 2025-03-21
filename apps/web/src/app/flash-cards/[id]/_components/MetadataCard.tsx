import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Tag } from "lucide-react"
import { formatDate } from "@/lib/dates"

interface MetadataCardProps {
  createdAt: Date;
  category?: string;
}

export function MetadataCard({ createdAt, category }: MetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-2 font-medium min-w-[120px]">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Created
            </dt>
            <dd>{formatDate(createdAt)}</dd>
          </div>

          <div className="flex items-start gap-2">
            <dt className="flex items-center gap-2 font-medium min-w-[120px]">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Category
            </dt>
            <dd>{category || "No category"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
