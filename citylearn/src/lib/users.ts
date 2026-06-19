import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string;
  department?: string;
  role?: string;
  country?: string;
  state?: string;
  city?: string;
  createdAt: string;
}

interface UsersData {
  users: StoredUser[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureUsersFile(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(USERS_FILE)) {
    const initial: UsersData = { users: [] };
    writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function readUsersData(): UsersData {
  ensureUsersFile();
  const raw = readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(raw) as UsersData;
}

function writeUsersData(data: UsersData): void {
  ensureUsersFile();
  writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, passwordSalt, 64).toString("hex");
  return { hash, salt: passwordSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const storedBuffer = Buffer.from(storedHash, "hex");
  const hashBuffer = Buffer.from(hash, "hex");
  if (storedBuffer.length !== hashBuffer.length) {
    return false;
  }
  return timingSafeEqual(storedBuffer, hashBuffer);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = normalizeEmail(email);
  return readUsersData().users.find((user) => user.email === normalized);
}

export function createUser(user: Omit<StoredUser, "id" | "createdAt" | "passwordHash" | "passwordSalt"> & { password: string }): StoredUser {
  const data = readUsersData();
  const normalizedEmail = normalizeEmail(user.email);

  if (data.users.some((existing) => existing.email === normalizedEmail)) {
    throw new Error("EMAIL_EXISTS");
  }

  const { hash, salt } = hashPassword(user.password);
  const newUser: StoredUser = {
    id: createHash("sha256").update(`${normalizedEmail}-${Date.now()}`).digest("hex").slice(0, 16),
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    name: user.name.trim(),
    department: user.department,
    role: user.role,
    country: user.country,
    state: user.state,
    city: user.city,
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  writeUsersData(data);
  return newUser;
}

export function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    department: user.department,
    role: user.role,
    country: user.country,
    state: user.state,
    city: user.city,
    createdAt: user.createdAt,
  };
}
