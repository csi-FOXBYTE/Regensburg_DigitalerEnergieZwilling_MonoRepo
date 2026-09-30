import { Static, Type } from "@sinclair/typebox";

export const FeedbackCategoryDto = Type.Union([
  Type.Literal("bug"),
  Type.Literal("feedback"),
  Type.Literal("suggestion"),
]);

export const CreateFeedbackInputDto = Type.Object({
  category: FeedbackCategoryDto,
  message: Type.String(),
  emailAddress: Type.Optional(Type.String()),
});
export type CreateFeedbackInput = Static<typeof CreateFeedbackInputDto>;

export const FeedbackListQueryDto = Type.Object({
  skip: Type.Optional(Type.Integer({ minimum: 0 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  category: Type.Optional(Type.String({ minLength: 1 })),
  sortBy: Type.Optional(
    Type.Union([Type.Literal("createdAt"), Type.Literal("category")]),
  ),
  sortOrder: Type.Optional(
    Type.Union([Type.Literal("asc"), Type.Literal("desc")]),
  ),
});
export type FeedbackListQuery = Static<typeof FeedbackListQueryDto>;

export const FeedbackParamsDto = Type.Object({
  feedbackId: Type.String(),
});

export const FeedbackOutputDto = Type.Object({
  id: Type.String(),
  category: FeedbackCategoryDto,
  message: Type.String(),
  emailAddress: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const FeedbackListOutputDto = Type.Object({
  data: Type.Array(FeedbackOutputDto),
  total: Type.Integer(),
});
