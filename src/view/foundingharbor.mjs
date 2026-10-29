const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Decorative composition of existing game assets, never a new map or a claim
// about the selected port's real architecture.
export function foundingHarbor(home, lang = 'es') {
  const es = lang === 'es';
  return `<figure class="founding-harbor"><div class="founding-scene" aria-hidden="true"><div class="founding-sea"></div><img class="founding-quay" src="city2d/assets/muelle.webp" alt=""><img class="founding-store" src="city2d/assets/warehouse-1.webp" alt=""><img class="founding-house" src="city2d/assets/house_rich-1.webp" alt=""><img class="founding-ship" src="city2d/assets/barco.webp" alt=""></div><figcaption><small>${es ? 'Puerto de origen' : 'Home port'}</small><strong>${esc(home)}</strong></figcaption></figure>`;
}
