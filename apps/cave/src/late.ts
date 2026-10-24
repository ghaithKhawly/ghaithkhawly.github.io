// Late binding for calls that run against the module order.
//
// Modules are evaluated in the order the prototype ran top to bottom, so a module may
// only use earlier modules while it is being set up. When an earlier module needs to call
// a later one at runtime (an input handler opening a panel, say), it goes through `late`,
// which the later module fills in with getters once it has run.
export const late: Record<string, any> = {};
export function provide(exports: object) {
  Object.defineProperties(late, Object.getOwnPropertyDescriptors(exports));
}
