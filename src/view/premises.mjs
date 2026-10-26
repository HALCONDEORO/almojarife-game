// Distinguish the recorded home from a local office desk. No property purchase implied.
export function premises(g, city, lang = "es", ownsOffice = false) {
  const home = g.profile.home, isHome = city === home;
  const es = lang === "es";
  return { home, isHome, label: isHome ? (es ? "Casa" : "House") : (es ? "Oficina" : "Office"),
    info: isHome ? (es ? "Sede de tu casa mercantil en tu puerto de origen." : "Your trading house headquarters in your home port.") :
      ownsOffice ? (es ? "Mesa local de gestión. Tienes una oficina comercial en este puerto." : "Local management desk. You own a trading office in this port.") :
      (es ? "Mesa local de gestión. No tienes una oficina propia comprada en este puerto." : "Local management desk. You do not own a purchased office in this port.") };
}
