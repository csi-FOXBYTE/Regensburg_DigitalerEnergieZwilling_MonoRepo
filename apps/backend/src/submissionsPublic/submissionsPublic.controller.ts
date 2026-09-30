import { createController } from "@csi-foxbyte/fastify-toab";
import { Type } from "@sinclair/typebox";
import { getSubmissionsService } from "../@internals/index.js";
import { AppError } from "../errors/app-error.js";
import {
  DeletionReceiptDto,
  DeletePublicOutputDto,
  PublicSubmissionDownloadOutputDto,
  PublicSubmissionStatusOutputDto,
  SubmitInputDto,
  SubmitOutputDto,
  VerifyDeletionReceiptOutputDto,
} from "../submissions/submissions.dto.js";
import {
  ConfigNotFoundError,
  InvalidInputError,
  SubmissionNotFoundError,
} from "../submissions/submissions.errors.js";

const submissionsPublicController = createController().rootPath(
  "/api/public/submissions",
);

const DeletionTokenParams = Type.Object({ deletionToken: Type.String() });

const catchSubmissionNotFound = (err: unknown) => {
  if (err instanceof SubmissionNotFoundError)
    throw new AppError({
      status: "NOT_FOUND",
      code: 404,
      message: err.message,
    });
};

export const buildPublicDeletionLink = (base: string | undefined, token: string) => {
  if (!base) throw new Error("PUBLIC_CLIENT_BASE_URL is not configured");

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new Error("PUBLIC_CLIENT_BASE_URL is invalid");
  }

  if (!(["http:", "https:"] as string[]).includes(url.protocol))
    throw new Error("PUBLIC_CLIENT_BASE_URL must use HTTP or HTTPS");
  if (url.username || url.password || url.search || url.hash)
    throw new Error("PUBLIC_CLIENT_BASE_URL must not contain credentials, a query, or a fragment");

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/delete/${encodeURIComponent(token)}`;
  return url.toString();
};

const safeDownloadFilename = (submissionId: string) =>
  `submission-${submissionId.replace(/[^A-Za-z0-9_-]/g, "_")}.json`;

submissionsPublicController
  .addRoute("POST", "/")
  .body(SubmitInputDto)
  .output(SubmitOutputDto)
  .handler(async ({ services, body }) => {
    const submissionsService = await getSubmissionsService(services);

    try {
      const submission = await submissionsService.submit({
        input: body.input,
        configName: body.configName,
        buildingId: body.buildingId,
        address: body.address,
        longitude: body.longitude,
        latitude: body.latitude,
      });

      return {
        deletionToken: submission.deletionToken,
      };
    } catch (err) {
      if (err instanceof ConfigNotFoundError)
        throw new AppError({
          status: "NOT_FOUND",
          code: 404,
          message: err.message,
        });
      if (err instanceof InvalidInputError)
        throw new AppError({
          status: "BAD_REQUEST",
          code: 400,
          message: err.message,
        });
      throw err;
    }
  });

submissionsPublicController
  .addRoute("GET", "/:deletionToken/status")
  .params(DeletionTokenParams)
  .output(PublicSubmissionStatusOutputDto)
  .handler(
    async ({ services, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      const submissionsService = await getSubmissionsService(services);

      try {
        await submissionsService.assertAvailableByToken(params.deletionToken);
        return { available: true as const };
      } catch (err) {
        catchSubmissionNotFound(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsPublicController
  .addRoute("GET", "/:deletionToken/download")
  .params(DeletionTokenParams)
  .output(PublicSubmissionDownloadOutputDto)
  .handler(
    async ({ services, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      const submissionsService = await getSubmissionsService(services);

      try {
        const submission = await submissionsService.getPublicDownloadByToken(
          params.deletionToken,
        );
        const output = {
          id: submission.id,
          buildingId: submission.buildingId,
          address: submission.address,
          longitude: submission.longitude,
          latitude: submission.latitude,
          ...(submission.usedConfig?.versionName
            ? { configName: submission.usedConfig.versionName }
            : {}),
          createdAt: submission.createdAt.toISOString(),
          raw: JSON.parse(submission.rawInput),
          ngsiData: JSON.parse(submission.ngsiData),
          deletionLink: buildPublicDeletionLink(
            process.env.PUBLIC_CLIENT_BASE_URL,
            params.deletionToken,
          ),
        };

        reply
          .type("application/json; charset=utf-8")
          .header(
            "Content-Disposition",
            `attachment; filename="${safeDownloadFilename(submission.id)}"`,
          );
        return output;
      } catch (err) {
        catchSubmissionNotFound(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsPublicController
  .addRoute("DELETE", "/:deletionToken")
  .params(DeletionTokenParams)
  .output(DeletePublicOutputDto)
  .handler(
    async ({ services, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      const submissionsService = await getSubmissionsService(services);

      try {
        const receipt = await submissionsService.deleteByToken(params.deletionToken);
        return { success: true as const, receipt };
      } catch (err) {
        catchSubmissionNotFound(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsPublicController
  .addRoute("POST", "/deletion-receipts/verify")
  .body(DeletionReceiptDto)
  .output(VerifyDeletionReceiptOutputDto)
  .handler(async ({ services, body, reply }) => {
    reply.header("Cache-Control", "no-store");
    const submissionsService = await getSubmissionsService(services);
    return { valid: await submissionsService.verifyDeletionReceipt(body) };
  });

export default submissionsPublicController;
