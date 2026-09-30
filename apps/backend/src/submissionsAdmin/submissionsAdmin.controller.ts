import { createController } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
import { getSubmissionsService } from "../@internals/index.js";
import type { AccessToken } from "../auth/auth.dto.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requirePermission } from "../config/config.middleware.js";
import { AppError } from "../errors/app-error.js";
import {
  AcceptOutputDto,
  AssignInputDto,
  AssignmentOutputDto,
  DecisionInputDto,
  DeleteAdminOutputDto,
  DeleteBuildingSubmissionsOutputDto,
  GetByIdOutputDto,
  ListOutputDto,
  ListQueryDto,
} from "../submissions/submissions.dto.js";
import {
  AccessDeniedError,
  BuildingSubmissionsNotDeclinedError,
  InvalidStatusTransitionError,
  ReviewCommentRequiredError,
  SubmissionNotFoundError,
  SubmissionOwnershipError,
  UserNotFoundError,
} from "../submissions/submissions.errors.js";

const resolveRoles = (token: AccessToken): string[] => {
  const clientId =
    process.env.AUTH_RESOURCE_ACCESS_CLIENT_ID ?? "digital-energy-twin";
  return token.resource_access?.[clientId]?.roles ?? [];
};

const catchSubmissionErrors = (err: unknown) => {
  if (err instanceof SubmissionNotFoundError)
    throw new AppError({
      status: "NOT_FOUND",
      code: 404,
      message: err.message,
    });
  if (err instanceof AccessDeniedError)
    throw new AppError({
      status: "FORBIDDEN",
      code: 403,
      message: err.message,
    });
  if (err instanceof SubmissionOwnershipError)
    throw new AppError({
      status: "FORBIDDEN",
      code: 403,
      message: err.message,
    });
  if (err instanceof InvalidStatusTransitionError)
    throw new AppError({
      status: "BAD_REQUEST",
      code: 409,
      message: err.message,
    });
  if (err instanceof ReviewCommentRequiredError)
    throw new AppError({
      status: "BAD_REQUEST",
      code: 400,
      message: err.message,
    });
  if (err instanceof BuildingSubmissionsNotDeclinedError)
    throw new AppError({
      status: "BAD_REQUEST",
      code: 409,
      message: err.message,
    });
  if (err instanceof UserNotFoundError)
    throw new AppError({
      status: "NOT_FOUND",
      code: 404,
      message: err.message,
    });
};

const submissionsAdminController = createController()
  .use(authMiddleware)
  .rootPath("/api/admin/submissions");

const SubmissionIdParams = Type.Object({ submissionId: Type.String() });

submissionsAdminController
  .addRoute("GET", "/")
  .use(requirePermission("submissions:read"))
  .querystring(ListQueryDto)
  .output(ListOutputDto)
  .handler(async ({ services, querystring: query }) => {
    const submissionsService = await getSubmissionsService(services);
    const result = await submissionsService.list({
      managerId: query.managerId,
      status: query.status,
      sortBy: query.sortBy,
      skip: query.skip,
      limit: query.limit,
    });
    return {
      total: result.total,
      data: result.data.map((item) => ({
        ...item,
        submissions: item.submissions.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        })),
      })),
    };
  });

submissionsAdminController
  .addRoute("GET", "/:submissionId")
  .use(requirePermission("submissions:read"))
  .params(SubmissionIdParams)
  .output(GetByIdOutputDto)
  .handler(async ({ services, params }) => {
    const submissionsService = await getSubmissionsService(services);
    try {
      const submission = await submissionsService.getById(params.submissionId);
      return {
        ...submission,
        assignedAt: submission.assignedAt?.toISOString() ?? null,
        ngsiData: JSON.parse(submission.ngsiData),
        raw: JSON.parse(submission.rawInput),
        history: submission.history.map((h) => ({
          id: h.id,
          from: h.from,
          to: h.to,
          by: h.by,
          comment: h.comment,
          relatedSubmissionId: h.relatedSubmissionId,
          createdAt: h.createdAt.toISOString(),
        })),
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
      };
    } catch (err) {
      catchSubmissionErrors(err);
      throw err;
    }
  });

