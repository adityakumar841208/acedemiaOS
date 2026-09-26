export { cn } from "cn"


export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (Number.isNaN(past.getTime())) return "Invalid date";

  const units = [
    { seconds: 31536000, label: "year" },
    { seconds: 2592000, label: "month" },
    { seconds: 604800, label: "week" },
    { seconds: 86400, label: "day" },
    { seconds: 3600, label: "hour" },
    { seconds: 60, label: "minute" },
  ];

  if (Math.abs(diffInSeconds) < 60) return "just now";

  for (const unit of units) {
    const value = Math.floor(Math.abs(diffInSeconds) / unit.seconds);

    if (value >= 1) {
      const suffix = value === 1 ? "" : "s";
      return diffInSeconds >= 0
        ? `${value} ${unit.label}${suffix} ago`
        : `in ${value} ${unit.label}${suffix}`;
    }
  }

  return "just now";
}

export function getTimeRemaining(deadline: string | Date) {
  const diff = new Date(deadline).getTime() - Date.now();

  if (Number.isNaN(diff)) {
    return { text: "Invalid date", isExpired: false };
  }

  if (diff <= 0) {
    return { text: "Deadline passed", isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let text = "";

  if (days > 0) {
    text = `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    text = `${minutes}m ${seconds}s remaining`;
  } else {
    text = `${seconds}s remaining`;
  }

  return { text, isExpired: false };
}