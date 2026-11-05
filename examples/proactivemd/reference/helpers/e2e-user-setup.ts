import { Page } from "@playwright/test";
import {
  appPaths,
  buildRoleFormValues,
  buildUserFormValues,
  type RoleFormTestData,
  type UserFormTestData,
} from "../config/test-data";
import { readTenantManifest } from "./e2e-tenant-manifest";
import { RoleFormPage } from "../pages/role-form-page";
import { RoleManagerPage } from "../pages/role-manager-page";
import { SidebarPage } from "../pages/sidebar-page";
import { UserFormPage } from "../pages/user-form-page";
import { UserManagerPage } from "../pages/user-manager-page";

export type SeededE2eUser = {
  role: RoleFormTestData;
  user: UserFormTestData;
  fullName: string;
  clientName: string;
  locationName: string;
};

export async function seedE2eRoleAndUser(options: {
  page: Page;
  roleManagerPage: RoleManagerPage;
  roleFormPage: RoleFormPage;
  userManagerPage: UserManagerPage;
  userFormPage: UserFormPage;
}): Promise<SeededE2eUser> {
  const {
    page,
    roleManagerPage,
    roleFormPage,
    userManagerPage,
    userFormPage,
  } = options;

  const role = buildRoleFormValues();
  const user = buildUserFormValues();
  const { clientName, locationName } = readTenantManifest();
  const fullName = `${user.firstName} ${user.lastName}`;
  const sidebar = new SidebarPage(page);

  await page.goto(appPaths.missionControl);
  await sidebar.navigateToPath(appPaths.roles);

  await roleManagerPage.expectLoaded();
  await roleManagerPage.openCreateRole();
  await roleFormPage.expectLoaded();
  await roleFormPage.createRole(role);
  await roleFormPage.expectSuccessToast();
  await roleFormPage.expectRedirectToList();
  await roleManagerPage.expectRoleVisible(role.name);

  await sidebar.navigateToPath(appPaths.users);
  await userManagerPage.expectLoaded();
  await userManagerPage.openCreateUser();

  await userFormPage.expectLoaded();
  await userFormPage.createUser(user, {
    roleName: role.name,
    clientName,
    locationName,
  });
  await userFormPage.expectSuccessToast();
  await userFormPage.expectRedirectToList();
  await userManagerPage.expectUserVisible(fullName);

  return { role, user, fullName, clientName, locationName };
}
