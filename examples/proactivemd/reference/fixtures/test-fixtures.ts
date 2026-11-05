import fs from "node:fs";
import { test as base } from "@playwright/test";
import { storageStatePaths } from "../auth/storage-state";
import {
  hasRestrictedUserCredentials,
  hasTestUserCredentials,
} from "../config/test-data";
import { LoginPage } from "../pages/login-page";
import { RegisterPage } from "../pages/register-page";
import { ForgotPasswordPage } from "../pages/forgot-password-page";
import { ClientManagerPage } from "../pages/client-manager-page";
import { ClientFormPage } from "../pages/client-form-page";
import { LocationManagerPage } from "../pages/location-manager-page";
import { LocationFormPage } from "../pages/location-form-page";
import { TopNavContextPage } from "../pages/top-nav-context-page";
import { PurposeManagerPage } from "../pages/purpose-manager-page";
import { PurposeFormPage } from "../pages/purpose-form-page";
import { PatientManagerPage } from "../pages/patient-manager-page";
import { PatientFormPage } from "../pages/patient-form-page";
import { UserManagerPage } from "../pages/user-manager-page";
import { UserFormPage } from "../pages/user-form-page";
import { RoleManagerPage } from "../pages/role-manager-page";
import { RoleFormPage } from "../pages/role-form-page";
import { BiometricManagerPage } from "../pages/biometric-manager-page";
import { BiometricWizardPage } from "../pages/biometric-wizard-page";
import { FluShotManagerPage } from "../pages/flu-shot-manager-page";
import { FluShotWizardPage } from "../pages/flu-shot-wizard-page";
import { ScheduleManagerPage } from "../pages/schedule-manager-page";
import { ScheduleFormPage } from "../pages/schedule-form-page";
import { AppointmentsPage } from "../pages/appointments-page";
import { WalkinPage } from "../pages/walkin-page";
import { PublicRegistrationPage } from "../pages/public-registration-page";
import { ConsentFormPage, ConsentManagerPage } from "../pages/consent-pages";
import { AoeListFormPage, AoeListManagerPage } from "../pages/aoe-list-pages";
import { ConfigurationPage } from "../pages/configuration-page";
import { QueueDisplayPage } from "../pages/queue-display-page";
import { ProcessingWizardPage } from "../pages/processing-wizard-page";
import { OccurrenceListPage } from "../pages/occurrence-list-page";
import { OccurrenceFormPage } from "../pages/occurrence-form-page";
import { OccurrenceProfilePage } from "../pages/occurrence-profile-page";
import { ServicesManagerPage } from "../pages/services-manager-page";
import { ServicesManagerFormPage } from "../pages/services-manager-form-page";
import { ServiceLocationManagerPage } from "../pages/service-location-manager-page";
import { ServiceLocationManagerFormPage } from "../pages/service-location-manager-form-page";
import { WorkLocationManagerPage } from "../pages/work-location-manager-page";
import { WorkLocationManagerFormPage } from "../pages/work-location-manager-form-page";
import { ServiceRequestWorklistPage } from "../pages/service-request-worklist-page";
import { ServiceRequestWorklistFormPage } from "../pages/service-request-worklist-form-page";
import { AppShellPage } from "../pages/app-shell-page";
import { SidebarPage } from "../pages/sidebar-page";

type TestFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
  publicRegistrationPage: PublicRegistrationPage;
};

