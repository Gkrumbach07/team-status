import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricDataPoint, Metrics } from "@/types/metrics";

interface TeamMemberMetricsProps {
  metrics: Metrics;
  teamMember: string;
}

export default function TeamMemberMetrics({ metrics, teamMember }: TeamMemberMetricsProps) {
  const calculateMetric = (metricArray: MetricDataPoint[], defaultValue: number = 0) => {
    const teamMemberMetrics = metricArray.filter(m => m.teamMember === teamMember);
		if (teamMemberMetrics.length === 0) return defaultValue;
		if (teamMemberMetrics[0].value === undefined) return teamMemberMetrics.length;
    return teamMemberMetrics.reduce((sum, m) => sum + (m.value || 0), 0);
  };

  const pointsCompleted = calculateMetric(metrics.pointsCompleted, 0);
  const avgTimeToMergePR = calculateMetric(metrics.timeToMergePR) / metrics.timeToMergePR.filter(m => m.teamMember === teamMember).length || 0;
  const reviewsGiven = calculateMetric(metrics.reviewsGiven, 0);
  const qaValidations = calculateMetric(metrics.qaValidations, 0);
  const avgReviewComments = calculateMetric(metrics.reviewComments) / metrics.reviewComments.filter(m => m.teamMember === teamMember).length || 0;
  const avgTimeInProgress = calculateMetric(metrics.timeInProgress) / metrics.timeInProgress.filter(m => m.teamMember === teamMember).length || 0;
  const reviewCommentsGiven = calculateMetric(metrics.reviewCommentsGiven, 0);
  const jirasCompleted = metrics.jirasCompleted.filter(m => m.teamMember === teamMember).length;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{teamMember}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          <li>Points Completed: {pointsCompleted.toFixed(2)}</li>
          <li>Jiras Completed: {jirasCompleted}</li>
          <li>Avg Time to Merge PR: {avgTimeToMergePR.toFixed(2)} days</li>
          <li>Reviews Given: {reviewsGiven.toFixed(2)}</li>
          <li>QA Validations: {qaValidations.toFixed(2)}</li>
          <li>Avg Review Comments Received: {avgReviewComments.toFixed(2)}</li>
          <li>Avg Time in Progress: {avgTimeInProgress.toFixed(2)} days</li>
          <li>Review Comments Given: {reviewCommentsGiven.toFixed(2)}</li>
        </ul>
      </CardContent>
    </Card>
  )
}