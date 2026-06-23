import { userDb } from "../client.js";

export interface JoinVtcInput {
  userId: string;
  cdid: string;
  role: "admin" | "member" | "viewer";
}

/** Add a user to a VTC community. */
export async function joinVtc(input: JoinVtcInput) {
  return userDb.vtcMembership.create({
    data: {
      userId: input.userId,
      cdid: input.cdid,
      role: input.role,
      status: "active",
    },
  });
}

/** Get all VTC memberships for a user. */
export async function getUserMemberships(userId: string) {
  return userDb.vtcMembership.findMany({
    where: { userId, status: "active" },
    orderBy: { joinedAt: "asc" },
  });
}

/** Get all members of a VTC community. */
export async function getVtcMembers(cdid: string) {
  return userDb.vtcMembership.findMany({
    where: { cdid, status: "active" },
    include: { user: true },
  });
}

/** Update a user's role in a VTC. */
export async function updateMembershipRole(
  userId: string,
  cdid: string,
  role: "admin" | "member" | "viewer",
) {
  return userDb.vtcMembership.update({
    where: { userId_cdid: { userId, cdid } },
    data: { role },
  });
}

/** Mark a user as having left a VTC. */
export async function leaveVtc(userId: string, cdid: string) {
  return userDb.vtcMembership.update({
    where: { userId_cdid: { userId, cdid } },
    data: { status: "left" },
  });
}

/** Suspend a user's VTC membership. */
export async function suspendMembership(userId: string, cdid: string) {
  return userDb.vtcMembership.update({
    where: { userId_cdid: { userId, cdid } },
    data: { status: "suspended" },
  });
}
