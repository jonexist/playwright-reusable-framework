/**
 * The handful of UI strings/selectors the core page helpers rely on.
 *
 * ProactiveMD hard-coded these inside `BasePage` ("Rows per page",
 * `.animate-pulse`, "Open menu", ...). They are the only app-specific
 * assumptions in the reusable helpers, so they live here and are overridden
 * once per project with `configureUi()` (see `src/app/config/ui.ts`).
 */
export type UiConventions = {
  login: {
    emailLabel: string | RegExp;
    passwordLabel: string | RegExp;
    submitButtonName: string | RegExp;
    /** Locator scope for the inline login error (role=alert inside a form). */
    errorScope: string;
  };
  dataTable: {
    /** Text that only renders once the table chrome has mounted. */
    readyText: string;
    /** CSS selector for loading skeleton rows inside the table body. */
    skeletonSelector: string;
    /** Accessible name of the per-row actions button. */
    rowMenuButtonName: string;
    /** Debounce window of the table search box, used only as a last-resort wait. */
    searchDebounceMs: number;
  };
  filters: {
    /** Accessible name of the button that opens the filter menu. */
    buttonName: RegExp;
  };
  timeouts: {
    dataTableMs: number;
    searchMs: number;
    listResponseMs: number;
    menuMs: number;
  };
};

export const defaultUiConventions: UiConventions = {
  login: {
    emailLabel: "Email",
    passwordLabel: "Password",
    submitButtonName: "Sign in",
    errorScope: "form",
  },
  dataTable: {
    readyText: "Rows per page",
    skeletonSelector: "tbody .animate-pulse",
    rowMenuButtonName: "Open menu",
    searchDebounceMs: 600,
  },
  filters: {
    buttonName: /^Filters/,
  },
  timeouts: {
    dataTableMs: 30_000,
    searchMs: 45_000,
    listResponseMs: 15_000,
    menuMs: 10_000,
  },
};

/** Live, mutable view used by the core helpers. */
export const ui: UiConventions = structuredClone(defaultUiConventions);

type Overrides = {
  [K in keyof UiConventions]?: Partial<UiConventions[K]>;
};

/** Shallow-merges per group; call once at import time of your app layer. */
export function configureUi(overrides: Overrides): void {
  for (const group of Object.keys(overrides) as (keyof UiConventions)[]) {
    Object.assign(ui[group], overrides[group]);
  }
}
