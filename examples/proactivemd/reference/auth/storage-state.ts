import path from "node:path";

const authDir = path.resolve(__dirname, "../../auth");

export const storageStatePaths = {
  admin: path.join(authDir, "admin.storage-state.json"),
  standardUser: path.join(authDir, "user.storage-state.json"),
  restrictedUser: path.join(authDir, "restricted-user.storage-state.json"),
  tenantContext: path.join(authDir, "tenant-context.storage-state.json"),
} as const;
