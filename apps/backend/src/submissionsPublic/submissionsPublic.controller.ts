import { createController } from "@csi-foxbyte/fastify-toab";
import { Type, type Static } from "@sinclair/typebox";
import type { FastifyReply } from "fastify";
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

// The token travels in the request body, never in the URL, so it does not end
// up in gateway or ingress access logs.
const DeletionTokenBody = Type.Object({
  deletionToken: Type.String({ minLength: 1, maxLength: 256 }),
});
// Only for JSON links in PDFs issued before the token left the URL.
const LegacyDeletionTokenParams = DeletionTokenBody;

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

  // The fragment is never sent to a server and therefore never logged.
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/delete`;
  url.hash = encodeURIComponent(token);
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

type SubmissionsService = Awaited<ReturnType<typeof getSubmissionsService>>;

const publicDownload = async (
  submissionsService: SubmissionsService,
  deletionToken: string,
  reply: FastifyReply,
): Promise<Static<typeof PublicSubmissionDownloadOutputDto>> => {
  try {
    const submission = await submissionsService.getPublicDownloadByToken(deletionToken);
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
        deletionToken,
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
};

submissionsPublicController
  .addRoute("POST", "/status")
  .body(DeletionTokenBody)
  .output(PublicSubmissionStatusOutputDto)
  .handler(
    async ({ services, body, reply }) => {
      reply.header("Cache-Control", "no-store");
      const submissionsService = await getSubmissionsService(services);

      try {
        await submissionsService.assertAvailableByToken(body.deletionToken);
        return { available: true as const };
      } catch (err) {
        catchSubmissionNotFound(err);
        throw err;
      }
    },
    { logLevel: "silent" },
  );

submissionsPublicController
  .addRoute("POST", "/download")
  .body(DeletionTokenBody)
  .output(PublicSubmissionDownloadOutputDto)
  .handler(
    async ({ services, body, reply }) => {
      reply.header("Cache-Control", "no-store");
      return publicDownload(await getSubmissionsService(services), body.deletionToken, reply);
    },
    { logLevel: "silent" },
  );

// Deprecated: keeps the JSON links in already distributed PDFs working. New
// PDFs link to the client download page with the token in the fragment.
submissionsPublicController
  .addRoute("GET", "/:deletionToken/download")
  .params(LegacyDeletionTokenParams)
  .output(PublicSubmissionDownloadOutputDto)
  .handler(
    async ({ services, params, reply }) => {
      reply.header("Cache-Control", "no-store");
      return publicDownload(await getSubmissionsService(services), params.deletionToken, reply);
    },
    { logLevel: "silent" },
  );

submissionsPublicController
  .addRoute("POST", "/delete")
  .body(DeletionTokenBody)
  .output(DeletePublicOutputDto)
  .handler(
    async ({ services, body, reply }) => {
      reply.header("Cache-Control", "no-store");
      const submissionsService = await getSubmissionsService(services);

      try {
        const receipt = await submissionsService.deleteByToken(body.deletionToken);
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
