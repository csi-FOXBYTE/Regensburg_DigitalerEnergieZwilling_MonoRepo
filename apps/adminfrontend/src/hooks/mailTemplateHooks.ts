import {
  deleteApiAdminMailTemplatesFeedback,
  getApiAdminMailTemplatesFeedback,
  postApiAdminMailTemplatesFeedbackPreview,
  putApiAdminMailTemplatesFeedback,
  type GetApiAdminMailTemplatesFeedback200,
} from "@/api/api.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type FeedbackMailTemplate = GetApiAdminMailTemplatesFeedback200;

const templateKey = ["mail-template", "feedback"] as const;

export function useFeedbackMailTemplate() {
  return useQuery({
    queryKey: templateKey,
    queryFn: getApiAdminMailTemplatesFeedback,
  });
}

export function useSaveFeedbackMailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (html: string) => putApiAdminMailTemplatesFeedback({ html }),
    onSuccess: (template) => queryClient.setQueryData(templateKey, template),
  });
}

export function useResetFeedbackMailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteApiAdminMailTemplatesFeedback(),
    onSuccess: (template) => queryClient.setQueryData(templateKey, template),
  });
}

// Rendered by the backend with example feedback, exactly as a real
// notification would be. Disabled for empty input, which cannot be saved.
export function useFeedbackMailTemplatePreview(html: string) {
  return useQuery({
    queryKey: ["mail-template", "feedback", "preview", html],
    queryFn: () => postApiAdminMailTemplatesFeedbackPreview({ html }),
    enabled: html.trim().length > 0,
    retry: false,
    placeholderData: (previous) => previous,
    staleTime: Infinity,
  });
}
