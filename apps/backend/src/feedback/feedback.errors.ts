export class InvalidFeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidFeedbackError";
  }
}

export class FeedbackNotFoundError extends Error {
  constructor(id: string) {
    super(`Feedback "${id}" not found`);
    this.name = "FeedbackNotFoundError";
  }
}