type AuthenticatedTestFixtures = {
  clientManagerPage: ClientManagerPage;
  clientFormPage: ClientFormPage;
  locationManagerPage: LocationManagerPage;
  locationFormPage: LocationFormPage;
  topNavContextPage: TopNavContextPage;
  purposeManagerPage: PurposeManagerPage;
  purposeFormPage: PurposeFormPage;
  patientManagerPage: PatientManagerPage;
  patientFormPage: PatientFormPage;
  userManagerPage: UserManagerPage;
  userFormPage: UserFormPage;
  roleManagerPage: RoleManagerPage;
  roleFormPage: RoleFormPage;
  biometricManagerPage: BiometricManagerPage;
  biometricWizardPage: BiometricWizardPage;
  fluShotManagerPage: FluShotManagerPage;
  fluShotWizardPage: FluShotWizardPage;
  scheduleManagerPage: ScheduleManagerPage;
  scheduleFormPage: ScheduleFormPage;
  appointmentsPage: AppointmentsPage;
  walkinPage: WalkinPage;
  consentManagerPage: ConsentManagerPage;
  consentFormPage: ConsentFormPage;
  aoeListManagerPage: AoeListManagerPage;
  aoeListFormPage: AoeListFormPage;
  configurationPage: ConfigurationPage;
  queueDisplayPage: QueueDisplayPage;
  processingWizardPage: ProcessingWizardPage;
  occurrenceListPage: OccurrenceListPage;
  occurrenceFormPage: OccurrenceFormPage;
  occurrenceProfilePage: OccurrenceProfilePage;
  servicesManagerPage: ServicesManagerPage;
  servicesManagerFormPage: ServicesManagerFormPage;
  serviceLocationManagerPage: ServiceLocationManagerPage;
  serviceLocationManagerFormPage: ServiceLocationManagerFormPage;
  workLocationManagerPage: WorkLocationManagerPage;
  workLocationManagerFormPage: WorkLocationManagerFormPage;
  serviceRequestWorklistPage: ServiceRequestWorklistPage;
  serviceRequestWorklistFormPage: ServiceRequestWorklistFormPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, run) => {
    await run(new LoginPage(page));
  },
  registerPage: async ({ page }, run) => {
    await run(new RegisterPage(page));
  },
  forgotPasswordPage: async ({ page }, run) => {
    await run(new ForgotPasswordPage(page));
  },
  publicRegistrationPage: async ({ page }, run) => {
    await run(new PublicRegistrationPage(page));
  },
});

export const authenticatedTest = test.extend<AuthenticatedTestFixtures>({
  context: async ({ browser }, run) => {
    const storageState =
      hasTestUserCredentials() && fs.existsSync(storageStatePaths.standardUser)
        ? storageStatePaths.standardUser
        : undefined;

    const context = await browser.newContext(
      storageState ? { storageState } : {}
    );

    await run(context);
    await context.close();
  },
  clientManagerPage: async ({ page }, run) => {
    await run(new ClientManagerPage(page));
  },
  clientFormPage: async ({ page }, run) => {
    await run(new ClientFormPage(page));
  },
  locationManagerPage: async ({ page }, run) => {
    await run(new LocationManagerPage(page));
  },
  locationFormPage: async ({ page }, run) => {
    await run(new LocationFormPage(page));
  },
  topNavContextPage: async ({ page }, run) => {
    await run(new TopNavContextPage(page));
  },
  purposeManagerPage: async ({ page }, run) => {
    await run(new PurposeManagerPage(page));
  },
  purposeFormPage: async ({ page }, run) => {
    await run(new PurposeFormPage(page));
  },
  patientManagerPage: async ({ page }, run) => {
    await run(new PatientManagerPage(page));
  },
  patientFormPage: async ({ page }, run) => {
    await run(new PatientFormPage(page));
  },
  userManagerPage: async ({ page }, run) => {
    await run(new UserManagerPage(page));
  },
  userFormPage: async ({ page }, run) => {
    await run(new UserFormPage(page));
  },
  roleManagerPage: async ({ page }, run) => {
    await run(new RoleManagerPage(page));
  },
  roleFormPage: async ({ page }, run) => {
    await run(new RoleFormPage(page));
  },
  biometricManagerPage: async ({ page }, run) => {
    await run(new BiometricManagerPage(page));
  },
  biometricWizardPage: async ({ page }, run) => {
    await run(new BiometricWizardPage(page));
  },
  fluShotManagerPage: async ({ page }, run) => {
    await run(new FluShotManagerPage(page));
  },
  fluShotWizardPage: async ({ page }, run) => {
    await run(new FluShotWizardPage(page));
  },
  scheduleManagerPage: async ({ page }, run) => {
    await run(new ScheduleManagerPage(page));
  },
  scheduleFormPage: async ({ page }, run) => {
    await run(new ScheduleFormPage(page));
  },
  appointmentsPage: async ({ page }, run) => {
    await run(new AppointmentsPage(page));
  },
  walkinPage: async ({ page }, run) => {
    await run(new WalkinPage(page));
  },
  consentManagerPage: async ({ page }, run) => {
    await run(new ConsentManagerPage(page));
  },
  consentFormPage: async ({ page }, run) => {
    await run(new ConsentFormPage(page));
  },
  aoeListManagerPage: async ({ page }, run) => {
    await run(new AoeListManagerPage(page));
  },
  aoeListFormPage: async ({ page }, run) => {
    await run(new AoeListFormPage(page));
  },
  configurationPage: async ({ page }, run) => {
    await run(new ConfigurationPage(page));
  },
  queueDisplayPage: async ({ page }, run) => {
    await run(new QueueDisplayPage(page));
  },
  processingWizardPage: async ({ page }, run) => {
    await run(new ProcessingWizardPage(page));
  },
  occurrenceListPage: async ({ page }, run) => {
    await run(new OccurrenceListPage(page));
  },
  occurrenceFormPage: async ({ page }, run) => {
    await run(new OccurrenceFormPage(page));
  },
  occurrenceProfilePage: async ({ page }, run) => {
    await run(new OccurrenceProfilePage(page));
  },
  servicesManagerPage: async ({ page }, run) => {
    await run(new ServicesManagerPage(page));
  },
  servicesManagerFormPage: async ({ page }, run) => {
    await run(new ServicesManagerFormPage(page));
  },
  serviceLocationManagerPage: async ({ page }, run) => {
    await run(new ServiceLocationManagerPage(page));
  },
  serviceLocationManagerFormPage: async ({ page }, run) => {
    await run(new ServiceLocationManagerFormPage(page));
  },
  workLocationManagerPage: async ({ page }, run) => {
    await run(new WorkLocationManagerPage(page));
  },
  workLocationManagerFormPage: async ({ page }, run) => {
    await run(new WorkLocationManagerFormPage(page));
  },
  serviceRequestWorklistPage: async ({ page }, run) => {
    await run(new ServiceRequestWorklistPage(page));
  },
  serviceRequestWorklistFormPage: async ({ page }, run) => {
    await run(new ServiceRequestWorklistFormPage(page));
  },
});

