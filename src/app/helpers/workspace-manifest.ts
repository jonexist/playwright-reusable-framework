import { createRunManifest } from "../../core/helpers/run-manifest";

/** Data handed from setup projects to the specs that depend on them. */
export type WorkspaceManifest = {
  workspaceName: string;
};

export const workspaceManifest = createRunManifest<WorkspaceManifest>({
  fileName: "workspace-manifest.json",
  setupHint: "Run the setup projects first: `npm run test:e2e:setup`.",
});
