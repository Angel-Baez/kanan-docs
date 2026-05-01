# Conversión de Números a Letras

Este módulo proporciona funciones para convertir números a palabras en español dominicano, especialmente útil para documentos legales, facturas y contratos.

## Funciones

### `numberToWords(num: number): string`

Convierte un número a su representación en palabras.

**Ejemplos:**

```typescript
numberToWords(0); // "cero"
numberToWords(1); // "uno"
numberToWords(21); // "veintiuno"
numberToWords(100); // "ciento"
numberToWords(1000); // "mil"
numberToWords(210276); // "doscientos diez mil doscientos setenta y seis"
numberToWords(1000000); // "un millón"
```

### `formatMoneyInWords(amount: number): string`

Formatea un monto en dinero a palabras con la expresión "pesos dominicanos".

**Ejemplos:**

```typescript
formatMoneyInWords(210276); // "Doscientos diez mil doscientos setenta y seis pesos dominicanos"
formatMoneyInWords(950000); // "Novecientos cincuenta mil pesos dominicanos"
formatMoneyInWords(1350000); // "Un millón trescientos cincuenta mil pesos dominicanos"
```

### `formatMoneyWithWords(amount: number, currency?: string): string`

Genera una línea formateada con el número de moneda y sus equivalentes en palabras.

**Ejemplos:**

```typescript
formatMoneyWithWords(210276);
// "RD$ 210,276.00 (Doscientos diez mil doscientos setenta y seis pesos dominicanos)"

formatMoneyWithWords(950000);
// "RD$ 950,000.00 (Novecientos cincuenta mil pesos dominicanos)"
```

## Casos de Uso

### En Facturas

```typescript
const total = 4_200_000;
const invoice = {
  amount: `RD$ ${total.toLocaleString("es-DO")}`,
  amountInWords: formatMoneyInWords(total),
};
```

### En Contratos

```typescript
const contractAmount = 2_500_000;
const clausula = `El monto total acordado es de ${formatMoneyWithWords(contractAmount)}.`;
```

### En Documentos de Pago

```typescript
const payment = 500_000;
const receipt = {
  paidAmount: formatMoneyInWords(payment),
  reference: `Se recibieron ${formatMoneyInWords(payment)}.`,
};
```

## Características

✅ Soporta números desde 0 hasta billones  
✅ Convierte correctamente unidades, decenas, centenas  
✅ Maneja correctamente "mil", "millón", etc.  
✅ Capitaliza correctamente la primera letra  
✅ Incluye "pesos dominicanos" al final  
✅ Compatible con TypeScript y JavaScript

## Límites

- Máximo soportado: números hasta 999 billones
- Mínimo: 0
- Los números decimales se redondean al entero más cercano

## Integración en seed.ts

Las funciones ya están integradas en `seed.ts` para mostrar montos en documentos:

```typescript
// Ejemplo en cotización
estimatedRange: `RD$${Math.round(ctx.totalAmount * 0.9).toLocaleString()} – RD$${ctx.totalAmount.toLocaleString()} (${formatMoneyInWords(ctx.totalAmount)})`;

// Ejemplo en contrato
body: `El monto total acordado es de RD$${ctx.totalAmount.toLocaleString()} (${formatMoneyInWords(ctx.totalAmount)}). Se pagará en tres tractos...`;
```
