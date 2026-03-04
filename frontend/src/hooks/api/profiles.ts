import { api } from "@/lib/api";
import type {
  Profile,
  ProfileCreate,
  ProfileDetail,
  ProfileUpdate,
  VersionMatrix,
} from "@/types";

export const fetchProfiles = () => api.get("profiles").json<Profile[]>();

export const fetchProfile = (id: number) =>
  api.get(`profiles/${id}`).json<ProfileDetail>();

export const createProfile = (data: ProfileCreate) =>
  api.post("profiles", { json: data }).json<ProfileDetail>();

export const updateProfile = (id: number, data: ProfileUpdate) =>
  api.put(`profiles/${id}`, { json: data }).json<ProfileDetail>();

export const deleteProfile = (id: number) =>
  api.delete(`profiles/${id}`);

export const addModToProfile = (profileId: number, modId: number) =>
  api.post(`profiles/${profileId}/mods`, { json: { mod_id: modId } }).json<ProfileDetail>();

export const removeModFromProfile = (profileId: number, modId: number) =>
  api.delete(`profiles/${profileId}/mods/${modId}`).json<ProfileDetail>();

export const fetchProfileMatrix = (id: number) =>
  api.get(`profiles/${id}/matrix`).json<VersionMatrix>();
