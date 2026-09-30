export const formatINR = (value: number | string) => {
  const numericValue = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};
