import { expect, test } from "@playwright/test";
import type { Response } from "@playwright/test";
import {
  createResourceMatchers,
  matchRequest,
} from "../../src/core/api/response-matchers";

/** Minimal stand-in for the parts of Response the matchers read. */
function fakeResponse(
  method: string,
  url: string,
  status = 200
): Response {
  return {
    url: () => url,
    status: () => status,
    request: () => ({ method: () => method }),
  } as unknown as Response;
}

test.describe("matchRequest", () => {
  test("matches by method and path suffix (survives a proxy prefix)", () => {
    const matcher = matchRequest({ method: "GET", path: "/api/items" });

    expect(matcher(fakeResponse("GET", "http://x/api/items"))).toBe(true);
    expect(matcher(fakeResponse("GET", "http://x/api/proxy/api/items/"))).toBe(
      true
    );
    expect(matcher(fakeResponse("POST", "http://x/api/items"))).toBe(false);
    expect(matcher(fakeResponse("GET", "http://x/api/items/5"))).toBe(false);
  });

  test("requires every query param to equal the expected value", () => {
    const matcher = matchRequest({
      method: "GET",
      path: "/api/items",
      query: { status: "active", page: 2 },
    });

    expect(
      matcher(fakeResponse("GET", "http://x/api/items?status=active&page=2"))
    ).toBe(true);
    expect(matcher(fakeResponse("GET", "http://x/api/items?status=active"))).toBe(
      false
    );
  });

  test("can constrain the response status", () => {
    const failed = matchRequest({
      method: "POST",
      path: "/api/items",
      status: (s) => s >= 400,
    });

    expect(failed(fakeResponse("POST", "http://x/api/items", 422))).toBe(true);
    expect(failed(fakeResponse("POST", "http://x/api/items", 201))).toBe(false);
  });
});

test.describe("createResourceMatchers", () => {
  const items = createResourceMatchers("/api/items", { idPattern: "\\d+" });

  test("list / search / filter", () => {
    expect(items.list(fakeResponse("GET", "http://x/api/items"))).toBe(true);
    expect(
      items.listSearch("abc")(fakeResponse("GET", "http://x/api/items?search=abc"))
    ).toBe(true);
    expect(
      items.listSearch("abc")(fakeResponse("GET", "http://x/api/items?search=zzz"))
    ).toBe(false);
    expect(
      items.listWhere({ status: "archived" })(
        fakeResponse("GET", "http://x/api/items?status=archived")
      )
    ).toBe(true);
  });

  test("create / update / delete / detail use the right verbs and id shape", () => {
    expect(items.create(fakeResponse("POST", "http://x/api/items"))).toBe(true);
    expect(items.createError(fakeResponse("POST", "http://x/api/items", 400))).toBe(
      true
    );
    expect(items.createError(fakeResponse("POST", "http://x/api/items", 201))).toBe(
      false
    );
    expect(items.detail(fakeResponse("GET", "http://x/api/items/42"))).toBe(true);
    expect(items.detail(fakeResponse("GET", "http://x/api/items/abc"))).toBe(false);
    expect(items.update(fakeResponse("PATCH", "http://x/api/items/42"))).toBe(true);
    expect(items.remove(fakeResponse("DELETE", "http://x/api/items/42"))).toBe(
      true
    );
  });

  test("tolerates the double slash trailing-slash clients produce", () => {
    expect(items.update(fakeResponse("PATCH", "http://x/api/items//42"))).toBe(
      true
    );

    const strict = createResourceMatchers("/api/items", {
      idPattern: "\\d+",
      tolerateDoubleSlash: false,
    });
    expect(strict.update(fakeResponse("PATCH", "http://x/api/items//42"))).toBe(
      false
    );
  });

  test("action matches POST /:id/<name>", () => {
    const cancel = items.action("cancel");

    expect(cancel(fakeResponse("POST", "http://x/api/items/7/cancel"))).toBe(true);
    expect(cancel(fakeResponse("GET", "http://x/api/items/7/cancel"))).toBe(false);
    expect(cancel(fakeResponse("POST", "http://x/api/items/7/other"))).toBe(false);
  });
});
