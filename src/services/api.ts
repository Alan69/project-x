import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// NocoDB API configuration
const NOCODB_BASE_URL = "http://localhost:8080";
const NOCODB_API_TOKEN = "irgoNvr19kYwti4DgHXCViGXPA2yc449fdEdZh5u";

// NocoDB table IDs (from your instance)
const TABLE_IDS: Record<string, string> = {
  users: "m3h0p1bnzzmkf80",
  self_assessments: "m96rhthmgvhbhxb", // Updated with actual table ID
  peer_reviewers: "m2is344y6e4r4j0", // peer_reviewers table
  manager_reviews: "mrun5023tfi4xmz",
  review_cycles: "myqufo0qnuozmrh",
  grade_expectations: "mgo30y1lc2njs09",
  review_committees: "m8gxiqznx6h7mn8",
  committee_decisions: "mic22in74kd0b2x",
  committee_members: "mo8onozw9pwjf30",
  notifications: "mi3t4fzv4xpqv6k", // review_notifications table
};

// NocoDB view IDs (from your instance)
const VIEW_IDS: Record<string, string> = {
  users: "vw6pbzs0npnd44ad",
  self_assessments: "vwfnzkjpmyqq6zby",
  peer_reviewers: "vw3baguy9ckbwmhw", // peer_reviewers view
  manager_reviews: "vwhoyo56yc16yb89",
  review_cycles: "vwmmc4dl1jkcbe61",
  grade_expectations: "vwh4ysu4yyaz6t3e",
  review_committees: "vwi82jgdbyrapcbo",
  committee_decisions: "vwj81agp3xhuipmh",
  committee_members: "vwzncbiujisir3g1",
  notifications: "vwb0enctumzdau2v", // review_notifications view
};

// Helper function to get NocoDB table endpoint
const getTableEndpoint = (tableName: string): string =>
  `${NOCODB_BASE_URL}/api/v2/tables/${
    TABLE_IDS[tableName] || tableName
  }/records`;

// Helper function to get NocoDB view endpoint
const getViewEndpoint = (tableName: string): string =>
  `${NOCODB_BASE_URL}/api/v2/tables/${
    TABLE_IDS[tableName] || tableName
  }/records?viewId=${VIEW_IDS[tableName] || "default"}`;

