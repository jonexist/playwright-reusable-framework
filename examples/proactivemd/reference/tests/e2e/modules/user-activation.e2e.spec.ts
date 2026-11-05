import {
  userManagerPageContent,
} from "../../../src/config/test-data";
import { seedE2eRoleAndUser } from "../../../src/helpers/e2e-user-setup";
import {
  hasTestUserCredentials,
  tenantContextTest,
} from "../../../src/fixtures/test-fixtures";

tenantContextTest.describe.configure({ mode: "serial" });

tenantContextTest.describe("User activation", () => {
  tenantContextTest.setTimeout(240_000);

  tenantContextTest(
    "deactivates a user, filters Active vs Inactive, then reactivates",
    async ({
      page,
      roleManagerPage,
      roleFormPage,
      userManagerPage,
      userFormPage,
    }) => {
      tenantContextTest.skip(
        !hasTestUserCredentials(),
        "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env"
      );

      const { fullName } = await seedE2eRoleAndUser({
        page,
        roleManagerPage,
        roleFormPage,
        userManagerPage,
        userFormPage,
      });

      await userManagerPage.deactivateUser(fullName);
      await userManagerPage.expectInactiveBadge(fullName);

      await userManagerPage.applyStatusFilter(
        userManagerPageContent.inactiveFilter
      );
      await userManagerPage.expectUserVisible(fullName);

      await userManagerPage.applyStatusFilter(
        userManagerPageContent.activeFilter
      );
      await userManagerPage.expectUserHidden(fullName);

      await userManagerPage.applyStatusFilter(
        userManagerPageContent.inactiveFilter
      );
      await userManagerPage.expectUserVisible(fullName);

      await userManagerPage.activateUser(fullName);

      await userManagerPage.applyStatusFilter(
        userManagerPageContent.activeFilter
      );
      await userManagerPage.expectActiveBadge(fullName);

      await userManagerPage.applyStatusFilter(
        userManagerPageContent.inactiveFilter
      );
      await userManagerPage.expectUserHidden(fullName);
    }
  );
});
