export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s.\-()]/g, "");

  let digits = cleaned;
  if (cleaned.startsWith("+33")) digits = "0" + cleaned.slice(3);
  else if (cleaned.startsWith("0033")) digits = "0" + cleaned.slice(4);

  if (!/^0[1-9]\d{8}$/.test(digits)) {
    throw new Error("Numero de telephone francais invalide (ex: 06 12 34 56 78)");
  }

  return digits.match(/.{2}/g)!.join(" ");
}

export function normalizeTitleCase(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_match, sep, letter) => sep + letter.toUpperCase());
}
