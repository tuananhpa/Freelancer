export type Role = 'ADMIN' | 'TEACHER' | 'TEACHING_ASSISTANT' | 'STUDENT' | 'OFFICE';
export const ROLES: Role[] = ['ADMIN', 'TEACHER', 'TEACHING_ASSISTANT', 'STUDENT', 'OFFICE'];
export const STAFF: Role[] = ['ADMIN', 'TEACHER', 'TEACHING_ASSISTANT'];

export interface UserRow {
  id: string;
  email: string;
  password: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  auth_provider: string;
  created_at: string | null;
  updated_at: string | null;
  last_active_at: string | null;
  pending_student_code: string | null;
  username: string | null;
  must_change_password: number;
  student_code?: string | null;
}

export interface Bindings {
  DB: D1Database;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  SESSIONS?: KVNamespace;
  REALTIME?: DurableObjectNamespace;
  ASSETS?: Fetcher;
  JWT_SECRET: string;
  AI_KEY_ENCRYPTION_KEY: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  FRONTEND_URL?: string;
  CORS_ALLOWED_ORIGINS?: string;
}

export type AppEnv = { Bindings: Bindings; Variables: { user: UserRow; token: string } };
