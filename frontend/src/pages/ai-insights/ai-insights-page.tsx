import { useState, useEffect } from 'react';
import { useAnomalies, useInsights, usePredictCategory } from '@/hooks/use-ai';
import type { AiInsightResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  AlertOctagon,
  Brain,
  Lightbulb,
  Activity,
  Search,
  Loader2,
} from 'lucide-react';

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'anomaly':
      return AlertTriangle;
    case 'budget':
      return AlertOctagon;
    case 'spending':
      return Activity;
    default:
      return Lightbulb;
  }
}

function InsightCard({ insight }: { insight: AiInsightResponse }) {
  const Icon =
    insight.severity === 'critical'
      ? AlertOctagon
      : insight.severity === 'warning'
        ? AlertTriangle
        : getInsightIcon(insight.type);

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{insight.title}</p>
            <Badge variant="outline" className={getSeverityBadgeClass(insight.severity)}>
              {insight.severity}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{insight.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnomaliesTab() {
  const { data: anomalies, isLoading } = useAnomalies();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!anomalies?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No anomalies detected</p>
          <p className="text-sm text-muted-foreground">
            Your spending patterns look normal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {anomalies.map((anomaly, index) => (
        <InsightCard key={index} insight={anomaly} />
      ))}
    </div>
  );
}

function InsightsTab() {
  const { data: insights, isLoading } = useInsights();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!insights?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No insights yet</p>
          <p className="text-sm text-muted-foreground">
            Add more transactions to generate spending insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <InsightCard key={index} insight={insight} />
      ))}
    </div>
  );
}

function CategoryPredictionTab() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedDescription, setDebouncedDescription] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescription(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: prediction, isLoading, isFetching } = usePredictCategory(debouncedDescription);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-5 w-5" />
            Predict Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Transaction Description</Label>
            <Input
              id="description"
              placeholder="e.g. Starbucks coffee, Netflix subscription, Uber ride..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {isFetching || isLoading ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Predicting category...</p>
            </div>
          ) : prediction ? (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>Predicted Category</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-3 mt-2">
                  {prediction.color && (
                    <div
                      className="h-8 w-8 rounded-full shrink-0 border"
                      style={{ backgroundColor: prediction.color }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {prediction.icon && <span className="mr-2">{prediction.icon}</span>}
                      {prediction.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Type: {prediction.type}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <Brain className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Type a description to predict the category
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Smart analysis of your spending patterns and predictions.
        </p>
      </div>

      <Tabs defaultValue="anomalies">
        <TabsList>
          <TabsTrigger value="anomalies">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="prediction">
            <Brain className="mr-2 h-4 w-4" />
            Category Prediction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies">
          <AnomaliesTab />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsTab />
        </TabsContent>

        <TabsContent value="prediction">
          <CategoryPredictionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
