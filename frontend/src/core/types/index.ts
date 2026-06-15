export interface User {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'guest'
  quota_bytes: number
  used_bytes: number
  is_active: boolean
  email_verified: boolean
  oauth_provider: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
  last_login_at: string | null
  totp_enabled: boolean
}

export interface Session {
  id: string
  user_id: string
  device_name: string | null
  device_type: string | null
  ip_address: string | null
  user_agent: string | null
  expires_at: string
  created_at: string
  last_used_at: string
}

export interface ActiveModule {
  module_id: string
  base_url: string
  sidebar_items: SidebarItem[]
  /** URL du bundle UI à charger à l'exécution (null si le module n'a pas d'UI). */
  frontend_entry?: string | null
  registered_at: string
  last_heartbeat: string
}

export interface SidebarItem {
  id: string
  label: string
  icon: string
  path: string
  position: number
  badge?: number
  section?: 'main' | 'secondary'
  protected_folder?: string
}

export interface ApiToken {
  id: string
  user_id: string
  name: string
  expires_at: string | null
  created_at: string
  last_used_at: string | null
}

export interface AppError {
  message: string
  code: string
}

export interface UserGroup {
  id: string
  name: string
  description: string | null
  permissions: string[]
  is_default: boolean
  is_system?: boolean
  member_count?: number
  created_at: string
  updated_at: string
}

export interface PublicConfig {
  'instance.name'?: string
  'instance.description'?: string
  'instance.logo_url'?: string | null
  'instance.color_primary'?: string
  'auth.registration_open'?: boolean
  'auth.oauth_google_enabled'?: boolean
  'auth.oauth_github_enabled'?: boolean
  'auth.api_token_allowed_roles'?: string[]
}
