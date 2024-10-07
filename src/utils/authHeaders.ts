import { useAccessToken } from '@/contexts/AccessTokenContext';

export const useAuthHeaders = () => {
	const { githubToken, jiraAccessToken } = useAccessToken();

	return {
		'X-GitHub-Token': githubToken,
		'X-Jira-Token': jiraAccessToken,
	};
};