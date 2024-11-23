import { Locale } from "../types/shared.types";

interface SignupErrorsTypes {
  email_empty: string;
  email_already_exists: string;
  short_password: string;
  long_password: string;
  sending_verification_code: string;
  invalid_email: string;
  invalid_first_name: string;
  invalid_family_name: string;
  invalid_phone_number: string;
  phone_number_already_exists: string;
}

export const signup_errors: Record<Locale, SignupErrorsTypes> = {
  uz: {
    email_empty: "Elektron pochtangizni kiriting.",
    email_already_exists:
      "Bu foydalanuvchi allaqachon mavjud. Yangi elektron pochtani sinab ko'ring.",
    short_password: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.",
    long_password: "Parol ko'pi bilan 64 ta belgidan iborat bo'lishi kerak.",
    sending_verification_code:
      "Tasdiqlash kodini yuborishda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.",
    invalid_email: "Iltimos, to'g'ri elektron pochta manzilini kiriting.",
    invalid_first_name: "Iltimos, ismingizni to'g'ri kiriting.",
    invalid_family_name: "Iltimos, familiyangizni to'g'ri kiriting.",
    invalid_phone_number: "Iltimos, to'gri telefon raqam kiriting.",
    phone_number_already_exists:
      "Bu foydalanuvchi allaqachon mavjud. Yangi telefon raqamni sinab ko'ring.",
  },
  ru: {
    email_empty: "Введите свой адрес электронной почты.",
    email_already_exists:
      "Это пользователь уже существует. Попробуйте новый адрес электронной почты.",
    short_password: "Пароль должен содержать не менее 8 символов.",
    long_password: "Пароль должен содержать не более 64 символов.",
    sending_verification_code:
      "Произошла ошибка при отправке кода подтверждения. Пожалуйста, повторите попытку позже.",
    invalid_email: "Подалуйста, введите правильный адрес электронной почты.",
    invalid_first_name: "Пожалуйста, введите верное имя.",
    invalid_family_name: "Пожалуйста, введите действительную фамилию.",
    invalid_phone_number: "Пожалуйста, введите действительный номер телефона.",
    phone_number_already_exists:
      "Этот пользователь уже существует. Попробуйте новый номер телефона.",
  },
  en: {
    email_empty: "Enter your email.",
    email_already_exists: "This user already exists. Try a new email.",
    short_password: "Password must contain at least 8 characters.",
    long_password: "Password must contain at most 64 characters.",
    sending_verification_code:
      "An error occurred while sending the verification code. Please try again later.",
    invalid_email: "Please enter a valid email.",
    invalid_first_name: "Please enter a valid name.",
    invalid_family_name: "Please, enter a valid family name.",
    invalid_phone_number: "Please, enter a valid phone number.",
    phone_number_already_exists:
      "This user already exists. Try a new phone number.",
  },
};

// --------------------------------------------------------------------------------- //
interface LoginErrorsTypes {
  incorrect_credentials_email: string;
  incorrect_credentials_phone_number: string;
}

export const login_errors: Record<Locale, LoginErrorsTypes> = {
  uz: {
    incorrect_credentials_email: "Parol yoki elektron pochta noto'g'ri.",
    incorrect_credentials_phone_number: "Parol yoki telefon raqam noto'g'ri.",
  },
  ru: {
    incorrect_credentials_email: "Пароль или адрес электронной почты неверны.",
    incorrect_credentials_phone_number: "Пароль или номер телефона неверный.",
  },
  en: {
    incorrect_credentials_email: "Password or email is not correct.",
    incorrect_credentials_phone_number:
      "Password or phone number is not correct.",
  },
};

// --------------------------------------------------------------------------------- //
interface VerifyErrorsTypes {
  code_absent: string;
  code_invalid: string;
  code_expired: string;
  code_not_numeric: string;
}

export const verify_errors: Record<Locale, VerifyErrorsTypes> = {
  uz: {
    code_absent: "Iltimos, tasdiqlash kodini kiriting.",
    code_invalid: "Tasdiqlash kodi xato.",
    code_expired: "Tasdiqlash kodi muddati tugagan. Iltimos, yangi kod oling.",
    code_not_numeric:
      "Tasdiqlash kodi faqat raqamlardan iborat bo'lishi kerak.",
  },
  ru: {
    code_absent: "Пожалуйста, введите код подтверждения.",
    code_invalid: "Неверный код подтверждения.",
    code_expired:
      "Срок действия кода подтверждения истек. Пожалуйста, получите новый код.",
    code_not_numeric: "Код подтверждения должен состоять только из цифр.",
  },
  en: {
    code_absent: "Please enter the verification code.",
    code_invalid: "Invalid verification code.",
    code_expired: "The verification code has expired. Please get a new code.",
    code_not_numeric: "The verification code should consists of only numbers.",
  },
};

// --------------------------------------------------------------------------------- //
interface SendVCodeErrorsTypes {
  user_not_found: string;
}

export const send_v_code_errors: Record<Locale, SendVCodeErrorsTypes> = {
  uz: {
    user_not_found:
      "Nimadir noto'g'ri bajarildi. Iltimos, qayta ro'yxatdan o'tishga urinib ko'ring.",
  },
  ru: {
    user_not_found:
      "Что-то пошло не так. Пожалуйста, попробуйте зарегистрироваться еще раз.",
  },
  en: {
    user_not_found: "Something went wrong. Please try to sign up again.",
  },
};

// --------------------------------------------------------------------------------- //
interface PotectRoutesErrorsTypes {
  user_changed_password: string;
}

export const protect_routes_errors: Record<Locale, PotectRoutesErrorsTypes> = {
  uz: {
    user_changed_password:
      "Foydalanuvchi yaqinda parolini o'zgartirdi. Iltimos, tizimga qayta kiring.",
  },
  ru: {
    user_changed_password:
      "Пользователь недавно сменил свой пароль. Пожалуйста, войдите снова.",
  },
  en: {
    user_changed_password:
      "User has changed their password recently. Please log in again.",
  },
};

export const token_errors = {
  invalid_token: {
    is_token_error: true,
    message: "Invalid token. New log in required.",
  },
  expired_token: {
    is_token_error: true,
    message: "Expired token. New log in required.",
  },
};
