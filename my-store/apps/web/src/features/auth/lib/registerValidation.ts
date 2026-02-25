export interface RegisterFormData {
  lastName: string;
  firstName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
}

export interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const DOB_FORMAT = /^\d{2}\/\d{2}\/\d{4}$/;

export function validateRegisterForm(formData: RegisterFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!USERNAME_REGEX.test(formData.username)) {
    errors.username = "Tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới (3-30 ký tự)";
  }

  if (formData.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
  } else if (!PASSWORD_REGEX.test(formData.password)) {
    errors.password = "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số";
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  if (formData.dateOfBirth?.trim()) {
    const dob = formData.dateOfBirth.trim();
    const parts = dob.split("/");
    if (parts.length !== 3 || !DOB_FORMAT.test(dob)) {
      errors.dateOfBirth = "Ngày sinh phải có định dạng dd/mm/yyyy";
    } else {
      const [dd, mm, yyyy] = parts;
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      if (
        Number.isNaN(d.getTime()) ||
        d.getDate() !== Number(dd) ||
        d.getMonth() + 1 !== Number(mm)
      ) {
        errors.dateOfBirth = "Ngày sinh không hợp lệ";
      } else if (d > new Date()) {
        errors.dateOfBirth = "Ngày sinh không thể ở tương lai";
      }
    }
  }

  return errors;
}

/** Convert dd/mm/yyyy to YYYY-MM-DD for API */
export function dateOfBirthToApi(value: string): string | undefined {
  if (!value?.trim()) return undefined;
  const [dd, mm, yyyy] = value.trim().split("/");
  if (dd && mm && yyyy) return `${yyyy}-${mm}-${dd}`;
  return undefined;
}

/** Format raw digits to dd/mm/yyyy while typing */
export function formatDateOfBirthInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  const limited = digits.slice(0, 8);
  if (limited.length >= 5) {
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }
  if (limited.length >= 3) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  }
  return limited;
}
