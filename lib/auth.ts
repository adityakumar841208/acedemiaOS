import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import User, { RoleType, StatusType } from "@/models/User";
import connectToDatabase from "@/lib/db";

export const COOKIE_NAME = "lms_token";
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  status: StatusType;
  department: string;
  semester?: number;
  rollNumber?: string;
}

export interface UserJWTPayload extends SafeUser {
  iat?: number;
  exp?: number;
}

/**
 * Hashes a plaintext password securely with bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a signed JWT session token valid for 7 days
 */
export async function createSessionToken(user: SafeUser): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    semester: user.semester,
    rollNumber: user.rollNumber,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

/**
 * Verifies a JWT session token and returns the decoded payload
 */
export async function verifySessionToken(token: string): Promise<UserJWTPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as UserJWTPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current authenticated user from HTTP-only cookie
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) return null;

    await connectToDatabase();
    const databaseUser = await User.findById(payload.id).lean();
    if (!databaseUser || (databaseUser.status && databaseUser.status !== "ACTIVE")) return null;

    return {
      id: databaseUser._id.toString(),
      name: databaseUser.name,
      email: databaseUser.email,
      role: databaseUser.role,
      status: databaseUser.status || "ACTIVE",
      department: databaseUser.department,
      semester: databaseUser.semester,
      rollNumber: databaseUser.rollNumber,
    };
  } catch {
    return null;
  }
}

/**
 * Enforces that the user is authenticated. Throws an Error if unauthenticated.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    const error: any = new Error("Authentication required. Please log in.");
    error.status = 401;
    throw error;
  }
  return user;
}

/**
 * Enforces that the user has one of the allowed roles.
 */
export async function requireRole(allowedRoles: RoleType | RoleType[]): Promise<SafeUser> {
  const user = await requireAuth();
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(user.role)) {
    const error: any = new Error(`Forbidden: Access requires role ${rolesArray.join(" or ")}`);
    error.status = 403;
    throw error;
  }
  return user;
}

/**
 * Cookie configuration options for HTTP-only session
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

