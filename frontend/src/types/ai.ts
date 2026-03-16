export interface AiInsightResponse {
  type: string;
  title: string;
  message: string;
  severity: string;
  data?: Record<string, unknown>;
}
