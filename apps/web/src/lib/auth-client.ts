import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
console.log(import.meta.env.VITE_API_URL);

export const authClient = createAuthClient({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://10.2.17.78:1337" ||
    process.env.VITE_API_URL,
  plugins: [anonymousClient()],
});
