import AppDataSource from "../../data-source.js";
import { User } from "../../entities/User.js";

// Function to generate a random four-digit number
const generate_random_four_digit_number = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Function to create a unique username
export const create_unique_username = async (name: string): Promise<string> => {
  let username = name.toLowerCase();
  let is_unique = false;

  // Get repository for the User entity
  const user_repository = AppDataSource.getRepository(User);

  while (!is_unique) {
    // Query to check if the username exists
    const existing_user = await user_repository.findOne({
      where: { username },
    });

    if (!existing_user) {
      is_unique = true;
    } else {
      // If the username already exists, generate a new username
      username = `${name.toLowerCase()}-${generate_random_four_digit_number()}`;
    }
  }

  return username;
};

// Function to generate unique verification code
export const generate_unique_verification_code = async (): Promise<number> => {
  let is_unique = false;
  let verification_code: number;

  // Get repository for the User entity
  const user_repository = AppDataSource.getRepository(User);

  // Keep generating random numbers until a unique one is found
  while (!is_unique) {
    // Generate a random 5-digit number
    verification_code = Math.floor(10000 + Math.random() * 90000);

    // Check if the generated number already exists in the database
    const existing_user = await user_repository.findOne({
      where: { verification_code },
    });

    // If the number doesn't exist, set is_unique to true to exit the loop
    if (!existing_user) is_unique = true;
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
