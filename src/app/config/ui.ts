import { configureUi } from "../../core/config/ui-conventions";

/**
 * App-specific UI conventions. Import this file for its side effect from the
 * fixtures module so every spec gets the same overrides.
 *
 * The demo app already matches the framework defaults, so only the debounce
 * differs. A real project overrides whatever its design system renders, e.g.
 * ProactiveMD (shadcn DataTable) keeps the defaults but uses a 600 ms search
 * debounce; another app might use `readyText: "Showing"` or a different
 * skeleton class (see examples/proactivemd/README.md).
 */
configureUi({
  dataTable: {
    searchDebounceMs: 300,
  },
});
