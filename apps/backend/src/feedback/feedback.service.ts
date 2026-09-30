import { createService } from "@csi-foxbyte/fastify-toab";
import { z } from "zod";
import { getDatabaseService } from "../@internals/index.js";
import {
  FeedbackCategory,
  type FeedbackCategory as FeedbackCategoryValue,
} from "../zenstack/models.js";
import type {
  CreateFeedbackInput,
  FeedbackListQuery,
} from "./feedback.dto.js";
import {
  FeedbackNotFoundError,
  InvalidFeedbackError,
} from "./feedback.errors.js";

type DB = Awaited<ReturnType<typeof getDatabaseService>>;

const feedbackCategories = new Set<FeedbackCategoryValue>(
  Object.values(FeedbackCategory),
);
const emailSchema = z.string().max(320).email();

export const normalizeFeedbackInput = (input: CreateFeedbackInput) => {
  if (
    typeof input.category !== "string" ||
    !feedbackCategories.has(input.category)
  )
    throw new InvalidFeedbackError("Invalid feedback category");

  if (typeof input.message !== "string")
    throw new InvalidFeedbackError("Message must be a string");
  const message = input.message.trim();
  if (message.length === 0)
    throw new InvalidFeedbackError("Message must not be empty");
  if (message.length > 5_000)
    throw new InvalidFeedbackError("Message must not exceed 5000 characters");

  let emailAddress: string | undefined;
  if (input.emailAddress !== undefined) {
    if (typeof input.emailAddress !== "string")
      throw new InvalidFeedbackError("Email address is invalid");
    emailAddress = input.emailAddress.trim().toLowerCase();
    if (!emailSchema.safeParse(emailAddress).success)
      throw new InvalidFeedbackError("Email address is invalid");
  }

  return { category: input.category, message, emailAddress };
};

export const parseFeedbackCategoryFilter = (
  category: string | undefined,
): FeedbackCategoryValue[] | undefined => {
  if (category === undefined) return undefined;

  const categories = category.split(",");
  if (
    categories.length === 0 ||
    categories.some(
      (value) =>
        value.length === 0 ||
        !feedbackCategories.has(value as FeedbackCategoryValue),
    )
  )
    throw new InvalidFeedbackError("Invalid feedback category filter");

  return [...new Set(categories)] as FeedbackCategoryValue[];
};

export const createFeedback = async (
  db: DB,
  input: CreateFeedbackInput,
) => {
  const data = normalizeFeedbackInput(input);
  return db.feedback.create({ data });
};

export const listFeedback = async (db: DB, query: FeedbackListQuery) => {
  const categories = parseFeedbackCategoryFilter(query.category);
  const where = categories ? { category: { in: categories } } : {};
  const direction = query.sortOrder ?? "desc";
  const orderBy =
    query.sortBy === "category"
      ? ([{ category: direction }, { id: "asc" as const }] as const)
      : ([{ createdAt: direction }, { id: "asc" as const }] as const);

  const [data, total] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy,
      skip: query.skip ?? 0,
      take: query.limit ?? 20,
    }),
    db.feedback.count({ where }),
  ]);

  return { data, total };
};

export const getFeedbackById = async (db: DB, feedbackId: string) => {
  const feedback = await db.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) throw new FeedbackNotFoundError(feedbackId);
  return feedback;
};

export const deleteFeedbackById = async (db: DB, feedbackId: string) => {
  const result = await db.feedback.deleteMany({ where: { id: feedbackId } });
  if (result.count === 0) throw new FeedbackNotFoundError(feedbackId);
};

const feedbackService = createService("feedback", async ({ services }) => {
  const db = await getDatabaseService(services);

  return {
    create: (input: CreateFeedbackInput) => createFeedback(db, input),
    list: (query: FeedbackListQuery) => listFeedback(db, query),
    getById: (feedbackId: string) => getFeedbackById(db, feedbackId),
    deleteById: (feedbackId: string) => deleteFeedbackById(db, feedbackId),
  };
});

export default feedbackService;
