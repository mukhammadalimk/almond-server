import { Locale } from "../../types/shared.types";

interface SendVerificationEmailTypes {
  for_sign_up: {
    subject: string;
    text: string;
  };
}

export const send_verification_email_texts: Record<
  Locale,
  SendVerificationEmailTypes
> = {
  uz: {
    for_sign_up: {
      subject: "Almond.uz uchun tasdiqlash kodi (faqat 10 daqiqa amal qiladi)",
      text: "Tasdiqlash kodingiz: ",
    },
  },
  ru: {
    for_sign_up: {
      subject: "Код подтверждения для Almond.uz (действителен только 10 минут)",
      text: "Ваш код подтверждения: ",
    },
  },
  en: {
    for_sign_up: {
      subject: "Verification Code for Almond.uz (valid only for 10 minutues)",
      text: "Your verification code: ",
    },
  },
};

interface SignupResponsesTypes {
  sent_to_email: string;
  sent_to_phone_number: string;
}

export const signup_responses: Record<Locale, SignupResponsesTypes> = {
  uz: {
    sent_to_email: "Tasdiqlash kodi elektron pochtangizga yuborildi.",
    sent_to_phone_number: "Tasdiqlash kodi telefon raqamingizga yuborildi.",
  },
  ru: {
    sent_to_email: "Код подтверждения был отправлен на вашу электронную почту.",
    sent_to_phone_number:
      "Код подтверждения был отправлен на ваш номер телефона.",
  },
  en: {
    sent_to_email: "Verification code has been sent to your email.",
    sent_to_phone_number:
      "Verification code has been sent to your phone number.",
  },
};
