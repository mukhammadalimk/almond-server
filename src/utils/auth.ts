import { UnverifiedUser, VerifiedUser } from "../users/user.model.js";

// Function to generate a random four-digit number
const generate_random_four_digit_number = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Function to create a unique username
export const create_unique_username = async (name: string): Promise<string> => {
  let username = name.toLowerCase();
  let is_unique = false;

  while (!is_unique) {
    const existing_user = await VerifiedUser.findOne({ username });

    if (!existing_user) {
      is_unique = true;
    } else {
      username = `${name.toLowerCase()}-${generate_random_four_digit_number()}`;
    }
  }

  return username;
};

// Function to generate unique verification code
export const generate_unique_verification_code = async (): Promise<number> => {
  let isUnique = false;
  let verification_code: number;

  // Keep generating random numbers until a unique one is found
  while (!isUnique) {
    // Generate a random 5-digit number
    verification_code = Math.floor(10000 + Math.random() * 90000);

    // Check if the generated number already exists in the database
    const existing_user = await UnverifiedUser.findOne({ verification_code });

    // If the number doesn't exist, set isUnique to true to exit the loop
    if (!existing_user) isUnique = true;
  }

  return verification_code;
};

// Function to remove empty properties from Object
export function remove_empty_properties(
  obj: Record<string, any>
): Record<string, any> {
  // Create a new object to hold non-empty properties
  const result: Record<string, any> = {};

  // Iterate over the object’s keys
  for (const [key, value] of Object.entries(obj)) {
    // Check if the value is neither null, undefined, nor an empty string
    if (value !== undefined && value !== null && value !== "") {
      // Recursively clean nested objects
      result[key] =
        typeof value === "object" && !Array.isArray(value)
          ? remove_empty_properties(value)
          : value;
    }
  }

  return result;
}
