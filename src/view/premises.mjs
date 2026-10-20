// Distinguish the recorded home from a local office desk. No property purchase implied.
export function premises(g, city, lang = "es") {
  const home = g.profile?.home ?? null, isHome = home !== null && city === home;
  const es = lang === "es";
  return { home, isHome, label: isHome ? (es ? "Casa" : "House") : (es ? "Oficina" : "Office"),
    info: isHome ? (es ? "Sede de tu casa mercantil en tu puerto de origen." : "Your trading house headquarters in your home port.") :
      home ? (es ? "Mesa local de gestión. No tienes una oficina propia comprada en este puerto." : "Local management desk. You do not own a purchased office in this port.") :
      (es ? "Esta partida antigua no registra puerto de origen. No se ha asignado una Casa por suposición." : "This older save records no home port. No House has been assigned by guessing.") };
}
