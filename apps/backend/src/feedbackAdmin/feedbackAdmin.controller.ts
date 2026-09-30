import { createController } from "@csi-foxbyte/fastify-toab";
import { getFeedbackService } from "../@internals/index.js";
import { requirePermission } from "../config/config.middleware.js";
import { AppError } from "../errors/app-error.js";
import {
  FeedbackListOutputDto,
  FeedbackListQueryDto,
  FeedbackOutputDto,
  FeedbackParamsDto,
} from "../feedback/feedback.dto.js";
import {
  FeedbackNotFoundError,
  InvalidFeedbackError,
} from "../feedback/feedback.errors.js";

const feedbackAdminController = createController().rootPath(
  "/api/admin/feedback",
);

const serializeFeedback = (feedback: {
  id: string;
  category: "bug" | "feedback" | "suggestion";
  message: string;
  emailAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...feedback,
  createdAt: feedback.createdAt.toISOString(),
  updatedAt: feedback.updatedAt.toISOString(),
});

const translateFeedbackError = (error: unknown) => {
  if (error instanceof FeedbackNotFoundError)
    throw new AppError({
      status: "NOT_FOUND",
      code: 404,
      message: error.message,
    });
  if (error instanceof InvalidFeedbackError)
    throw new AppError({
      status: "BAD_REQUEST",
      code: 400,
      message: error.message,
    });
};

feedbackAdminController
  .addRoute("GET", "/")
  .use(requirePermission("feedback:read"))
  .querystring(FeedbackListQueryDto)
  .output(FeedbackListOutputDto)
  .handler(async ({ services, querystring }) => {
    const feedbackService = await getFeedbackService(services);

    try {
      const result = await feedbackService.list(querystring);
      return {
        total: result.total,
        data: result.data.map(serializeFeedback),
      };
    } catch (error) {
      translateFeedbackError(error);
      throw error;
    }
  });

feedbackAdminController
  .addRoute("GET", "/:feedbackId")
  .use(requirePermission("feedback:read"))
  .params(FeedbackParamsDto)
  .output(FeedbackOutputDto)
  .handler(async ({ services, params }) => {
    const feedbackService = await getFeedbackService(services);

    try {
      return serializeFeedback(
        await feedbackService.getById(params.feedbackId),
      );
    } catch (error) {
      translateFeedbackError(error);
      throw error;
    }
  });

feedbackAdminController
  .addRoute("DELETE", "/:feedbackId")
  .use(requirePermission("feedback:delete"))
  .params(FeedbackParamsDto)
  .handler(async ({ services, params, reply }) => {
    const feedbackService = await getFeedbackService(services);

    try {
      await feedbackService.deleteById(params.feedbackId);
      reply.code(204);
      // fastify-toab@0.2.0-rc.4 returns reply.raw.end() when a handler
      // resolves to undefined, causing Fastify to attempt a second send.
      return "" as never;
    } catch (error) {
      translateFeedbackError(error);
      throw error;
    }
  });

export default feedbackAdminController;
