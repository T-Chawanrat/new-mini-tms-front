export const toNum = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const moneyValue = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "";
};

export const isWeightFix = (item?: any) => {
  return String(item?.is_weight_fix || "").toUpperCase() === "Y";
};

export const findRateBySize = <T extends { size_min?: unknown; size_max?: unknown }>(details: T[], q: number) => {
  return details.find((item) => {
    const min = toNum(item.size_min);
    const max = toNum(item.size_max);

    return q >= min && q <= max;
  });
};

export const findRateByWeight = <T extends { weight_min?: unknown; weight_max?: unknown }>(details: T[], weight: number) => {
  return details.find((item) => {
    const min = toNum(item.weight_min);
    const max = toNum(item.weight_max);

    return weight >= min && weight <= max;
  });
};

export const calculatePackageRate = <
  T extends {
    size_min?: unknown;
    size_max?: unknown;
    weight_min?: unknown;
    weight_max?: unknown;
    cost?: unknown;
  }
>(
  details: T[],
  q: number,
  weight: number
) => {
  const sizeRate = findRateBySize(details, q);
  const weightRate = findRateByWeight(details, weight);

  if (!sizeRate && !weightRate) return null;
  if (sizeRate && !weightRate) return sizeRate;
  if (!sizeRate && weightRate) return weightRate;

  return toNum(sizeRate.cost) >= toNum(weightRate.cost) ? sizeRate : weightRate;
};