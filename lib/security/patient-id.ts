const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ID_PATTERN = /^AC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]$/;

function randomCharacter() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return ALPHABET[values[0] % ALPHABET.length];
}

function checksum(value: string) {
  let total = 0;
  for (const character of value) {
    total = (total * 31 + ALPHABET.indexOf(character)) % ALPHABET.length;
  }
  return ALPHABET[total];
}

export function generatePatientId() {
  const body = Array.from({ length: 12 }, randomCharacter).join("");
  return `AC-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}-${checksum(body)}`;
}

export function normalizePatientId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidPatientId(value: string) {
  const normalized = normalizePatientId(value);
  if (!ID_PATTERN.test(normalized)) return false;
  const body = normalized.replaceAll("-", "").slice(0, 12);
  return checksum(body) === normalized.at(-1);
}
