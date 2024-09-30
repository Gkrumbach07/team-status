# Sprint Metrics Dashboard

This is a Next.js application that provides a dashboard for tracking sprint metrics across GitHub and Jira.

## Features

- Fetch and display metrics for selected sprints
- Visualize data with charts and tables
- Configurable settings for GitHub and Jira integration
- Responsive design for various screen sizes

## Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- A GitHub account with access to the repository you want to track
- A Jira account with access to the board you want to track

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sprint-metrics-dashboard.git
   cd sprint-metrics-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

When you first run the application, you'll be prompted to enter your settings. These include:

- GitHub Token
- Jira Access Token
- Jira Host
- GitHub Owner
- GitHub Repository
- Jira Board ID

These settings are stored locally in your browser and can be updated at any time through the settings modal.

## Usage

1. Configure your settings when prompted or by clicking the settings icon.
2. Select the sprints you want to analyze using the sprint selector.
3. Click "Fetch Metrics" to retrieve and display the data.
4. Use the various views and charts to analyze your sprint metrics.

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