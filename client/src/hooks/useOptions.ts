import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Option, InsertOption } from "@shared/schema";

export function useOptions() {
  return useQuery<Option[]>({
    queryKey: ["/api/options"],
  });
}

export function useAddOption() {
  return useMutation({
    mutationFn: async (data: InsertOption) => {
      const res = await apiRequest("POST", "/api/options", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
    },
  });
}

export function useDeleteOption() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/options/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
    },
  });
}

export function useAnalyzeHedging() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/options/analyze-hedging");
      return await res.json();
    },
  });
}

export function useAnalyzeOption() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/options/${id}/analyze`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
    },
  });
}
