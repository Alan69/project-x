// Utility function to format dates consistently as day-month-year
export const formatDate = (date: string | Date): string => {
  if (!date) return "Not set";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";

  // Format as day-month-year (DD/MM/YYYY)
  return dateObj.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Utility function to format date range
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date
): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};
