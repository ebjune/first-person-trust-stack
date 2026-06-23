import { userDb } from "../client.js";

export interface AddUserVtaInput {
  userId: string;
  did: string;
  label: string;
  custodyMode: "sovereign" | "delegated" | "custodial";
}

export interface UpdateUserVtaInput {
  label?: string;
  custodyMode?: "sovereign" | "delegated" | "custodial";
}

/** Add a VTA to a user's managed agents. */
export async function addUserVta(input: AddUserVtaInput) {
  return userDb.userVta.create({
    data: {
      userId: input.userId,
      did: input.did,
      label: input.label,
      custodyMode: input.custodyMode,
    },
  });
}

/** Get all VTAs for a user. */
export async function getUserVtas(userId: string) {
  return userDb.userVta.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/** Get a specific VTA by DID. */
export async function getUserVtaByDid(did: string) {
  return userDb.userVta.findUnique({
    where: { did },
    include: { user: true },
  });
}

/** Update a VTA's label or custody mode. */
export async function updateUserVta(id: string, input: UpdateUserVtaInput) {
  return userDb.userVta.update({
    where: { id },
    data: input,
  });
}

/** Remove a VTA from a user's managed agents. */
export async function removeUserVta(id: string) {
  return userDb.userVta.delete({
    where: { id },
  });
}
