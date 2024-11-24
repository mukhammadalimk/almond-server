import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const send_sms_to_phone_number = async (
  message: string,
  phone_number: string
) => {
  const token_config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://notify.eskiz.uz/api/auth/login",
    data: {
      email: process.env.ESKIZ_EMAIL,
      password: process.env.ESKIZ_PASSWORD,
    },
  };
  const token_response = await axios(token_config);
  const { token } = token_response.data.data;

  const message_config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://notify.eskiz.uz/api/message/sms/send",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      mobile_phone: `+998` + phone_number,
      message,
      from: "4546",
    },
  };

  await axios(message_config);
};
