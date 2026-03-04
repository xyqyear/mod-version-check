import ky from "ky";

export const api = ky.create({
  prefixUrl: "/api",
  timeout: 15_000,
});
