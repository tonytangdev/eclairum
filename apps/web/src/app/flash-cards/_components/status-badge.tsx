interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusMap: Record<string, { label: string, className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
    IN_PROGRESS: { label: "Processing", className: "bg-blue-100 text-blue-800" }
  };

  const { label, className } = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
