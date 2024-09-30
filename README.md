# Sprint Metrics Dashboard

This project is a dashboard for visualizing sprint metrics, integrating data from Jira and GitHub.

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/sprint-metrics-dashboard.git
   cd sprint-metrics-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the `.env.example` file to `.env.local`:
   ```
   cp .env.example .env.local
   ```

4. Edit `.env.local` and fill in your environment variables (see Environment Variables section below). You can also edit these envs in the settings.

5. Run the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Environment Variables

The following environment variables need to be set in your `.env.local` file:
- `GITHUB_TOKEN`: GitHub personal access token for API authentication
- `JIRA_ACCESS_TOKEN`: Jira API access token for authentication
- `JIRA_HOST`: Jira instance hostname
- `GITHUB_OWNER`: GitHub repository owner (organization or user)
- `GITHUB_REPO`: GitHub repository name
- `JIRA_BOARD_ID`: Jira board ID for the project

These values are stored in your localstorage too for convenience.

## Metrics Explanation

The dashboard displays various metrics calculated from Jira and GitHub data. Here's how each metric is created:

1. **Points Completed**: Sum of story points for all completed issues in the sprint.
   - Calculation: `metrics.pointsCompleted.reduce((sum, point) => sum + (point.value || 0), 0)`

2. **Jiras Completed**: Total number of Jira issues completed in the sprint.
   - Calculation: `metrics.jirasCompleted.length`

3. **Average Time to Merge PR**: Average time from PR creation to merge.
   - Calculation: `metrics.timeToMergePR.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToMergePR.length`

4. **Reviews Given**: Total number of PR reviews performed.
   - Calculation: `metrics.reviewsGiven.length`

5. **QA Validations**: Number of QA validations performed.
   - Calculation: `metrics.qaValidations.length`

6. **Average Review Comments**: Average number of comments per PR review.
   - Calculation: `metrics.reviewComments.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.reviewComments.length`

7. **Average Time in Progress**: Average time issues spend in the "In Progress" status.
   - Calculation: `metrics.timeInProgress.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeInProgress.length`

8. **Review Comments Given**: Total number of PR review comments given.
   - Calculation: `metrics.reviewCommentsGiven.reduce((sum, point) => sum + (point.value || 0), 0)`

9. **Average Time to QA Contact**: Average time from issue creation to first QA contact.
   - Calculation: `metrics.timeToQAContact.reduce((sum, point) => sum + (point.value || 0), 0) / metrics.timeToQAContact.length`

10. **Bug Count**: Number of bugs reported in the sprint.
    - Calculation: `metrics.bugCount.length`

11. **Story Count**: Number of user stories in the sprint.
    - Calculation: `metrics.storyCount.length`

12. **Task Count**: Number of tasks in the sprint.
    - Calculation: `metrics.taskCount.length`

13. **Sub-task Count**: Number of sub-tasks in the sprint.
    - Calculation: `metrics.subTaskCount.length`

These metrics are calculated in the `calculateSummary` function in `SprintMetrics.tsx` and are based on the data processed in `actions.ts`. The raw data for each metric is collected by analyzing Jira issues, sprints, and GitHub pull requests associated with the specified Jira board and GitHub repository.

In `actions.ts`, the `processMetrics` function handles the detailed calculation of each metric, including:
- Mapping GitHub usernames to Jira display names
- Calculating time-based metrics (e.g., time to merge PR, time in progress)
- Counting different types of issues (bugs, stories, tasks, sub-tasks)
- Processing PR reviews and comments

The resulting metrics are then displayed in the `SprintSummary` component and can be further explored in the detailed views.

## Warning

This project is in active development and may contain bugs. Use it at your own risk and always verify important data against your Jira and GitHub sources.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](https://choosealicense.com/licenses/mit/)