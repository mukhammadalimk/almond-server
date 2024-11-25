export interface SignupWithPhoneNumberRequestBody {
  first_name: string;
  password: string;
  phone_number: string;
  country_code: string;
}

export interface SignupWithEmailRequestBody {
  first_name: string;
  password: string;
  email: string;
}
