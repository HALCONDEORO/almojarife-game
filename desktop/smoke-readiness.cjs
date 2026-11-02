// CDP can attach before the first document has a serializable title snapshot.
// Missing data is not success: only an observed real menu completes readiness.
async function waitForMenuSnapshot(evaluate, { attempts = 90, delay = () => new Promise(resolve => setTimeout(resolve, 1000)) } = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await evaluate();
    if (response?.exceptionDetails) {
      throw new Error(`Packaged menu evaluation failed: ${response.exceptionDetails.text || 'JavaScript exception'}`);
    }
    const raw = response?.result?.value;
    if (typeof raw === 'string') {
      let snapshot;
      try { snapshot = JSON.parse(raw); }
      catch { throw new Error('Packaged menu returned malformed JSON'); }
      if (!snapshot || typeof snapshot !== 'object' || typeof snapshot.start !== 'boolean') {
        throw new Error('Packaged menu returned an invalid snapshot');
      }
      if (snapshot.start) return snapshot;
    } else if (raw !== undefined) {
      throw new Error('Packaged menu returned a non-string snapshot');
    }
    if (attempt + 1 < attempts) await delay();
  }
  throw new Error(`Packaged title menu was not observed after ${attempts} attempts`);
}
module.exports = { waitForMenuSnapshot };
