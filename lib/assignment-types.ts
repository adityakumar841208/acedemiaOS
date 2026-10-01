import { AssignmentType } from "@/types";

export const ASSIGNMENT_TYPE_CONFIG: Record<AssignmentType, {
  label: string;
  description: string;
  accept: string;
  allowedFileTypes: string[];
  maxFiles: number;
}> = {
  code: {
    label: "Code",
    description: "Submit source code in the existing editor or upload source files.",
    accept: ".c,.cpp,.h,.hpp,.java,.py,.js,.ts,.jsx,.tsx,.cs,.go,.rs,.zip",
    allowedFileTypes: ["text/plain", "application/zip", "application/x-zip-compressed"],
    maxFiles: 10,
  },
  pdf: {
    label: "PDF",
    description: "Upload one PDF file.",
    accept: ".pdf",
    allowedFileTypes: ["application/pdf"],
    maxFiles: 1,
  },
  document: {
    label: "Document",
    description: "Upload one Word document.",
    accept: ".doc,.docx",
    allowedFileTypes: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxFiles: 1,
  },
  image: {
    label: "Image",
    description: "Upload one image.",
    accept: ".jpg,.jpeg,.png,.webp",
    allowedFileTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFiles: 1,
  },
  video: {
    label: "Video",
    description: "Upload one video.",
    accept: ".mp4,.webm,.mov",
    allowedFileTypes: ["video/mp4", "video/webm", "video/quicktime"],
    maxFiles: 1,
  },
  text: {
    label: "Text / Written Answer",
    description: "Write and submit an answer directly in the LMS.",
    accept: "",
    allowedFileTypes: [],
    maxFiles: 0,
  },
  multiple_files: {
    label: "Multiple Files",
    description: "Upload up to ten non-executable course files.",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.zip,.txt",
    allowedFileTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ],
    maxFiles: 10,
  },
};

export function getAssignmentType(value?: string | null): AssignmentType {
  return value && value in ASSIGNMENT_TYPE_CONFIG ? value as AssignmentType : "code";
}

export function getAssignmentConfig(value?: string | null) {
  return ASSIGNMENT_TYPE_CONFIG[getAssignmentType(value)];
}

export function getFileExtension(name: string) {
  return name.toLowerCase().slice(name.lastIndexOf("."));
}

export function validateFileSignature(file: { name: string; type: string; bytes: Uint8Array }, assignmentType: AssignmentType) {
  const extension = getFileExtension(file.name);
  const config = ASSIGNMENT_TYPE_CONFIG[assignmentType];
  const extensionAllowed = assignmentType === "multiple_files"
    ? config.accept.split(",").includes(extension)
    : config.accept.split(",").includes(extension);

  if (!extensionAllowed) return false;
  const bytes = file.bytes;
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const isPdf = startsWith(0x25, 0x50, 0x44, 0x46);
  const isJpeg = startsWith(0xff, 0xd8, 0xff);
  const isPng = startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const isZip = startsWith(0x50, 0x4b, 0x03, 0x04) || startsWith(0x50, 0x4b, 0x05, 0x06);
  const isLegacyWord = startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  const isWebm = startsWith(0x1a, 0x45, 0xdf, 0xa3);
  const isMp4 = bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  const isText = assignmentType === "code" || extension === ".txt";

  if (extension === ".pdf") return isPdf;
  if ([".jpg", ".jpeg"].includes(extension)) return isJpeg;
  if (extension === ".png") return isPng;
  if (extension === ".webp") return isWebp;
  if (extension === ".docx" || extension === ".zip") return isZip;
  if (extension === ".webm") return isWebm;
  if ([".mp4", ".mov"].includes(extension)) return isMp4;
  if (extension === ".doc") return file.type === "application/msword" && isLegacyWord;
  return isText && !file.type.startsWith("application/x-executable");
}
