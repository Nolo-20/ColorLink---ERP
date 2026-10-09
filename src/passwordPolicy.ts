/**
 * Misma política que valida el backend (validatePasswordPolicy en server.ts).
 * Devuelve el mensaje de error, o null si la contraseña cumple.
 */
export function passwordPolicyError(pw: string): string | null {
  if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(pw)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(pw)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Debe incluir al menos un carácter especial (por ejemplo: ! @ # $ %).';
  return null;
}

export const PASSWORD_POLICY_HINT =
  'Mínimo 8 caracteres, con al menos una mayúscula, un número y un carácter especial (! @ # $ %).';
