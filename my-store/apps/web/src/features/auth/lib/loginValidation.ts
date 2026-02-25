/**
 * Login form validation – đồng nhất với registerValidation.
 */

export interface LoginFormData {
  email: string; // Tài khoản hoặc email
  password: string;
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const PASSWORD_MIN_LENGTH = 8;

export function validateLoginForm(formData: LoginFormData): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  const account = (formData.email ?? "").trim();
  if (!account) {
    errors.email = "Tài khoản hoặc email không được để trống";
  }

  const password = formData.password ?? "";
  if (!password) {
    errors.password = "Mật khẩu không được để trống";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
  }

  return errors;
}
