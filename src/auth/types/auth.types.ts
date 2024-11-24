export interface SignupWithPhoneNumberRequestBody {
  first_name: string;
  password: string;
  phone_number_details: {
    country_code: string;
    phone_number: string;
  };
}

export interface SignupWithEmailRequestBody {
  first_name: string;
  password: string;
  email: string;
}
