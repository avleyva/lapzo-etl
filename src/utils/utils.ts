export const MAX_RECORDS_TO_INSERT = 100;
export const WAITNING_TIME_BETWEEN_LOADS = 500;

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
