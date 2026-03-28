export const MAX_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 10000;
export const MAX_SLUG_LENGTH = 100;
export const MAX_COLOR_LENGTH = 7; // #RRGGBB

export const AVATAR_MAX_SIZE_MB = 2;
export const LOGO_MAX_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_WORKSPACE_MEMBERS = 100;
export const MAX_PROJECTS_PER_WORKSPACE = 50;
export const MAX_TASKS_PER_PROJECT = 1000;
export const MAX_STEPS_PER_TASK = 50;
export const MAX_LABELS_PER_WORKSPACE = 100;
export const MAX_LABELS_PER_TASK = 10;

export const MAX_LOGIN_ATTEMPTS_DEFAULT = 5;
export const ACCOUNT_LOCK_DURATION_MINUTES_DEFAULT = 30;

export const MAX_NOTIFICATION_RETRY_ATTEMPTS = 3;
