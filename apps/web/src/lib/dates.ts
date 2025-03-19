export function formatDate(date: Date) {
  return new Date(date).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
