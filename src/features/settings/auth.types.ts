export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>
  signInWithPassword(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

export interface RemoteScheduleSync {
  uploadLocalSchedule(scheduleId: string): Promise<void>
  downloadRemoteSchedule(userId: string): Promise<void>
}
