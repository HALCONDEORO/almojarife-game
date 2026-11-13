// Shared message classification for inbox retention and presentation.
export const ACTION_KINDS = new Set(["warn", "debt", "loanDue", "loanLate", "loanSeized", "bankrupt", "routeStuck", "halt", "contractAccept", "contractFailed", "order", "rank"]);
export const LOG_KINDS = new Set(["arrival", "routeLeg", "pregon", "alert", "report"]);
const ACTION_TOPICS = new Set(["calamity", "justice"]);
// Arrivals and route sales live in Reports, pregones and price alerts in the Avisos y pregones card, the weekly report in Reports
// (it only shows up here when it carries debt). Calamities and court rulings need the player.
export const msgClass = (m) => ACTION_KINDS.has(m.kind) || (m.kind === "info" && ACTION_TOPICS.has(m.topic)) || (m.kind === "report" && m.debt > 0) ? "action" : LOG_KINDS.has(m.kind) ? "log" : "notice";
