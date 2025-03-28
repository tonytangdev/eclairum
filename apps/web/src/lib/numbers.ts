export function formatNumber(
  num: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}
