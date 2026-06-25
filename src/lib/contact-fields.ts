/** True when the value is mostly digits (user entered a phone number as a name). */
export function looksLikePhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8) return false;
  const nonSpace = trimmed.replace(/\s/g, "");
  return digits.length / nonSpace.length >= 0.7;
}

export function normalizeIndianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

export function validateContactPersonName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Contact person name is required";
  if (looksLikePhoneNumber(trimmed)) {
    return "Enter the contact person's name, not the mobile number";
  }
  if (trimmed.length < 2) return "Contact person name is too short";
  return null;
}

export function validateContactNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "Contact number is required";
  if (!normalizeIndianPhone(trimmed)) {
    return "Enter a valid 10-digit Indian mobile number";
  }
  return null;
}