export const performanceReviewApi = createApi({
  reducerPath: "performanceReviewApi",
  baseQuery: fetchBaseQuery({
    baseUrl: NOCODB_BASE_URL,
    prepareHeaders: (headers: Headers) => {
      headers.set("xc-token", NOCODB_API_TOKEN);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "User",
    "SelfAssessment",
    "PeerReview",
    "ManagerReview",
    "ReviewCycle",
    "GradeExpectation",
    "ReviewCommittee",
    "CommitteeDecision",
    "Notification",
  ],
  endpoints: (builder) => ({
    // Authentication endpoints - using users table
    login: builder.mutation<
      { token: string; user: any },
      { email: string; password: string }
    >({
      query: (credentials: { email: string; password: string }) => ({
        url: getViewEndpoint("users"),
        method: "GET",
        params: {
          where: `(email,eq,${credentials.email})`,
          limit: 1,
        },
      }),
      // Transform the response to check password and return user data
      transformResponse: (response: any, meta, arg) => {
        const users = response?.list || [];
        if (users.length === 0) {
          throw new Error("User not found");
        }

        const user = users[0];
        // In a real app, you'd hash and compare passwords
        // For now, we'll do a simple comparison
        if (user.password !== arg.password) {
          throw new Error("Invalid password");
        }

        // Generate a simple token (in production, use proper JWT)
        const token = `user-${user.id}-${Date.now()}`;

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            position: user.position,
            department: user.department,
            currentGrade: user.currentGrade,
            managerId: user.managerId,
            hireDate: user.hireDate,
          },
        };
      },
    }),

    getCurrentUser: builder.query<any, void>({
      query: () => getViewEndpoint("users"),
      // This will be handled by the auth slice using stored user data
      transformResponse: (response: any) => {
        // Return the first user for demo purposes
        // In real app, you'd use the stored user ID from auth state
        return response?.list?.[0] || null;
      },
    }),

    // User management endpoints
    getUsers: builder.query<any[], void>({
      query: () => getViewEndpoint("users"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["User"],
    }),

    getUserById: builder.query<any, string>({
      query: (id: string) => `${getTableEndpoint("users")}?where=(id,eq,${id})`,
      transformResponse: (response: any) => response?.list?.[0] || null,
      providesTags: ["User"],
    }),

    // Self Assessment endpoints
    getSelfAssessments: builder.query<any[], void>({
      query: () => getTableEndpoint("self_assessments"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["SelfAssessment"],
    }),

    getSelfAssessmentById: builder.query<any, string>({
      query: (id: string) =>
        `${getTableEndpoint("self_assessments")}?where=(id,eq,${id})`,
      transformResponse: (response: any) => response?.list?.[0] || null,
      providesTags: ["SelfAssessment"],
    }),

    createSelfAssessment: builder.mutation<any, any>({
      query: (assessment) => {
        const url = getTableEndpoint("self_assessments");
        console.log("=== CREATE SELF ASSESSMENT DEBUG ===");
        console.log(
          "Table ID for self_assessments:",
          TABLE_IDS["self_assessments"]
        );
        console.log("Generated URL:", url);
        console.log("Assessment data:", assessment);
        console.log(
          "Note: Using NocoDB relationship format for employees and review_cycles"
        );

        // NocoDB expects relationships in this format:
        // employees: [1] (array of employee IDs)
        // review_cycles: [1] (array of review cycle IDs)
        const cleanData = {
          achievements: assessment.achievements,
          achievements_category: assessment.achievements_category,
          self_evaluation: assessment.self_evaluation,
          current_grade: assessment.current_grade,
          target_grade: assessment.target_grade,
          status: assessment.status,
          submitted_at: assessment.submitted_at,
          created_at: assessment.created_at,
          updated_at: assessment.updated_at,
          // NocoDB relationship format
          employees: assessment.employee_id
            ? [parseInt(assessment.employee_id)]
            : [],
          review_cycles: assessment.review_cycle_id
            ? [parseInt(assessment.review_cycle_id)]
            : [],
        };

        console.log(
          "Final data being sent (with NocoDB relationships):",
          cleanData
        );

        return {
          url,
          method: "POST",
          body: cleanData,
        };
      },
      invalidatesTags: ["SelfAssessment"],
    }),

    deleteSelfAssessment: builder.mutation<any, string>({
      query: (id) => ({
        url: `${getTableEndpoint("self_assessments")}?where=(id,eq,${id})`,
        method: "DELETE",
      }),
      invalidatesTags: ["SelfAssessment"],
    }),

    updateSelfAssessment: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }: { id: string; data: any }) => {
        // NocoDB v2 API expects updates using where clause, not path-based ID
        const url = `${getTableEndpoint(
          "self_assessments"
        )}?where=(id,eq,${id})`;
        console.log("=== UPDATE SELF ASSESSMENT DEBUG ===");
        console.log("ID received:", id);
        console.log("Data received:", data);
        console.log("Full URL constructed:", url);
        console.log(
          "getTableEndpoint result:",
          getTableEndpoint("self_assessments")
        );
        return {
          url,
          method: "PATCH",
          body: { ...data, id: id }, // Include ID in the body as well
        };
      },
      invalidatesTags: ["SelfAssessment"],
    }),

    submitSelfAssessment: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `${getTableEndpoint("self_assessments")}?where=(id,eq,${id})`,
        method: "PATCH",
        body: { ...data, status: "submitted", id: id }, // Include ID in the body
      }),
      invalidatesTags: ["SelfAssessment"],
    }),

    // Peer Review endpoints
    getPeerReviews: builder.query<any[], void>({
      query: () => getTableEndpoint("peer_reviewers"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["PeerReview"],
    }),

    submitPeerReview: builder.mutation<any, any>({
      query: (review) => {
        const url = getTableEndpoint("peer_reviewers");
        // Map peer review data to peer_reviewers table structure
        const cleanData = {
          // Required fields
          review_order: review.review_order || 1, // Required NOT NULL field
          // Use NocoDB relationship format to avoid system column errors
          users: review.peer_reviewer_id
            ? [parseInt(review.peer_reviewer_id)]
            : [],
          self_assessments: review.self_assessment_id
            ? [parseInt(review.self_assessment_id)]
            : [],
          // Optional fields that match the database schema
          status: review.status || "confirmed",
          feedback: review.feedback || "",
          review_date: review.review_date || new Date().toISOString(),
          created_at: review.created_at || new Date().toISOString(),
        };

        console.log("=== SUBMIT PEER REVIEW DEBUG ===");
        console.log("Original review data:", review);
        console.log("Clean data being sent:", cleanData);
        console.log("URL:", url);

        return {
          url,
          method: "POST",
          body: cleanData,
        };
      },
      invalidatesTags: ["PeerReview", "SelfAssessment"],
    }),

    // Manager Review endpoints
    getManagerReview: builder.query<any, string>({
      query: (assessmentId: string) =>
        `${getTableEndpoint(
          "manager_reviews"
        )}?where=(self_assessment_id,eq,${assessmentId})`,
      transformResponse: (response: any) => response?.list?.[0] || null,
      providesTags: ["ManagerReview"],
    }),

    getManagerReviews: builder.query<any[], void>({
      query: () => getTableEndpoint("manager_reviews"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["ManagerReview"],
    }),

    submitManagerReview: builder.mutation<any, any>({
      query: (review) => {
        const url = getTableEndpoint("manager_reviews");
        // NocoDB expects relationships in this format:
        // managers: [ID] (array of manager IDs)
        // self_assessments: [ID] (array of self_assessment IDs)
        const cleanData = {
          comments: review.comments,
          feedback: review.feedback,
          recommended_grade: review.recommended_grade,
          status: review.status,
          created_at: review.created_at,
          updated_at: review.updated_at,
          // NocoDB relationship format
          managers: review.manager_id ? [parseInt(review.manager_id)] : [],
          self_assessments: review.self_assessment_id
            ? [parseInt(review.self_assessment_id)]
            : [],
        };

        return {
          url,
          method: "POST",
          body: cleanData,
        };
      },
      invalidatesTags: ["ManagerReview", "SelfAssessment"],
    }),

    // Review Cycle endpoints
    getReviewCycles: builder.query<any[], void>({
      query: () => getTableEndpoint("review_cycles"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["ReviewCycle"],
    }),

    createReviewCycle: builder.mutation<any, any>({
      query: (cycle) => ({
        url: getTableEndpoint("review_cycles"),
        method: "POST",
        body: cycle,
      }),
      invalidatesTags: ["ReviewCycle"],
    }),

    // Grade Expectation endpoints
    getGradeExpectations: builder.query<any[], void>({
      query: () => getTableEndpoint("grade_expectations"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["GradeExpectation"],
    }),

    // Review Committee endpoints
    getReviewCommittees: builder.query<any[], void>({
      query: () => getTableEndpoint("review_committees"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["ReviewCommittee"],
    }),

    createReviewCommittee: builder.mutation<any, any>({
      query: (committee) => ({
        url: getTableEndpoint("review_committees"),
        method: "POST",
        body: committee,
      }),
      invalidatesTags: ["ReviewCommittee"],
    }),

    // Committee Decision endpoints
    getCommitteeDecisions: builder.query<any[], void>({
      query: () => getTableEndpoint("committee_decisions"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["CommitteeDecision"],
    }),

    createCommitteeDecision: builder.mutation<any, any>({
      query: (decision) => ({
        url: getTableEndpoint("committee_decisions"),
        method: "POST",
        body: decision,
      }),
      invalidatesTags: ["CommitteeDecision"],
    }),

    submitCommitteeDecision: builder.mutation<any, any>({
      query: (decision) => {
        const url = getTableEndpoint("committee_decisions");
        // NocoDB expects relationships in this format:
        // self_assessments: [ID] (array of self_assessment IDs)
        // committee_members: [ID] (array of committee member IDs)
        const cleanData = {
          decision: decision.decision || "",
          decision_date: decision.decision_date || new Date().toISOString(),
          final_grade: decision.final_grade || "",
          comments: decision.comments || "",
          recommendations: decision.recommendations || "",
          created_at: decision.created_at || new Date().toISOString(),
          updated_at: decision.updated_at || new Date().toISOString(),
          // NocoDB relationship format - only use array format to avoid system column error
          // NocoDB treats direct ID fields as system columns, so only use relationship arrays
          self_assessments:
            decision.self_assessment_id &&
            !isNaN(parseInt(decision.self_assessment_id))
              ? [parseInt(decision.self_assessment_id)]
              : [],
          committee_members:
            decision.committee_id && !isNaN(parseInt(decision.committee_id))
              ? [parseInt(decision.committee_id)]
              : [],
          // Add any other required fields that might be missing
          is_active: true,
          status: "completed",
        };

        console.log("=== SUBMIT COMMITTEE DECISION DEBUG ===");
        console.log("Original decision data:", decision);
        console.log("Clean data being sent:", cleanData);
        console.log("URL:", url);

        return {
          url,
          method: "POST",
          body: cleanData,
        };
      },
      invalidatesTags: ["CommitteeDecision", "SelfAssessment"],
    }),

    // Notification endpoints
    getNotifications: builder.query<any[], void>({
      query: () => getTableEndpoint("notifications"),
      transformResponse: (response: any) => response?.list || [],
      providesTags: ["Notification"],
    }),

    createNotification: builder.mutation<any, any>({
      query: (notification) => ({
        url: getTableEndpoint("notifications"),
        method: "POST",
        body: notification,
      }),
      invalidatesTags: ["Notification"],
    }),

    markNotificationAsRead: builder.mutation<any, string>({
      query: (id: string) => ({
        url: `${getTableEndpoint("notifications")}?where=(id,eq,${id})`,
        method: "PATCH",
        body: { is_read: true },
      }),
      invalidatesTags: ["Notification"],
    }),

    // Email notification endpoint
    sendEmailNotification: builder.mutation<
      any,
      { to: string; subject: string; body: string }
    >({
      query: (emailData: { to: string; subject: string; body: string }) => ({
        url: "/api/v2/notifications/email",
        method: "POST",
        body: emailData,
      }),
    }),
  }),
});

export const {
  // Auth
  useLoginMutation,
  useGetCurrentUserQuery,
  useGetUsersQuery,

  // Self Assessment
  useGetSelfAssessmentsQuery,
  useCreateSelfAssessmentMutation,
  useUpdateSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
  useDeleteSelfAssessmentMutation,

  // Peer Review
  useGetPeerReviewsQuery,
  useSubmitPeerReviewMutation,

  // Manager Review
  useGetManagerReviewQuery,
  useGetManagerReviewsQuery,
  useSubmitManagerReviewMutation,

  // Review Cycle
  useGetReviewCyclesQuery,
  useCreateReviewCycleMutation,

  // Grade Expectations
  useGetGradeExpectationsQuery,

  // Review Committee
  useGetReviewCommitteesQuery,
  useCreateReviewCommitteeMutation,

  // Committee Decisions
  useGetCommitteeDecisionsQuery,
  useCreateCommitteeDecisionMutation,
  useSubmitCommitteeDecisionMutation,

  // Notifications
  useGetNotificationsQuery,
  useCreateNotificationMutation,
  useSendEmailNotificationMutation,
} = performanceReviewApi;
