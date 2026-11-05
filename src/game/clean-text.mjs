// Shared text cleanup for player-visible names in saves and profiles.
export const MAX_COMPANY = 30;
export const cleanCompany = (value) => {
  let text = "";
  for (const char of String(value ?? "")) {
    const code = char.codePointAt(0);
    if (code >= 32 && !'<>&"'.includes(char)) text += char;
  }
  return text.trim().slice(0, MAX_COMPANY);
};
