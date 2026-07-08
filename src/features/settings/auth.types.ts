export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export interface RemoteScheduleSync {
  uploadLocalSchedule(scheduleId: string): Promise<void>
  downloadRemoteSchedule(userId: string): Promise<void>
}
