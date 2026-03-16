import { useQuery } from '@tanstack/react-query';
import * as currencyApi from '@/api/currency-api';

export function useExchangeRates() {
  return useQuery({
    queryKey: ['currency', 'rates'],
    queryFn: currencyApi.getRates,
    staleTime: 1000 * 60 * 30, // rates are stable, refresh every 30 min
  });
}

export function useSupportedCurrencies() {
  return useQuery({
    queryKey: ['currency', 'supported'],
    queryFn: currencyApi.getSupportedCurrencies,
    staleTime: Infinity,
  });
}

/**
 * Client-side currency conversion using cached rates.
 * Returns a convert function that can be used synchronously.
 */
export function useConvert() {
  const { data: rates } = useExchangeRates();

  return (amount: number, from: string, to: string): number | null => {
    if (from === to) return amount;
    if (!rates) return null;
    const key = `${from}-${to}`;
    const rate = rates[key];
    if (rate == null) return null;
    return amount * rate;
  };
}
