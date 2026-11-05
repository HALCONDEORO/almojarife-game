// Shared text cleanup for player-visible names in saves and profiles.
export const MAX_COMPANY = 30;
export const cleanCompany = (s) => String(s ?? "").replace(/[\u0000-\u001f<>&"]/g, "").trim().slice(0, MAX_COMPANY);
