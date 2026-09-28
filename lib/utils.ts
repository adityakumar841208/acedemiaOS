export { cn } from "cn"


const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
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

export interface TimeRemaining {
  text: string;
  isExpired: boolean;
  isUrgent: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getTimeRemaining(deadline: string | Date): TimeRemaining {
  const diff = new Date(deadline).getTime() - Date.now();

  if (Number.isNaN(diff)) {
    return {
      text: "Invalid date",
      isExpired: false,
      isUrgent: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  if (diff <= 0) {
    return {
      text: "Deadline passed",
      isExpired: true,
      isUrgent: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const isUrgent = diff <= 24 * 60 * 60 * 1000;

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

  return {
    text,
    isExpired: false,
    isUrgent,
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Checks whether a user is an authorized Class Representative (CR) for a subject.
 * STRICT CR-ONLY POLICY: Neither Admin, nor Faculty, nor Student has edit rights.
 * Only the CR assigned to the matching department and semester is authorized.
 */
export function isAuthorizedCRForSubject(
  user: { role?: string; department?: string; semester?: number } | null | undefined,
  subject: { departmentId: string; semesterNumber: number }
): boolean {
  if (!user || user.role?.toUpperCase() !== "CR") {
    return false;
  }

  const normalizeDept = (val?: string) =>
    (val || "").toLowerCase().replace(/^(dept-|department-)/, "").trim();

  const userDept = normalizeDept(user.department);
  const subjectDept = normalizeDept(subject.departmentId);

  const deptMatches = !userDept || !subjectDept || userDept === subjectDept;
  const semMatches =
    user.semester === undefined ||
    user.semester === null ||
    Number(user.semester) === Number(subject.semesterNumber);

  return deptMatches && semMatches;
}
