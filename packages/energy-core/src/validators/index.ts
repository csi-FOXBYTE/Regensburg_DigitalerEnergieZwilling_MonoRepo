export { validateConfig } from "./config.js";
export { validateInput } from "./input.js";
export type { ValidationResult, ValidationIssue } from "./types.js";
export { detectMigrations, validateAndMigrate, applyMigrators, ConfigMigrationError } from "./migrate.js";
export type { ConfigMigrator, ValidateAndMigrateResult } from "./migrate.js";
