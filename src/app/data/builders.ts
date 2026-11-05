import { uniqueName, uniqueSuffix } from "../../core/data/builders";

export type WorkspaceFormValues = { name: string };

export function buildWorkspaceValues(
  overrides: Partial<WorkspaceFormValues> = {}
): WorkspaceFormValues {
  return { name: uniqueName("Workspace"), ...overrides };
}

export type ItemFormValues = { name: string; description: string };

/** Unique per call so parallel workers never collide on a name. */
export function buildItemValues(
  overrides: Partial<ItemFormValues> = {}
): ItemFormValues {
  return {
    name: uniqueName("Item"),
    description: `Automated item ${uniqueSuffix()}`,
    ...overrides,
  };
}
