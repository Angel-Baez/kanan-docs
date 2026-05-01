/**
 * Convierte números a palabras en español dominicano
 * Ej: 210276 -> "Doscientos diez mil doscientos setenta y seis pesos dominicanos"
 */
export function numberToWords(num: number): string {
  const ones = [
    "",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];
  const teens = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];
  const tens = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];
  const scales = ["", "mil", "millón", "mil millones", "billón"];

  if (num === 0) return "cero";

  function convertGroup(n: number): string {
    let result = "";

    // Centenas
    const hundreds = Math.floor(n / 100);
    if (hundreds > 0) {
      const hundredNames = [
        "",
        "ciento",
        "doscientos",
        "trescientos",
        "cuatrocientos",
        "quinientos",
        "seiscientos",
        "setecientos",
        "ochocientos",
        "novecientos",
      ];
      result += hundredNames[hundreds] + " ";
    }

    // Decenas y unidades
    const remainder = n % 100;
    if (remainder >= 10 && remainder < 20) {
      result += teens[remainder - 10] + " ";
    } else {
      const tens_digit = Math.floor(remainder / 10);
      const ones_digit = remainder % 10;

      if (tens_digit > 0) {
        result += tens[tens_digit] + " ";
        if (ones_digit > 0) result += "y ";
      }

      if (ones_digit > 0) {
        result += ones[ones_digit] + " ";
      }
    }

    return result.trim();
  }

  let words = "";
  let groupIndex = 0;
  let isFirstGroup = true;

  while (num > 0) {
    const group = num % 1000;

    if (group > 0) {
      let groupWords = convertGroup(group);

      // Aplicar reglas especiales para "mil"
      if (groupIndex === 1 && group === 1) {
        groupWords = "mil";
      } else if (groupIndex === 1) {
        groupWords += " mil";
      } else if (groupIndex > 1) {
        const scale = scales[groupIndex];
        if (group === 1 && groupIndex === 2) {
          groupWords = "un millón";
        } else {
          groupWords += ` ${scale}`;
        }
      }

      if (!isFirstGroup) {
        words = " " + words;
      }
      words = groupWords + words;
      isFirstGroup = false;
    }

    num = Math.floor(num / 1000);
    groupIndex++;
  }

  return words.trim();
}

/**
 * Formatea un monto en dinero a palabras en español dominicano
 * Ej: 210276 -> "Doscientos diez mil doscientos setenta y seis pesos dominicanos"
 */
export function formatMoneyInWords(amount: number): string {
  const palabras = numberToWords(amount);
  return `${palabras.charAt(0).toUpperCase()}${palabras.slice(1)} pesos dominicanos`;
}

/**
 * Genera una línea formateada con número y sus equivalentes en palabras
 * Ej: "RD$210,276.00 (Doscientos diez mil doscientos setenta y seis pesos dominicanos)"
 */
export function formatMoneyWithWords(
  amount: number,
  currency: string = "RD$",
): string {
  const formatted = amount.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} (${formatMoneyInWords(amount)})`;
}
