export class SubmissionNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Submission "${id}" not found` : "Submission not found");
    this.name = "SubmissionNotFoundError";
  }
}

export class ConfigNotFoundError extends Error {
  constructor(versionName?: string) {
    super(versionName ? `Config "${versionName}" not found` : "No active config found");
    this.name = "ConfigNotFoundError";
  }
}

export class InvalidInputError extends Error {
  readonly issues: { path: string; message: string }[];

  constructor(issues: { path: string; message: string }[]) {
    super("Invalid input");
    this.name = "InvalidInputError";
    this.issues = issues;
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition submission from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

export class SubmissionOwnershipError extends Error {
  constructor() {
    super("You do not own this submission");
    this.name = "SubmissionOwnershipError";
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Insufficient permissions");
    this.name = "AccessDeniedError";
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User "${id}" not found`);
    this.name = "UserNotFoundError";
  }
}

export class ReviewCommentRequiredError extends Error {
  constructor() {
    super("A review comment is required for declining a submission");
    this.name = "ReviewCommentRequiredError";
  }
}

export class BuildingSubmissionsNotDeclinedError extends Error {
  constructor(buildingId: string) {
    super(`Not all submissions for building "${buildingId}" are declined`);
    this.name = "BuildingSubmissionsNotDeclinedError";
  }
}
