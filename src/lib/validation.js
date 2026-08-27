import { CATEGORY_VALUES, REPORT_PRIORITIES, STATUS_VALUES } from './constants.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function normalizeEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function isValidObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must contain at least 8 characters.';
  }
  if (password.length > 72) return 'Password must be 72 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

export function validateLocation(location) {
  const coordinates = location?.coordinates;
  const address = cleanText(location?.address, 240);
  if (!Array.isArray(coordinates) || coordinates.length !== 2 || !address) return null;

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;

  return { type: 'Point', coordinates: [longitude, latitude], address };
}

function isAllowedImageUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return false;
  if (value.startsWith('/uploads/')) return /^\/uploads\/[a-f\d-]+\.(jpg|png|webp)$/i.test(value);
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseCitizenReport(input, { partial = false } = {}) {
  const errors = {};
  const report = {};

  if (!partial || input.title !== undefined) {
    report.title = cleanText(input.title, 120);
    if (report.title.length < 5) errors.title = 'Use at least 5 characters.';
  }

  if (!partial || input.description !== undefined) {
    report.description = cleanText(input.description, 2000);
    if (report.description.length < 20) errors.description = 'Describe the issue in at least 20 characters.';
  }

  if (!partial || input.category !== undefined) {
    report.category = cleanText(input.category, 40);
    if (!CATEGORY_VALUES.includes(report.category)) errors.category = 'Choose a valid category.';
  }

  if (!partial || input.location !== undefined) {
    report.location = validateLocation(input.location);
    if (!report.location) errors.location = 'Choose a valid location and address.';
  }

  if (input.images !== undefined) {
    report.images = Array.isArray(input.images)
      ? input.images.filter(isAllowedImageUrl).slice(0, 4)
      : [];
  }

  return { value: report, errors, valid: Object.keys(errors).length === 0 };
}

export function parseAdminReportUpdate(input) {
  const errors = {};
  const update = {};

  if (input.status !== undefined) {
    update.status = cleanText(input.status, 30);
    if (!STATUS_VALUES.includes(update.status)) errors.status = 'Choose a valid status.';
  }
  if (input.priority !== undefined) {
    update.priority = cleanText(input.priority, 20);
    if (!REPORT_PRIORITIES.includes(update.priority)) errors.priority = 'Choose a valid priority.';
  }
  if (input.departmentId !== undefined) {
    if (input.departmentId && !isValidObjectId(input.departmentId)) errors.departmentId = 'Invalid department.';
    update.departmentId = input.departmentId || null;
  }
  if (input.comment !== undefined) update.comment = cleanText(input.comment, 800);
  if (input.resolutionNote !== undefined) update.resolutionNote = cleanText(input.resolutionNote, 1200);

  if (Object.keys(update).length === 0) errors.form = 'No supported changes were provided.';
  return { value: update, errors, valid: Object.keys(errors).length === 0 };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
