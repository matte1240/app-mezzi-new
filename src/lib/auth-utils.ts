import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function checkRole(...allowedRoles: string[]) {
  const user = await getSessionUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export function canManageVehicles(role: string) {
  return role === "ADMIN" || role === "FLEET_MANAGER";
}

export function canManageUsers(role: string) {
  return role === "ADMIN";
}

export function canManageDeadlines(role: string) {
  return role === "ADMIN" || role === "FLEET_MANAGER";
}

export function canUploadDocuments(role: string) {
  return role === "ADMIN" || role === "FLEET_MANAGER";
}

export function canRecordTrips(role: string) {
  return role === "ADMIN" || role === "FLEET_MANAGER" || role === "DRIVER";
}

export function canViewTripAnomalies(role: string) {
  return canRecordTrips(role);
}

export function canManageTripAnomalies(role: string) {
  return role === "ADMIN" || role === "FLEET_MANAGER";
}
