import validate from "./validate.js";

/**
 * Uses the ajv-compiled schema validation function
 * from validate.js to validate the payload against
 * the schema found in the telemetry-schema folder
 *
 * @param payload
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateSchema = payload => {
  const result = validate(payload);
  // @ts-ignore
  return { valid: result, errors: validate.errors };
};