export const tenantContextTest = authenticatedTest.extend({
  context: async ({ browser }, run) => {
    if (!fs.existsSync(storageStatePaths.tenantContext)) {
      throw new Error(
        "Tenant context storage state is missing. Run `yarn test:e2e:setup` first to create client, location, and select top-nav context."
      );
    }

    const context = await browser.newContext({
      storageState: storageStatePaths.tenantContext,
    });

    await run(context);
    await context.close();
  },
});

type RestrictedTestFixtures = {
  appShellPage: AppShellPage;
  sidebarPage: SidebarPage;
};

/** Non-superuser session seeded by seed-e2e-restricted-user.py (view-only Roles). */
export const restrictedTest = authenticatedTest.extend<RestrictedTestFixtures>({
  context: async ({ browser }, run, testInfo) => {
    testInfo.skip(
      !hasRestrictedUserCredentials(),
      "Set TEST_RESTRICTED_USER_EMAIL and TEST_RESTRICTED_USER_PASSWORD in .env"
    );

    if (!fs.existsSync(storageStatePaths.restrictedUser)) {
      throw new Error(
        "Restricted user storage state is missing. Run the `e2e-rbac-setup` project first (needs TEST_RESTRICTED_USER_* and the seeded user)."
      );
    }

    const context = await browser.newContext({
      storageState: storageStatePaths.restrictedUser,
    });

    await run(context);
    await context.close();
  },
  appShellPage: async ({ page }, run) => {
    await run(new AppShellPage(page));
  },
  sidebarPage: async ({ page }, run) => {
    await run(new SidebarPage(page));
  },
});

export {
  hasTestUserCredentials,
  hasRestrictedUserCredentials,
  restrictedUserAccess,
  accessDeniedContent,
  buildRegistrationUser,
  buildUnknownEmail,
  buildClientFormValues,
  buildLocationFormValues,
  buildPatientFormValues,
  buildUserFormValues,
  buildRoleFormValues,
  buildBiometricPatientDemographics,
  buildBiometricVitalsValues,
  buildManualOutsideProviderValues,
  buildFluShotPatientDemographics,
  buildFluShotAdministrationValues,
  buildScheduleFormValues,
  buildWalkinPatientValues,
  buildConsentFormValues,
  buildAoeListFormValues,
  buildAoePurposeName,
  buildAoeQuestionTitle,
  buildRecommendationTemplateValues,
  formatPerformedOnDateLabel,
  todayIsoDate,
  VALID_CVX_CODE,
  VALID_CVX_CODE_ALT,
  INVALID_CVX_CODE,
  INVALID_NPI,
  testUsers,
  buildOccurrenceVisitorValues,
  buildServiceTypeFormValues,
  buildServiceLocationFormValues,
  buildWorkLocationFormValues,
  buildServiceRequestFormValues,
  serviceRequestDeleteSuccessToast,
} from "../config/test-data";
