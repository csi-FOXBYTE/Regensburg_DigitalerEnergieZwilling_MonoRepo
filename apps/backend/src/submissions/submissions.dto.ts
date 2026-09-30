import { Static, Type } from "@sinclair/typebox";

const SubmissionStatusDto = Type.Union([
  Type.Literal("NEW"),
  Type.Literal("ASSIGNED"),
  Type.Literal("ACCEPTED"),
  Type.Literal("DECLINED"),
  Type.Literal("SUPERSEDED"),
]);

const UserRefDto = Type.Object({
  id: Type.String(),
  email: Type.String(),
  given_name: Type.Union([Type.String(), Type.Null()]),
  family_name: Type.Union([Type.String(), Type.Null()]),
});

// --- Submit (public) ---

export const SubmitInputDto = Type.Object({
  input: Type.Unknown(),
  configName: Type.Optional(Type.String()),
  buildingId: Type.String(),
  address: Type.String(),
  longitude: Type.Number(),
  latitude: Type.Number(),
});
export type SubmitInput = Static<typeof SubmitInputDto>;

export const SubmitOutputDto = Type.Object({
  deletionToken: Type.String(),
});
export type SubmitOutput = Static<typeof SubmitOutputDto>;

// --- Public capability routes ---

export const PublicSubmissionStatusOutputDto = Type.Object({
  available: Type.Literal(true),
});

export const PublicSubmissionDownloadOutputDto = Type.Object({
  id: Type.String(),
  buildingId: Type.String(),
  address: Type.String(),
  longitude: Type.Number(),
  latitude: Type.Number(),
  configName: Type.Optional(Type.String()),
  createdAt: Type.String({ format: "date-time" }),
  raw: Type.Object({}, { additionalProperties: true }),
  ngsiData: Type.Object({}, { additionalProperties: true }),
  deletionLink: Type.String(),
});

const DeletionReceiptActionDto = Type.Union([
  Type.Literal("SUBMISSION_DELETE"),
  Type.Literal("BUILDING_SUBMISSIONS_DELETE"),
]);

const DeletionReceiptActorTypeDto = Type.Union([
  Type.Literal("ADMIN"),
  Type.Literal("PUBLIC_CAPABILITY"),
]);

const DeletionReceiptTargetTypeDto = Type.Union([
  Type.Literal("SUBMISSION"),
  Type.Literal("BUILDING"),
]);

export const DeletionReceiptDto = Type.Object({
  version: Type.Literal(1),
  auditEventId: Type.String(),
  deletedAt: Type.String({ format: "date-time" }),
  action: DeletionReceiptActionDto,
  actorType: DeletionReceiptActorTypeDto,
  targetType: DeletionReceiptTargetTypeDto,
  targetId: Type.String(),
  deletedCount: Type.Integer({ minimum: 1 }),
  verificationSecret: Type.String({ minLength: 43, maxLength: 43 }),
});
export type DeletionReceiptInput = Static<typeof DeletionReceiptDto>;

export const VerifyDeletionReceiptOutputDto = Type.Object({
  valid: Type.Boolean(),
});

export const DeletePublicOutputDto = Type.Object({
  success: Type.Literal(true),
  receipt: DeletionReceiptDto,
});

export const DeleteAdminOutputDto = Type.Object({
  id: Type.String(),
  receipt: DeletionReceiptDto,
});

export const DeleteBuildingSubmissionsOutputDto = Type.Object({
  buildingId: Type.String(),
  deletedCount: Type.Integer({ minimum: 1 }),
  receipt: DeletionReceiptDto,
});

// --- Assign ---

export const AssignInputDto = Type.Object({
  userId: Type.Optional(Type.String()),
});
export type AssignInput = Static<typeof AssignInputDto>;

export const AssignmentOutputDto = Type.Object({
  id: Type.String(),
  status: SubmissionStatusDto,
  assignedToId: Type.Union([Type.String(), Type.Null()]),
  assignedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
});
export type AssignmentOutput = Static<typeof AssignmentOutputDto>;

export const DecisionInputDto = Type.Object({
  comment: Type.Optional(Type.String({ maxLength: 4000 })),
});
export type DecisionInput = Static<typeof DecisionInputDto>;

export const AcceptOutputDto = Type.Intersect([
  AssignmentOutputDto,
  Type.Object({
    supersededSubmissionIds: Type.Array(Type.String()),
    declinedSubmissionIds: Type.Array(Type.String()),
  }),
]);
export type AcceptOutput = Static<typeof AcceptOutputDto>;

// --- List (admin) ---

export const ListQueryDto = Type.Object({
  managerId: Type.Optional(Type.String()),
  skip: Type.Optional(Type.Integer({ minimum: 0 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  status: Type.Optional(SubmissionStatusDto),
  sortBy: Type.Optional(Type.Union([Type.Literal("status"), Type.Literal("submitted")])),
});
export type ListQuery = Static<typeof ListQueryDto>;

export const ListOutputDto = Type.Object({
  data: Type.Array(
    Type.Object({
      buildingId: Type.String(),
      address: Type.String(),
      longitude: Type.Number(),
      latitude: Type.Number(),
      submissionCount: Type.Integer(),
      submissions: Type.Array(
        Type.Object({
          id: Type.String(),
          status: SubmissionStatusDto,
          assignedToId: Type.Union([Type.String(), Type.Null()]),
          createdAt: Type.String({ format: "date-time" }),
        }),
      ),
    }),
  ),
  total: Type.Integer(),
});
export type ListOutput = Static<typeof ListOutputDto>;

// --- GetById (admin) ---

export const GetByIdOutputDto = Type.Object({
  id: Type.String(),
  status: SubmissionStatusDto,
  buildingId: Type.String(),
  address: Type.String(),
  longitude: Type.Number(),
  latitude: Type.Number(),
  otherSubmissionIds: Type.Array(Type.String()),
  currentAcceptedSubmissionId: Type.Union([Type.String(), Type.Null()]),
  allSubmissionsDeclined: Type.Boolean(),
  submissionCount: Type.Integer({ minimum: 1 }),
  assignedTo: Type.Union([UserRefDto, Type.Null()]),
  assignedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  ngsiData: Type.Object({}, { additionalProperties: true }),
  raw: Type.Object({}, { additionalProperties: true }),
  usedConfig: Type.Union([
    Type.Object({
      id: Type.String(),
      versionName: Type.String(),
    }),
    Type.Null(),
  ]),
  history: Type.Array(
    Type.Object({
      id: Type.String(),
      from: SubmissionStatusDto,
      to: SubmissionStatusDto,
      by: UserRefDto,
      comment: Type.Union([Type.String(), Type.Null()]),
      relatedSubmissionId: Type.Union([Type.String(), Type.Null()]),
      createdAt: Type.String({ format: "date-time" }),
    }),
  ),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});
export type GetByIdOutput = Static<typeof GetByIdOutputDto>;
