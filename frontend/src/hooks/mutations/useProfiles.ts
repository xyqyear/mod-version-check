import {
  addModToProfile,
  createProfile,
  deleteProfile,
  removeModFromProfile,
  updateProfile,
} from "@/hooks/api/profiles";
import { queryKeys } from "@/lib/query-keys";
import type { ProfileCreate, ProfileUpdate } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileCreate) => createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProfileUpdate }) =>
      updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.matrix(id) });
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
    },
  });
};

export const useAddModToProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, modId }: { profileId: number; modId: number }) =>
      addModToProfile(profileId, modId),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(profileId) });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.matrix(profileId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sync.status });
      }, 3000);
    },
  });
};

export const useRemoveModFromProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, modId }: { profileId: number; modId: number }) =>
      removeModFromProfile(profileId, modId),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.matrix(profileId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mods.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sync.status });
    },
  });
};
