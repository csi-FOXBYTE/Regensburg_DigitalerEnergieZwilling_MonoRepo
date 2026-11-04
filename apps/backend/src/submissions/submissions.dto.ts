import { Static, Type } from "@sinclair/typebox";
import { SubmissionCalculationInputDto } from "./submission-input.dto.js";

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

export const MAX_ID_LENGTH = 256;
export const MAX_ADDRESS_LENGTH = 512;

export const SubmitInputDto = Type.Object({
  input: SubmissionCalculationInputDto,
  configName: Type.Optional(Type.String({ minLength: 1, maxLength: MAX_ID_LENGTH })),
  buildingId: Type.String({ minLength: 1, maxLength: MAX_ID_LENGTH }),
  // Empty when the building model has no address; the public client then
  // still submits (NextStepsSection.tsx).
  address: Type.String({ maxLength: MAX_ADDRESS_LENGTH }),
  longitude: Type.Number({ minimum: -180, maximum: 180 }),
  latitude: Type.Number({ minimum: -90, maximum: 90 }),
}, { additionalProperties: false });
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
}, { additionalProperties: false });
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
  userId: Type.Optional(Type.String({ maxLength: MAX_ID_LENGTH })),
}, { additionalProperties: false });
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
}, { additionalProperties: false });
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

// Largest PostgreSQL integer; also keeps "1e24" out of OFFSET.
export const MAX_LIST_SKIP = 2_147_483_647;

export const ListQueryDto = Type.Object({
  managerId: Type.Optional(Type.String({ maxLength: MAX_ID_LENGTH })),
  skip: Type.Optional(Type.Integer({ minimum: 0, maximum: MAX_LIST_SKIP })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  status: Type.Optional(SubmissionStatusDto),
  sortBy: Type.Optional(Type.Union([Type.Literal("status"), Type.Literal("submitted")])),
}, { additionalProperties: false });
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
