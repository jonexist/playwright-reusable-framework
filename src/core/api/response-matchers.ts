import type { Response } from "@playwright/test";

export type ResponseMatcher = (response: Response) => boolean;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type QueryExpectation = Record<string, string | number | boolean>;

/** Pathname without a trailing slash (`/api/items/` -> `/api/items`). */
export function pathnameOf(response: Response): string {
  return new URL(response.url()).pathname.replace(/\/$/, "");
}

/**
 * One predicate for "this network response is the request I care about".
 *
 * - `path` as a string matches when the pathname ENDS WITH it, so the same
 *   matcher survives a proxy prefix (`/api/proxy/api/items`).
 * - `path` as a RegExp is tested against the whole pathname.
 * - `query` requires each key to equal the given value.
 * - `status` optionally constrains the response status.
 */
export function matchRequest(options: {
  method: HttpMethod;
  path: string | RegExp;
  query?: QueryExpectation;
  status?: (status: number) => boolean;
}): ResponseMatcher {
  const { method, path, query, status } = options;

  return (response) => {
    if (response.request().method() !== method) return false;

    const pathname = pathnameOf(response);
    const pathMatches =
      typeof path === "string" ? pathname.endsWith(path) : path.test(pathname);
    if (!pathMatches) return false;

    if (query) {
      const params = new URL(response.url()).searchParams;
      for (const [key, value] of Object.entries(query)) {
        if (params.get(key) !== String(value)) return false;
      }
    }

    return status ? status(response.status()) : true;
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ResourceMatchers = {
  /** GET `<base>` */
  list: ResponseMatcher;
  /** GET `<base>?search=<q>` */
  listSearch: (query: string) => ResponseMatcher;
  /** GET `<base>` with every given query param (e.g. `{ status: "active" }`). */
  listWhere: (query: QueryExpectation) => ResponseMatcher;
  /** POST `<base>` */
  create: ResponseMatcher;
  /** POST `<base>` that failed (>= 400). */
  createError: ResponseMatcher;
  /** GET `<base>/:id` */
  detail: ResponseMatcher;
  /** PATCH `<base>/:id` */
  update: ResponseMatcher;
  /** DELETE `<base>/:id` */
  remove: ResponseMatcher;
  /** `<method> <base>/:id/<action>` e.g. `action("cancel")` for POST `/:id/cancel`. */
  action: (name: string, method?: HttpMethod) => ResponseMatcher;
};

/**
 * Generates the standard REST matchers for one resource instead of
 * hand-writing ~8 near-identical functions per endpoint (ProactiveMD's
 * `api-matchers.ts` grew to ~1,200 lines this way).
 *
 * `idPattern` is the regex source for the id segment. Trailing-slash clients
 * can produce `//` before the id (`/items//42`), so one-or-more slashes are
 * accepted by default; pass `tolerateDoubleSlash: false` to be strict.
 */
export function createResourceMatchers(
  basePath: string,
  options: { idPattern?: string; tolerateDoubleSlash?: boolean } = {}
): ResourceMatchers {
  const { idPattern = "[^/]+", tolerateDoubleSlash = true } = options;
  const base = basePath.replace(/\/$/, "");
  const sep = tolerateDoubleSlash ? "/+" : "/";
  const detailPath = new RegExp(`${escapeRegExp(base)}${sep}${idPattern}$`);

  return {
    list: matchRequest({ method: "GET", path: base }),
    listSearch: (query) =>
      matchRequest({ method: "GET", path: base, query: { search: query } }),
    listWhere: (query) => matchRequest({ method: "GET", path: base, query }),
    create: matchRequest({ method: "POST", path: base }),
    createError: matchRequest({
      method: "POST",
      path: base,
      status: (status) => status >= 400,
    }),
    detail: matchRequest({ method: "GET", path: detailPath }),
    update: matchRequest({ method: "PATCH", path: detailPath }),
    remove: matchRequest({ method: "DELETE", path: detailPath }),
    action: (name, method = "POST") =>
      matchRequest({
        method,
        path: new RegExp(
          `${escapeRegExp(base)}${sep}${idPattern}/${escapeRegExp(name)}$`
        ),
      }),
  };
}
