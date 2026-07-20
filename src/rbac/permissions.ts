export const USER_ROLE = {
  CITIZEN: "citizen",
  ASHA_WORKER: "asha_worker",
  DOCTOR: "doctor",
  ADMIN: "admin",
} as const;

export const USER_ROLES = [
  USER_ROLE.CITIZEN,
  USER_ROLE.ASHA_WORKER,
  USER_ROLE.DOCTOR,
  USER_ROLE.ADMIN,
] as const;

export const SIGNUP_USER_ROLES = [
  USER_ROLE.CITIZEN,
  USER_ROLE.ASHA_WORKER,
  USER_ROLE.DOCTOR,
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type SignupUserRole = (typeof SIGNUP_USER_ROLES)[number];

export const USER_STATUS = {
  ACTIVE: "active",
  PENDING_VERIFICATION: "pending_verification",
  DISABLED: "disabled",
} as const;

export const USER_STATUSES = [
  USER_STATUS.ACTIVE,
  USER_STATUS.PENDING_VERIFICATION,
  USER_STATUS.DISABLED,
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const PERMISSION = {
  ASSISTANT_USE: "assistant.use",
  MEDICATIONS_MANAGE: "medications.manage",
  RECORDS_READ: "records.read",
  RECORDS_UPLOAD: "records.upload",
  RECORDS_SHARE: "records.share",
  FAMILY_MANAGE: "family.manage",
  EMERGENCY_USE: "emergency.use",
  HOSPITALS_NEARBY: "hospitals.nearby",
  ENVIRONMENT_VIEW: "environment.view",
  DASHBOARD_PERSONAL_VIEW: "dashboard.personal.view",
  DASHBOARD_ASHA_VIEW: "dashboard.asha.view",
  QR_SCAN_PATIENT: "qr.scan_patient",
  OBSERVATIONS_CREATE: "observations.create",
  DASHBOARD_DOCTOR_VIEW: "dashboard.doctor.view",
  RECORDS_READ_AUTHORIZED: "records.read_authorized",
  PRESCRIPTIONS_UPLOAD: "prescriptions.upload",
  DIAGNOSES_ADD: "diagnoses.add",
  CLINICAL_NOTES_ADD: "clinical_notes.add",
  AI_SUMMARIES_VIEW: "ai_summaries.view",
  DASHBOARD_ADMIN_VIEW: "dashboard.admin.view",
  ANALYTICS_VIEW: "analytics.view",
  WORKERS_MANAGE: "workers.manage",
  RESOURCES_ALLOCATE: "resources.allocate",
  OUTBREAKS_MONITOR: "outbreaks.monitor",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const DEFAULT_ROLE = USER_ROLE.CITIZEN;
export const DEFAULT_USER_STATUS = USER_STATUS.ACTIVE;

const CITIZEN_PERMISSIONS = [
  PERMISSION.ASSISTANT_USE,
  PERMISSION.MEDICATIONS_MANAGE,
  PERMISSION.RECORDS_READ,
  PERMISSION.RECORDS_UPLOAD,
  PERMISSION.RECORDS_SHARE,
  PERMISSION.FAMILY_MANAGE,
  PERMISSION.EMERGENCY_USE,
  PERMISSION.HOSPITALS_NEARBY,
  PERMISSION.ENVIRONMENT_VIEW,
  PERMISSION.DASHBOARD_PERSONAL_VIEW,
] as const satisfies readonly Permission[];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLE.CITIZEN]: [...CITIZEN_PERMISSIONS],
  [USER_ROLE.ASHA_WORKER]: [
    ...CITIZEN_PERMISSIONS,
    PERMISSION.DASHBOARD_ASHA_VIEW,
    PERMISSION.QR_SCAN_PATIENT,
    PERMISSION.OBSERVATIONS_CREATE,
  ],
  [USER_ROLE.DOCTOR]: [
    ...CITIZEN_PERMISSIONS,
    PERMISSION.DASHBOARD_DOCTOR_VIEW,
    PERMISSION.RECORDS_READ_AUTHORIZED,
    PERMISSION.PRESCRIPTIONS_UPLOAD,
    PERMISSION.DIAGNOSES_ADD,
    PERMISSION.CLINICAL_NOTES_ADD,
    PERMISSION.AI_SUMMARIES_VIEW,
  ],
  [USER_ROLE.ADMIN]: [
    ...CITIZEN_PERMISSIONS,
    PERMISSION.DASHBOARD_ADMIN_VIEW,
    PERMISSION.ANALYTICS_VIEW,
    PERMISSION.WORKERS_MANAGE,
    PERMISSION.RESOURCES_ALLOCATE,
    PERMISSION.OUTBREAKS_MONITOR,
  ],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function normalizeRole(value: unknown): UserRole {
  return isUserRole(value) ? value : DEFAULT_ROLE;
}

export function isSignupUserRole(value: unknown): value is SignupUserRole {
  return typeof value === "string" && SIGNUP_USER_ROLES.includes(value as SignupUserRole);
}

export function normalizeSignupRole(value: unknown): SignupUserRole {
  return isSignupUserRole(value) ? value : DEFAULT_ROLE;
}

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && USER_STATUSES.includes(value as UserStatus);
}

export function normalizeStatus(value: unknown): UserStatus {
  return isUserStatus(value) ? value : DEFAULT_USER_STATUS;
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  roleOrPermissions: UserRole | Permission[] | null | undefined,
  permission: Permission
): boolean {
  if (!roleOrPermissions) return false;

  const permissions = Array.isArray(roleOrPermissions)
    ? roleOrPermissions
    : getPermissionsForRole(roleOrPermissions);

  return permissions.includes(permission);
}
