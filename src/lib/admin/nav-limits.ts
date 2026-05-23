// Hard cap on total nav items (top-level + children) so the header stays
// usable and admins are forced to be intentional about what shows.
// Lives outside the "use server" action file because Next.js only allows
// async function exports from server-action modules.
export const MAX_NAV_ITEMS = 6;
