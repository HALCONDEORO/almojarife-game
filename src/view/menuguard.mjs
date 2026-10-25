// Activation guard for the map context menu. The gesture that OPENS the menu
// (right-button release, or lifting the finger after a long-press) ends over
// the freshly opened menu, and its trailing click would activate the first
// item (an unintended sail). Items stay inert until a NEW pointer press;
// keyboard activation (click events with detail 0) always works.
export function createMenuGuard() {
  let armed = false;
  return {
    arm() { armed = true; },
    // eventDetail: MouseEvent.detail of the click (0 for keyboard activation)
    accepts(eventDetail) { return armed || eventDetail === 0; },
  };
}
