import { useQuery } from "@tanstack/react-query";
import { fetchProfile, fetchProfileMatrix, fetchProfiles } from "@/hooks/api/profiles";
import { queryKeys } from "@/lib/query-keys";

export const useProfiles = () =>
  useQuery({
    queryKey: queryKeys.profiles.all,
    queryFn: fetchProfiles,
  });

export const useProfile = (id: number) =>
  useQuery({
    queryKey: queryKeys.profiles.detail(id),
    queryFn: () => fetchProfile(id),
  });

export const useProfileMatrix = (id: number) =>
  useQuery({
    queryKey: queryKeys.profiles.matrix(id),
    queryFn: () => fetchProfileMatrix(id),
  });
