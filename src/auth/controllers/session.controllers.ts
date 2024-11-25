import AppDataSource from "../../data-source";
import { Session } from "../../entities/Session";
import { User } from "../../entities/User";

const user_repo = AppDataSource.getRepository(User);
const session_repo = AppDataSource.getRepository(Session);

interface AddSessionDataType {
  user: string;
  ip_address: string;
  address: string;
  refresh_token: string;
}

export const add_session_to_user = async (data: AddSessionDataType) => {
  // First, find the user
  const user = await user_repo.findOne({ where: { id: data.user } });

  if (!user) {
    throw new Error("User not found");
  }

  // Create a new session
  const new_session = new Session();
  new_session.refresh_token = data.refresh_token;
  new_session.logged_at = new Date();
  new_session.last_seen = new Date();
  new_session.address = data.address;
  new_session.ip_address = data.ip_address;
  new_session.user = user; // Assign the user to the session

  // Save the session to the database
  await session_repo.save(new_session);

  // Optionally, return the updated user or session information
  return new_session;
};
