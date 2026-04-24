export const MOCK_ISSUES = [
  { id: "mock-iss-1", title: "Flood victims need rescue", address: "Riverside, Demo City", category: "rescue", urgency: "critical", status: "open", lat: 26.85, lng: 75.76, created_at: new Date(Date.now() - 3600000).toISOString(), reported_by: "mock-admin-id-1234" },
  { id: "mock-iss-2", title: "Medical supplies shortage", address: "Central Hospital", category: "medical", urgency: "high", status: "open", lat: 26.9, lng: 75.78, created_at: new Date(Date.now() - 7200000).toISOString(), reported_by: "mock-admin-id-1234" },
  { id: "mock-iss-3", title: "Food distribution needed", address: "Community Hall", category: "food", urgency: "medium", status: "assigned", assigned_to: "mock-vol-id-1234", lat: 26.78, lng: 75.83, created_at: new Date(Date.now() - 14400000).toISOString(), reported_by: "mock-admin-id-1234", volunteer_profiles: { name: "Demo Volunteer", city: "Demo City" } },
];

export const MOCK_VOLUNTEERS = [
  { id: "mock-vol-id-1234", name: "Demo Volunteer", email: "volunteer@demo.volunteerbridge.in", skills: ["Medical Aid", "Teaching", "Rescue Operations"], city: "Demo City", trust_score: 95, avg_rating: 4.8, total_ratings: 12, tasks_completed: 15, verified: true, verification_status: "approved", lat: 26.8, lng: 75.8, created_at: new Date().toISOString() },
  { id: "mock-v-2", name: "Mike Johnson", email: "mike@example.com", skills: ["Logistics", "Food Distribution"], city: "Demo City", trust_score: 88, avg_rating: 4.5, total_ratings: 8, tasks_completed: 10, verified: true, lat: 26.82, lng: 75.82 },
  { id: "mock-v-3", name: "Priya Sharma", email: "priya@example.com", skills: ["Counseling", "Translation"], city: "Demo City", trust_score: 0, avg_rating: 0, total_ratings: 0, tasks_completed: 0, verified: false, verification_status: "submitted", doc_url: "https://example.com/doc.pdf", created_at: new Date().toISOString() },
];

export const MOCK_ASSIGNMENTS = [
  { id: "mock-assign-1", issue_id: "mock-iss-3", volunteer_id: "mock-vol-id-1234", status: "pending", created_at: new Date().toISOString(), issues: MOCK_ISSUES[2] }
];

const mockBuilder = (dataResult) => {
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: async () => ({ data: Array.isArray(dataResult) ? dataResult[0] : dataResult, error: null }),
    maybeSingle: async () => ({ data: Array.isArray(dataResult) ? dataResult[0] : dataResult, error: null }),
    not: () => chain,
    in: () => chain,
    then: (resolve) => resolve({ data: dataResult, error: null })
  };
  return chain;
};

export const mockSupabase = {
  from: (table) => {
    if (table === "issues") return mockBuilder(MOCK_ISSUES);
    if (table === "volunteer_profiles") return mockBuilder(MOCK_VOLUNTEERS);
    if (table === "task_assignments") return mockBuilder(MOCK_ASSIGNMENTS);
    if (table === "notifications") return mockBuilder([]);
    return mockBuilder([]);
  },
  rpc: async (fnName, params) => {
    if (fnName === "smart_match_volunteers") {
      return {
        data: [
          { volunteer_id: "mock-vol-id-1234", name: "Demo Volunteer", skill_match: true, distance_km: 1.2, trust_score: 95, match_score: 94, skills: ["Medical Aid", "Teaching"] },
          { volunteer_id: "mock-v-2", name: "Mike Johnson", skill_match: false, distance_km: 3.5, trust_score: 88, match_score: 76, skills: ["Logistics", "Food Distribution"] }
        ],
        error: null
      };
    }
    return { data: null, error: null };
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({})
  }),
  removeChannel: () => {},
};
