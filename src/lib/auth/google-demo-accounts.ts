// Two fixed demo Google accounts. Real OAuth replaces this in a later phase.
export const DEMO_GOOGLE_ACCOUNTS = [
  { email: "demo+priya@gmail.com", fullName: "Priya Sharma" },
  { email: "demo+anita@gmail.com", fullName: "Anita Iyer" },
] as const;

export type DemoGoogleEmail = (typeof DEMO_GOOGLE_ACCOUNTS)[number]["email"];