submissionsAdminController
  .addRoute("DELETE", "/building/:buildingId")
  .use(requirePermission("submissions:delete"))
  .params(Type.Object({ buildingId: Type.String() }))
  .output(DeleteBuildingSubmissionsOutputDto)
  .handler(
    async ({ services, params, ctx }) => {
      const submissionsService = await getSubmissionsService(services);
      try {
        return await submissionsService.deleteBuildingSubmissions(
          params.buildingId,
          ctx.user.id,
          resolveRoles(ctx.token),
        );
      } catch (err) {
        catchSubmissionErrors(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsAdminController
  .addRoute("DELETE", "/:submissionId")
  .use(requirePermission("submissions:delete"))
  .params(SubmissionIdParams)
  .output(DeleteAdminOutputDto)
  .handler(
    async ({ services, params, ctx }) => {
      const submissionsService = await getSubmissionsService(services);
      try {
        return await submissionsService.deleteById(
          params.submissionId,
          ctx.user.id,
          resolveRoles(ctx.token),
        );
      } catch (err) {
        catchSubmissionErrors(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsAdminController
  .addRoute("PATCH", "/:submissionId/assignment")
  .params(SubmissionIdParams)
  .body(AssignInputDto)
  .output(AssignmentOutputDto)
  .handler(async ({ services, params, body, ctx }) => {
    const submissionsService = await getSubmissionsService(services);
    try {
      const submission = await submissionsService.assign(
        params.submissionId,
        ctx.user.id,
        resolveRoles(ctx.token),
        body.userId,
      );
      return {
        id: submission.id,
        status: submission.status,
        assignedToId: submission.assignedToId,
        assignedAt: submission.assignedAt?.toISOString() ?? null,
      };
    } catch (err) {
      catchSubmissionErrors(err);
      throw err;
    }
  });

submissionsAdminController
  .addRoute("DELETE", "/:submissionId/assignment")
  .params(SubmissionIdParams)
  .output(AssignmentOutputDto)
  .handler(async ({ services, params, ctx }) => {
    const submissionsService = await getSubmissionsService(services);
    try {
      const submission = await submissionsService.unAssign(
        params.submissionId,
        ctx.user.id,
        resolveRoles(ctx.token),
      );
      return {
        id: submission.id,
        status: submission.status,
        assignedToId: submission.assignedToId,
        assignedAt: submission.assignedAt?.toISOString() ?? null,
      };
    } catch (err) {
      catchSubmissionErrors(err);
      throw err;
    }
  });

submissionsAdminController
  .addRoute("POST", "/:submissionId/accept")
  .params(SubmissionIdParams)
  .body(DecisionInputDto)
  .output(AcceptOutputDto)
  .handler(async ({ services, params, body, ctx }) => {
    const submissionsService = await getSubmissionsService(services);
    try {
      const result = await submissionsService.accept(
        params.submissionId,
        ctx.user.id,
        resolveRoles(ctx.token),
        body.comment,
      );
      return {
        id: result.submission.id,
        status: result.submission.status,
        assignedToId: result.submission.assignedToId,
        assignedAt: result.submission.assignedAt?.toISOString() ?? null,
        supersededSubmissionIds: result.supersededSubmissionIds,
        declinedSubmissionIds: result.declinedSubmissionIds,
      };
    } catch (err) {
      catchSubmissionErrors(err);
      throw err;
    }
  });

submissionsAdminController
  .addRoute("POST", "/:submissionId/decline")
  .params(SubmissionIdParams)
  .body(DecisionInputDto)
  .output(AssignmentOutputDto)
  .handler(async ({ services, params, body, ctx }) => {
    const submissionsService = await getSubmissionsService(services);
    try {
      const submission = await submissionsService.decline(
        params.submissionId,
        ctx.user.id,
        resolveRoles(ctx.token),
        body.comment,
      );
      return {
        id: submission.id,
        status: submission.status,
        assignedToId: submission.assignedToId,
        assignedAt: submission.assignedAt?.toISOString() ?? null,
      };
    } catch (err) {
      catchSubmissionErrors(err);
      throw err;
    }
  });

export default submissionsAdminController;
