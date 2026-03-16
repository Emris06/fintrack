import { useQuery } from '@tanstack/react-query';
import * as aiApi from '@/api/ai-api';

export function usePredictCategory(description: string) {
  return useQuery({
    queryKey: ['ai', 'predict-category', description],
    queryFn: () => aiApi.predictCategory(description),
    enabled: description.length >= 3,
  });
}

export function useAnomalies() {
  return useQuery({
    queryKey: ['ai', 'anomalies'],
    queryFn: aiApi.getAnomalies,
  });
}

export function useInsights() {
  return useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: aiApi.getInsights,
  });
}
