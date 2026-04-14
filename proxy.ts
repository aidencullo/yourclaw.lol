export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/dashboard", "/api/provision", "/api/status"],
};
