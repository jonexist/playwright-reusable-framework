import { createResourceMatchers } from "../../core/api/response-matchers";

/** Network matchers per resource. One line each instead of ~8 hand-written functions. */
export const itemApi = createResourceMatchers("/api/items", {
  idPattern: "\\d+",
});

export const workspaceApi = createResourceMatchers("/api/workspaces", {
  idPattern: "\\d+",
});
