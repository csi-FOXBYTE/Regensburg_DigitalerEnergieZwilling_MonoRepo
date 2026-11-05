import { createController } from "../toab/index.js";
import { AltchaHeadersDto } from "../altcha/altcha.dto.js";
import { getFeedbackService } from "../@internals/index.js";
import {
  CreateFeedbackInputDto,
} from "../feedback/feedback.dto.js";
import { InvalidFeedbackError } from "../feedback/feedback.errors.js";
import { AppError } from "../errors/app-error.js";

const feedbackPublicController = createController().rootPath(
  "/api/public/feedback",
);

feedbackPublicController
  .addRoute("POST", "/")
  .headers(AltchaHeadersDto)
  .body(CreateFeedbackInputDto)
  .handler(async ({ services, body, reply }) => {
    const feedbackService = await getFeedbackService(services);

    try {
      await feedbackService.create(body);
      reply.code(201);
      // fastify-toab (src/toab/helpers.ts) returns reply.raw.end() when a handler
      // resolves to undefined, causing Fastify to attempt a second send.
      return "" as never;
    } catch (error) {
      if (error instanceof InvalidFeedbackError)
        throw new AppError({
          status: "BAD_REQUEST",
          code: 400,
          message: error.message,
        });
      throw error;
    }
  });

export default feedbackPublicController;
