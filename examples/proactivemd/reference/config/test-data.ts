import { faker } from "@faker-js/faker";
import { env, requireEnvValue } from "./env";

export function hasTestUserCredentials(): boolean {
  return Boolean(env.TEST_USER_EMAIL && env.TEST_USER_PASSWORD);
}

export function hasRestrictedUserCredentials(): boolean {
  return Boolean(
    env.TEST_RESTRICTED_USER_EMAIL && env.TEST_RESTRICTED_USER_PASSWORD
  );
}

export const testUsers = {
  defaultUser: {
    get email(): string {
      return requireEnvValue(env.TEST_USER_EMAIL, "TEST_USER_EMAIL");
    },

    get password(): string {
      return requireEnvValue(env.TEST_USER_PASSWORD, "TEST_USER_PASSWORD");
    },
  },
  restrictedUser: {
    get email(): string {
      return requireEnvValue(
        env.TEST_RESTRICTED_USER_EMAIL,
        "TEST_RESTRICTED_USER_EMAIL"
      );
    },

    get password(): string {
      return requireEnvValue(
        env.TEST_RESTRICTED_USER_PASSWORD,
        "TEST_RESTRICTED_USER_PASSWORD"
      );
    },
  },
};

export const appPaths = {
  login: env.LOGIN_PATH,
  register: "/register",
  forgotPassword: "/forgot-password",
  missionControl: "/mission-control",
  changePassword: "/change-password",
  clientManager: "/administration/client-manager",
  createClient: "/administration/client-manager/create-client",
  locationManager: "/administration/location-manager",
  createLocation: "/administration/location-manager/create-location",
  users: "/administration/users",
  createUser: "/administration/users/create-users",
  roles: "/administration/roles",
  createRole: "/administration/roles/add",
  purposes: "/events/purposes",
  createPurpose: "/events/purposes/new",
  patients: "/practice-management/patients",
  createPatient: "/practice-management/patients/create",
  healthScreenResults: "/events/health-screen-results",
  fluShotResults: "/events/health-screen-results?tab=flu-shots",
  createBiometricScreening: "/events/biometric-screening/create",
  createFluShot: "/events/health-screen-results/flu-shots/create",
  schedules: "/events/schedules",
  createSchedule: "/events/schedules/new",
  appointments: "/events/appointments",
  walkinRegistration: "/events/appointments/walkin",
  publicRegister: "/public/register",
  queueDisplay: "/events/queue-display",
  consents: "/events/consents",
  createConsent: "/events/consents/new",
  aoeLists: "/events/aoe-lists",
  createAoeList: "/events/aoe-lists/new",
  configuration: "/events/configuration",
  clinicalOccurrenceReport: "/clinical-occurrence-report",
  createClinicalOccurrence: "/clinical-occurrence-report/create",
  servicesManager: "/service-request-manager/services-manager",
  createServiceType: "/service-request-manager/services-manager/create",
  serviceLocationManager: "/service-request-manager/service-location-manager",
  createServiceLocation:
    "/service-request-manager/service-location-manager/create",
  workLocationManager: "/service-request-manager/work-location-manager",
  createWorkLocation: "/service-request-manager/work-location-manager/create",
  serviceRequestWorklist: "/service-request-manager/service-request-worklist",
  createServiceRequest:
    "/service-request-manager/service-request-worklist/create",
};

export const E2E_CLIENT_NAME_PREFIX = "Leaf Village";

export const loginPageContent = {
  heading: "Sign in to your account",
  pageTitlePattern: /Proactive IQ - Sign In/,
  microsoftLink: "Sign In with Microsoft",
  registerLink: "Register",
  forgotPasswordLink: "Forgotten Password?",
  signInButton: "Sign in",
};

export type RegistrationUser = {
  firstName: string;
  lastName: string;
  email: string;
};

export function buildRegistrationUser(
  overrides: Partial<RegistrationUser> = {}
): RegistrationUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    ...overrides,
  };
}

export const registerPageContent = {
  heading: "Sign up for an account",
  pageTitlePattern: /Proactive IQ - Sign Up/,
  microsoftLink: "Sign Up with Microsoft",
  signInLink: "Sign in",
  signUpButton: "Sign Up",
  termsCheckboxLabel: /I agree to the Terms/,
  confirmInfoCheckboxLabel: /I have reviewed my personal information/,
  successMessage:
    "Your account has been created successfully. Please wait for admin approval before logging in.",
};

export const forgotPasswordPageContent = {
  heading: "Forgot Your Password?",
  pageTitlePattern: /Proactive IQ - Forgot Password/,
  signInLink: "Back to Sign In",
  emailLabel: "Email Address",
  sendResetLinkButton: "Send Reset Link",
  successMessage:
    "If this email is registered, a password reset link has been sent to your inbox.",
};

export function buildUnknownEmail(): string {
  return faker.internet.email({
    provider: "example.com",
    allowSpecialCharacters: false,
  });
}

export const clientManagerPageContent = {
  heading: "Client Manager",
  createClientLink: "Create New Client",
};

export const clientFormContent = {
  heading: "Create New Client",
  saveButton: "Save Client",
  successMessage: "Client created successfully!",
  sectionHeadings: {
    clientInformation: "Client Information",
    address: "Address",
    contacts: "Contacts",
    primaryContact: "Primary Contact",
    secondaryContact: "Secondary Contact",
  },
  tpaSubgroupPlaceholder: "Select TPA subgroup (optional)",
  defaultTpaSubgroup: "Centivo (TPA)",
};

export type ClientContactTestData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ClientFormTestData = {
  name: string;
  employerCode: string;
  insuranceGroupId: string;
  insuranceEmployerGroupName: string;
  parentAccount: string;
  providerCode: string;
  billingGroup: string;
  eligibleEmployees: string;
  totalEnrollment: string;
  status: "active" | "inactive";
  startDate: string;
  renewalDate: string;
  tpaSubgroup: string;
  viShare: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  fax: string;
  primaryContact: ClientContactTestData;
  secondaryContact: ClientContactTestData;
  salesRep1: string;
  salesRep2: string;
  clientRelationsManager: string;
  contactUsEmail: string;
  contactUsPhone: string;
};

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildContact(): ClientContactTestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    phone: faker.phone.number({ style: "international" }),
  };
}

export function buildClientFormValues(
  overrides: Partial<ClientFormTestData> = {}
): ClientFormTestData {
  const startDate = new Date();
  const renewalDate = new Date(startDate);
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  return {
    name: `${E2E_CLIENT_NAME_PREFIX} ${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
    employerCode: `LV-${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
    insuranceGroupId: faker.string.numeric(3),
    insuranceEmployerGroupName: faker.company.name(),
    parentAccount: faker.company.name(),
    providerCode: `PRV${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
    billingGroup: `BG-${faker.string.numeric(5)}`,
    eligibleEmployees: faker.number.int({ min: 1, max: 500 }).toString(),
    totalEnrollment: faker.number.int({ min: 1, max: 100 }).toString(),
    status: "active",
    startDate: formatIsoDate(startDate),
    renewalDate: formatIsoDate(renewalDate),
    tpaSubgroup: clientFormContent.defaultTpaSubgroup,
    viShare: `${faker.number.int({ min: 1, max: 100 })}%`,
    addressLine1: faker.location.streetAddress(),
    addressLine2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: "United States",
    phoneNumber: faker.phone.number({ style: "international" }),
    fax: faker.phone.number({ style: "international" }),
    primaryContact: buildContact(),
    secondaryContact: buildContact(),
    salesRep1: faker.person.fullName(),
    salesRep2: faker.person.fullName(),
    clientRelationsManager: faker.person.fullName(),
    contactUsEmail: faker.internet.email({
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    contactUsPhone: faker.phone.number({ style: "international" }),
    ...overrides,
  };
}

export const locationManagerPageContent = {
  heading: "Location Manager",
  createLocationLink: "Create New Location",
  searchPlaceholder: "Search Locations",
};

export const locationFormContent = {
  heading: "Create New Location",
  saveButton: "Save Location",
  successMessage: "Location created successfully!",
  clientPlaceholder: "Select client...",
  clientSearchPlaceholder: "Search clients by name...",
  statePlaceholder: "Select state",
  stateSearchPlaceholder: "Search state...",
  sectionHeadings: {
    basicInformation: "Basic Information",
    address: "Address",
    schedules: "Schedules",
    ancillaryServices: "Ancillary Services",
    services: "Services",
    benefits: "Benefits",
    client: "Client",
  },
  siteTypeOnsite: "Onsite",
};

export type LocationFormTestData = {
  name: string;
  clinicLocationId: string;
  code: string;
  phoneNumber: string;
  fax: string;
  emrLocationUniqueId: string;
  startDate: string;
  practiceGroupName: string;
  locationDescription: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  pharmacySiteId: string;
  otherServices: string;
  onsiteVaccines: string;
  medicalCarrier: string;
  pharmacyBenefitManager: string;
  employeeAssistanceProgram: string;
  otherVendors: string;
  clientSearchQuery: string;
};

export const purposePageContent = {
  listHeading: "Purposes",
  createHeading: "Create Purpose",
  createLink: "Create New Purpose",
  saveButton: "Create Purpose",
  successMessage: "Purpose created successfully.",
  searchPlaceholder: "Search Purposes",
  typePlaceholder: "Select purpose type",
  typeSearchPlaceholder: "Search purpose type...",
  biometricTypeLabel: "Biometric Screening",
  fluShotTypeLabel: "Flu Shot Event",
  biometricPurposeName: "Biometric Screening",
  fluShotPurposeName: "Flu Shot Event",
  clientPlaceholder: "Select client...",
  clientSearchPlaceholder: "Search clients by name...",
  editAction: "Edit",
  editHeading: "Edit Purpose",
  updateButton: "Update Purpose",
  updateSuccessMessage: "Purpose updated successfully.",
  registrationConfigColumn: "Show on Registration",
  registrationShowOption: "Show",
  registrationFields: {
    birthSex: "Birth Sex",
    phoneNumber: "Phone Number",
  },
};

export function buildLocationFormValues(
  overrides: Partial<LocationFormTestData> = {}
): LocationFormTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    name: `Test Location ${suffix}`,
    clinicLocationId: `pro-${faker.string.numeric(4)}`,
    code: `LC-${faker.string.numeric(5)}`,
    phoneNumber: faker.phone.number({ style: "international" }),
    fax: faker.phone.number({ style: "international" }),
    emrLocationUniqueId: `pro-${faker.string.numeric(4)}`,
    startDate: formatIsoDate(new Date()),
    practiceGroupName: `Group Name-${faker.string.numeric(4)}`,
    locationDescription: "This is a location",
    addressLine1: faker.location.streetAddress(),
    addressLine2: "Apt, suite",
    city: faker.location.city(),
    state: "Alaska",
    zipCode: faker.location.zipCode("#####"),
    pharmacySiteId: `PH-${faker.string.numeric(2)}`,
    otherServices: "This is other services",
    onsiteVaccines: "Pfizer",
    medicalCarrier: "Medical Carrier Name",
    pharmacyBenefitManager: "PBM Manager",
    employeeAssistanceProgram: "EAP Provider",
    otherVendors: "Other Vendor",
    clientSearchQuery: E2E_CLIENT_NAME_PREFIX,
    ...overrides,
  };
}

export const patientManagerPageContent = {
  heading: "Patients",
  createPatientLink: "Create New Patient",
  searchPlaceholder: "Search patients",
  openMenuLabel: "Open menu",
  viewDetailsAction: "View Details",
  editAction: "Edit",
  editPatientLink: "Edit Patient",
  deactivateAction: "Deactivate",
  deactivateDialogTitle: "Deactivate Patient?",
  deactivateSuccess: "Patient deactivated successfully",
  inactiveBadge: "Inactive",
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  inactiveFilter: "Inactive",
};

export const userManagerPageContent = {
  heading: "User Management",
  createUserLink: "Create New User",
  searchPlaceholder: "Search users by name or email",
  openMenuLabel: "Open menu",
  viewProfileAction: "View Profile",
  editUserLink: "Edit User",
  deactivateAction: "Deactivate",
  deactivateDialogTitle: "Deactivate User?",
  deactivateSuccess: "User deactivated successfully",
  activateAction: "Activate",
  activateDialogTitle: "Activate User?",
  activateSuccess: "User activated successfully",
  rejectAction: "Reject User",
  rejectDialogTitle: "Reject User",
  rejectConfirm: "Reject",
  rejectRemarksPlaceholder: "Enter rejection remarks",
  rejectSuccess: "User rejected successfully",
  deleteAction: "Delete User",
  deleteDialogTitle: "Delete User",
  deleteConfirm: "Delete",
  hardDeletePreview:
    "This user has no existing system usage or dependent records and can be permanently deleted.",
  softDeletePreview:
    "This user has existing system records and cannot be permanently deleted.",
  hardDeleteSuccess: "User permanently deleted",
  activeBadge: "Active",
  inactiveBadge: "Inactive",
  rejectedBadge: "Rejected",
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  inactiveFilter: "Inactive",
  rejectedFilter: "Rejected",
  duplicateEmailError: /already exists/i,
};

export const userFormContent = {
  heading: "Create New User",
  editHeading: "Edit User",
  saveButton: "Save User",
  updateButton: "Update User",
  successMessage: "User created successfully",
  updateSuccessMessage: "User updated successfully",
  rolePlaceholder: "Select role...",
  roleSearchPlaceholder: "Search roles...",
  clientPlaceholder: "Select clients...",
  clientSearchPlaceholder: "Search by client name or employer code",
  locationPlaceholder: "Select locations...",
  locationSearchPlaceholder: "Search location...",
  requiredMessages: {
    firstName: "First name is required",
    lastName: "Last name is required",
    email: "Email is required",
    role: "A role is required for non-superusers",
  },
};

export type UserFormTestData = {
  firstName: string;
  lastName: string;
  email: string;
};

export function buildUserFormValues(
  overrides: Partial<UserFormTestData> = {}
): UserFormTestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    ...overrides,
  };
}

export const roleManagerPageContent = {
  heading: "Roles & Permissions",
  createRoleLink: "Create New Role",
  searchPlaceholder: "Search Roles",
  openMenuLabel: "Open menu",
  editAction: "Edit",
  deleteAction: "Delete",
  deleteConfirm: "Delete",
};

/**
 * Mirrors qa-automation/src/fixtures/e2e-restricted-user.json: the seeded role
 * grants only `view` on Roles, so every other catalog path and every
 * add/edit/delete action must be denied.
 */
export const restrictedUserAccess = {
  roleName: "!E2E Restricted Roles Viewer",
  allowedPath: "/administration/roles",
  deniedViewPath: "/administration/users",
  /** RbacActionGate wraps the whole edit page, so the role id is never fetched. */
  editRolePath: "/administration/roles/edit/1",
};

export const accessDeniedContent = {
  heading: "Access Denied",
  viewMessage: "Your role does not have permission to view this page.",
  addMessage:
    "Your role does not have permission to create new records in this module.",
  editMessage:
    "Your role does not have permission to edit records in this module.",
};

export const roleFormContent = {
  heading: "Create New Role",
  editHeading: "Edit Role",
  nameLabel: "Role name",
  saveButton: "Create role",
  updateButton: "Save changes",
  successMessage: "Role created",
  updateSuccessMessage: "Role updated",
  requiredMessages: {
    name: "Role name is required",
  },
};

export type RoleFormTestData = {
  name: string;
};

/** Distinct prefix so E2E roles are easy to identify in lists and comboboxes. */
export const E2E_ROLE_NAME_PREFIX = "!E2E Role";

export function buildRoleFormValues(
  overrides: Partial<RoleFormTestData> = {}
): RoleFormTestData {
  const suffix = faker.string.alphanumeric({ length: 8, casing: "upper" });

  return {
    name: `${E2E_ROLE_NAME_PREFIX} ${suffix}`,
    ...overrides,
  };
}

export const patientFormContent = {
  heading: "Create New Patient",
  editHeading: "Edit Patient",
  saveButton: "Save Patient",
  updateButton: "Update Patient",
  successMessage: "Patient created successfully!",
  updateSuccessMessage: "Patient updated successfully!",
  sectionHeadings: {
    clientInformation: "Client Information",
    patientInformation: "Patient Information",
    contactInformation: "Contact Information",
    addressInformation: "Address Information",
  },
  genderOptions: ["Male", "Female"] as const,
  statePlaceholder: "Select state",
  stateSearchPlaceholder: "Search state...",
  requiredMessages: {
    firstName: "First name is required",
    lastName: "Last name is required",
    dateOfBirth: "Date of birth is required",
    gender: "Gender is required",
    mobilePhone: "Enter a valid mobile phone number",
    homePhone: "Enter a valid home phone number",
    address: "Address is required",
    city: "City is required",
    state: "State is required",
    zipCode: "Valid ZIP code is required",
  },
};

const PATIENT_STATE_LABELS = [
  "Alaska",
  "California",
  "Florida",
  "New York",
  "Texas",
] as const;

export type PatientFormTestData = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: (typeof patientFormContent.genderOptions)[number];
  socialSecurityNumber: string;
  race: string;
  ethnicity: string;
  mobilePhone: string;
  homePhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

function buildUsPhoneDigits(): string {
  return faker.string.numeric(10);
}

export function buildPatientFormValues(
  overrides: Partial<PatientFormTestData> = {}
): PatientFormTestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: "age" });

  return {
    firstName,
    middleName: faker.person.middleName(),
    lastName,
    birthDate: formatIsoDate(birthDate),
    gender: faker.helpers.arrayElement([...patientFormContent.genderOptions]),
    socialSecurityNumber: faker.string.numeric(9),
    race: faker.word.adjective(),
    ethnicity: faker.word.noun(),
    mobilePhone: buildUsPhoneDigits(),
    homePhone: buildUsPhoneDigits(),
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    addressLine1: faker.location.streetAddress(),
    addressLine2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    state: faker.helpers.arrayElement([...PATIENT_STATE_LABELS]),
    zipCode: faker.location.zipCode("#####"),
    country: "United States",
    ...overrides,
  };
}

export const biometricManagerPageContent = {
  heading: "Biometrics & Vaccines",
  biometricTab: "Biometric Screening",
  createLink: "Create New Screening Result",
  searchPlaceholder: "Search by confirmation # or patient",
  viewBiometricsAction: "View Biometrics",
  editBiometricsAction: "Edit Biometrics",
  cancelAction: "Cancel",
  openMenuLabel: "Open menu",
  cancelledStatus: "Cancelled",
  forRegistrationStatus: "For Registration",
  completedStatus: "Completed",
  statusFilterSubmenu: /^Status/,
};

export const manualProviderFormContent = {
  sectionTitle: "Provider Information",
  providerLabel: /^Provider$/,
  npiLabel: /National Provider Identifier \(NPI\)/,
  performedDateLabel: /Date performed/,
  performedTimeLabel: /^Time$/,
  sendRegistrationButton: "Send Registration/Consent",
  sendRegistrationDialogTitle: "Send Registration/Consent",
  sendRegistrationSuccess: "Registration email sent to patient",
  sendButton: "Send",
  cancelDialogTitle: /Cancel (biometric screening|flu shot record)/,
  cancelSuccess: "Record cancelled",
  cancelConfirmButton: "Cancel record",
  reasonPlaceholder: "Enter cancellation reason",
  relocateDialogTitle: "Move patient location?",
  relocateConfirmButton: "Move patient and update",
  invalidCvxMessage: "Enter a valid CVX code",
  invalidNpiMessage: "NPI must be exactly 10 digits when provided",
  locationPlaceholder: "Select location...",
  locationSearchPlaceholder: "Search locations...",
};

export const VALID_CVX_CODE = "141";
export const VALID_CVX_CODE_ALT = "150";
export const INVALID_CVX_CODE = "9999";
export const INVALID_NPI = "123456789";

export const biometricFormContent = {
  createHeading: "Manual Biometric Screening",
  editHeading: "Edit Biometric Screening",
  detailsHeading: "Biometric Screening Details",
  successMessage: "Biometric Screening Created",
  updateSuccessMessage: "Biometric screening updated",
  completeSuccessMessage: "Biometric screening completed",
  submitButton: "Submit Screening",
  updateSubmitButton: "Update Biometric Screening",
  continueButton: "Continue",
  purposePlaceholder: "Select purpose...",
  purposeSearchPlaceholder: "Search purposes...",
  fastingPlaceholder: "Select fasting status",
  followUpAriaLabel: "Follow-up timeframe",
  followUpOption: "2-4 Weeks",
  clinicalNoteLabel: /Clinical Note/,
  birthSexOptions: ["Male", "Female"] as const,
  stepperLabels: {
    patientInformation: "Patient Information",
    vitals: "Vitals",
    review: "Review",
  },
  sectionHeadings: {
    tenantSelection: "Tenant Selection",
    patientInformation: "Patient Information",
    biometricScreening: "Biometric Screening",
    bodyMeasurements: "Body Measurements",
    bloodPressure: "Blood Pressure & Pulse",
    bloodGlucose: "Blood Glucose",
    lipidPanel: "Lipid Panel (Cholesterol)",
    hemoglobinA1c: "Hemoglobin A1C",
    reviewSubmit: "Review & Submit",
  },
};

export type BiometricPatientDemographics = {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthSex: (typeof biometricFormContent.birthSexOptions)[number];
  email: string;
  mobilePhone: string;
};

export type BiometricVitalsTestData = {
  isFasting: "Yes" | "No";
  heightInches: string;
  weightLbs: string;
  waistInches: string;
  systolic: string;
  diastolic: string;
  pulse: string;
  glucose: string;
  totalCholesterol: string;
  hdl: string;
  ldl: string;
  triglycerides: string;
  a1c: string;
  followUp: string;
  clinicalNote: string;
};

export type ManualOutsideProviderTestData = {
  providerName: string;
  providerNpi: string;
  performedAtDate: string;
  performedAtTime: string;
};

/** Formats an ISO date (yyyy-MM-dd) like the details header (`MMM d, yyyy`). */
export function formatPerformedOnDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildManualOutsideProviderValues(
  overrides: Partial<ManualOutsideProviderTestData> = {}
): ManualOutsideProviderTestData {
  const performed = new Date();
  performed.setDate(performed.getDate() - 3);

  return {
    providerName: `Outside Provider ${faker.person.lastName()}`,
    providerNpi: "1234567890",
    performedAtDate: formatIsoDate(performed),
    performedAtTime: "10:30",
    ...overrides,
  };
}

export function buildBiometricPatientDemographics(
  overrides: Partial<BiometricPatientDemographics> = {}
): BiometricPatientDemographics {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: "age" });

  return {
    firstName,
    lastName,
    birthDate: formatIsoDate(birthDate),
    birthSex: faker.helpers.arrayElement([
      ...biometricFormContent.birthSexOptions,
    ]),
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    mobilePhone: buildUsPhoneDigits(),
    ...overrides,
  };
}

export function buildBiometricVitalsValues(
  overrides: Partial<BiometricVitalsTestData> = {}
): BiometricVitalsTestData {
  return {
    isFasting: "Yes",
    heightInches: "68",
    weightLbs: "165",
    waistInches: "32",
    systolic: "120",
    diastolic: "80",
    pulse: "72",
    glucose: "70",
    totalCholesterol: "200",
    hdl: "55",
    ldl: "100",
    triglycerides: "150",
    a1c: "5.7",
    followUp: biometricFormContent.followUpOption,
    clinicalNote: `E2E clinical note ${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
    ...overrides,
  };
}

export const fluShotManagerPageContent = {
  heading: "Biometrics & Vaccines",
  fluShotTab: "Flu Shot",
  createLink: "Create New Flu Shot",
  searchPlaceholder: "Search confirmation #, patient, or lot #",
  viewFluShotAction: "View Flu Shot",
  editFluShotAction: "Edit Flu Shot",
  cancelAction: "Cancel",
  openMenuLabel: "Open menu",
  cancelledStatus: "Cancelled",
  forRegistrationStatus: "For Registration",
  completedStatus: "Completed",
  statusFilterSubmenu: /^Status/,
};

export const fluShotFormContent = {
  createHeading: "Manual Flu Shot",
  editHeading: "Edit Flu Shot",
  detailsHeading: "Flu Shot Details",
  successMessage: "Flu Shot Created",
  updateSuccessMessage: "Flu shot updated",
  completeSuccessMessage: "Flu shot completed",
  submitButton: "Submit Flu Shot",
  updateSubmitButton: "Update Flu Shot",
  continueButton: "Continue",
  purposePlaceholder: "Select purpose...",
  purposeSearchPlaceholder: "Search purposes...",
  birthSexOptions: ["Male", "Female"] as const,
  doseUnitOption: "mL",
  administrationSiteOption: "Left Arm - Deltoid",
  administrationSiteOptionUpdated: "Right Arm - Deltoid",
  administrationRouteOption: "Intramuscular (IM)",
  stepperLabels: {
    patientInformation: "Patient Information",
    vaccine: "Vaccine",
    review: "Review",
  },
  sectionHeadings: {
    tenantSelection: "Tenant Selection",
    patientInformation: "Patient Information",
    vaccineInformation: "Vaccine Information",
    administrationDetails: "Administration Details",
    vis: "Vaccine Information Statement (VIS)",
    fluVaccineHistory: "Flu Vaccine History",
    adverseReactions: "Adverse Reactions",
    reviewSubmit: "Review & Submit",
  },
};

export type FluShotPatientDemographics = BiometricPatientDemographics;

export type FluShotAdministrationTestData = {
  vaccineName: string;
  manufacturer: string;
  lotNumber: string;
  expirationDate: string;
  ndcCode: string;
  cvxCode: string;
  doseAmount: string;
  doseUnit: string;
  administrationSite: string;
  administrationRoute: string;
  visPublicationDate: string;
  visProvidedDate: string;
  receivedFluShotPast: boolean;
  adverseReaction: boolean;
  adverseReactionNotes: string;
  notes: string;
};

export function buildFluShotPatientDemographics(
  overrides: Partial<FluShotPatientDemographics> = {}
): FluShotPatientDemographics {
  return buildBiometricPatientDemographics(overrides);
}

export function buildFluShotAdministrationValues(
  overrides: Partial<FluShotAdministrationTestData> = {}
): FluShotAdministrationTestData {
  const lotSuffix = faker.string.alphanumeric({ length: 6, casing: "upper" });
  const expirationDate = faker.date.future({ years: 1 });
  const visPublicationDate = faker.date.past({ years: 1 });
  const visProvidedDate = new Date();

  return {
    vaccineName: "Fluzone",
    manufacturer: "Sanofi",
    lotNumber: `LOT-${lotSuffix}`,
    expirationDate: formatIsoDate(expirationDate),
    ndcCode: "456-99832",
    cvxCode: VALID_CVX_CODE,
    doseAmount: "0.5",
    doseUnit: fluShotFormContent.doseUnitOption,
    administrationSite: fluShotFormContent.administrationSiteOption,
    administrationRoute: fluShotFormContent.administrationRouteOption,
    visPublicationDate: formatIsoDate(visPublicationDate),
    visProvidedDate: formatIsoDate(visProvidedDate),
    receivedFluShotPast: true,
    adverseReaction: true,
    adverseReactionNotes: "Reaction Details",
    notes: `E2E flu shot notes ${lotSuffix}`,
    ...overrides,
  };
}

function formatIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return formatIsoDateLocal(new Date());
}

export const schedulePageContent = {
  listHeading: "Schedules",
  createHeading: "Create Schedule",
  createLink: "Create New Schedule",
  saveButton: "Create Schedule",
  venipunctureLabel: "Venipuncture",
  successMessage: "Schedule created. Add events on the next page.",
  searchPlaceholder: "Search by name or slug",
  clientPlaceholder: "Select client...",
  clientSearchPlaceholder: "Search clients...",
  locationPlaceholder: "Select location",
  locationSearchPlaceholder: "Search locations...",
  purposePlaceholder: "Select purpose",
  purposeSearchPlaceholder: "Search purposes...",
  addEventButton: "Add Event",
  addFirstEventButton: "Add your first event",
  createEventButton: "Create Event",
  eventAddedMessage: "Event added.",
  openEventLabel: "Open event",
  eventDateLabel: /Event Date/,
  startTimeLabel: /Start Time/,
  endTimeLabel: /End Time/,
};

export type ScheduleFormTestData = {
  name: string;
  description: string;
  /**
   * Required (Yes/No radio) only when the purpose is Biometric Screening; the
   * field is not rendered for other purposes, so leave undefined there.
   */
  isVenipunctureEvent?: boolean;
};

export function buildScheduleFormValues(
  overrides: Partial<ScheduleFormTestData> = {}
): ScheduleFormTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    name: `E2E Schedule ${suffix}`,
    description: `Automated E2E schedule ${suffix}`,
    ...overrides,
  };
}

export const appointmentsPageContent = {
  listHeading: "Appointments",
  searchPlaceholder: "Search by name, email, or confirmation #",
  walkinLink: "Walk-in Registration",
  qrCheckInLink: "QR Check-in",
  openMenuLabel: "Open menu",
  viewDetailsAction: "View Details",
  checkInAction: "Check In",
  uncheckInAction: "Uncheck in",
  cancelAction: "Cancel",
  noShowAction: "No show",
  /** Confirm button in MarkNoShowAlertDialog (row menu item is "No show"). */
  noShowConfirmButton: "Mark as no show",
  rescheduleAction: "Reschedule",
  resendConfirmationAction: "Resend confirmation",
  checkInDialogTitle: "Check in patient?",
  uncheckInDialogTitle: "Uncheck in patient?",
  noShowDialogTitle: "Mark as no show?",
  cancelDialogTitle: "Cancel Appointment",
  cancelConfirmButton: "Cancel Appointment",
  cancellationReasonLabel: /Cancellation Reason/,
  cancellationReasonPlaceholder: "Enter the reason for cancellation...",
  cancellationReasonRequired: "Cancellation reason is required.",
  keepAppointmentButton: "Keep Appointment",
  /** Uncheck-in reverts to "confirmed" when confirmed_at is set, else "booked". */
  preCheckInStatus: /^(Booked|Confirmed)$/,
  checkedInStatus: "Checked In",
  noShowStatus: "No Show",
  cancelledStatus: "Cancelled",
  completedStatus: "Completed",
  /**
   * Completing screening from the processing wizard moves the patient to
   * Checkout, not Completed — the appointment stays "in_progress"
   * (AppointmentStatusBadge label) until checkout is separately completed.
   */
  inProgressStatus: "In Progress",
  checkInSuccess: "Patient Checked In",
  uncheckInSuccess: "Patient unchecked in",
  noShowSuccess: "Marked as no show",
  cancelSuccess: "Appointment Cancelled",
};

export const walkinPageContent = {
  pageHeading: "Walk-in Registration",
  scheduleHeading: "Schedule & Event",
  patientHeading: "Patient Details",
  reviewHeading: "Review",
  continueButton: "Continue",
  submitButton: "Register & Check In",
  successHeading: "Walk-In Registered!",
  successToast: "Walk-In Registered",
  backToAppointments: "Back to Appointments",
  selectScheduleLabel: "Select Schedule",
  birthSexLabel: /Birth Sex/,
  firstNameLabel: /First Name/,
  lastNameLabel: /Last Name/,
  birthDateLabel: /Date of Birth/,
  emailLabel: /^Email$/,
  phoneLabel: /^Phone$/,
};

export type WalkinPatientTestData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthSex: "Male" | "Female";
  email: string;
  phone: string;
};

export function buildWalkinPatientValues(
  overrides: Partial<WalkinPatientTestData> = {}
): WalkinPatientTestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 18, max: 80, mode: "age" });

  return {
    firstName,
    lastName,
    birthDate: formatIsoDate(birthDate),
    birthSex: faker.helpers.arrayElement(["Male", "Female"] as const),
    email: faker.internet.email({
      firstName,
      lastName,
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    phone: buildUsPhoneDigits(),
    ...overrides,
  };
}

export const publicRegistrationPageContent = {
  // Open-event (walk-in) schedules show "Select a Date" instead of the
  // default "Select Time" step title — see registration-content.tsx's
  // isOpenEventSchedule branch. The e2e schedule fixture is always a
  // walk-in schedule, so this is the title actually rendered.
  dateStepTitle: "Select a Date",
  patientStepTitle: "Your Information",
  questionsStepTitle: "Questions",
  consentStepTitle: "Consent",
  reviewStepTitle: "Review",
  walkInWelcome: "Walk-in Welcome",
  continueButton: "Continue",
  submitButton: "Confirm Appointment",
  successHeading: "Your Appointment has been Scheduled",
  confirmationLabel: "Confirmation Number",
  birthSexPlaceholder: "Select birth sex",
  phonePlaceholder: "(555) 123-4567",
};

export const consentPageContent = {
  listHeading: "Consents",
  createHeading: "Create Consent",
  createLink: "Create New Consent",
  saveButton: "Create Consent",
  successTitle: "Consent Created",
  searchPlaceholder: "Search Consents",
  clientPlaceholder: "Select client...",
  clientSearchPlaceholder: "Search clients by name...",
  purposesPlaceholder: "Select purposes",
  purposesSearchPlaceholder: "Search purposes...",
  titlePlaceholder: "e.g., HIPAA Authorization",
  contentPlaceholder: "Enter the content for block 1...",
};

export type ConsentFormTestData = {
  title: string;
  content: string;
};

export function buildConsentFormValues(
  overrides: Partial<ConsentFormTestData> = {}
): ConsentFormTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    title: `E2E Consent ${suffix}`,
    content: `E2E consent body ${suffix}`,
    ...overrides,
  };
}

export const aoeListPageContent = {
  listHeading: "AOE Lists",
  createHeading: "Create AOE List",
  createLink: "Create New AOE List",
  saveButton: "Create AOE list",
  successMessage: "AOE list created. Add questions on the next page.",
  searchPlaceholder: "Search AOE lists...",
  clientPlaceholder: "Select client...",
  purposesPlaceholder: "Select purposes",
  purposesSearchPlaceholder: "Search purposes...",
  typePlaceholder: "Select type",
  registrationType: "Registration",
  namePlaceholder: "e.g., Biometric Screening Questions",
  addFirstQuestionButton: "Add your first question",
  addQuestionButton: "Add Question",
  questionTitlePlaceholder: "e.g., Have you fasted for 8 hours?",
  requiredSwitch: "Required",
  registrationQuestionsHeading: "Registration Questions",
};

export function buildAoePurposeName(): string {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });
  return `E2E AOE Purpose ${suffix}`;
}

export function buildAoeQuestionTitle(): string {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });
  return `E2E required question ${suffix}`;
}

export type AoeListFormTestData = {
  name: string;
  description: string;
};

export function buildAoeListFormValues(
  overrides: Partial<AoeListFormTestData> = {}
): AoeListFormTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    name: `E2E AOE List ${suffix}`,
    description: `Automated AOE list ${suffix}`,
    ...overrides,
  };
}

export const configurationPageContent = {
  pageHeading: "Recommendation",
  templatesTab: "Recommendation Templates",
  addTemplateButton: "Add Template",
  dialogTitle: "Add Template",
  createButton: "Create Template",
  successMessage: "Template created successfully",
  metricPlaceholder: "Select metric",
  clientPlaceholder: "Select client",
  statusPlaceholder: "Select status level",
  categoryPlaceholder: "Select category",
  metricOption: "Body Mass Index",
  statusOption: "High Risk (Red)",
  categoryOption: "Lifestyle",
  titlePlaceholder: "e.g., High Cholesterol - Dietary Changes",
  messagePlaceholder: "Enter the recommendation message shown to patients...",
};

export type RecommendationTemplateTestData = {
  title: string;
  message: string;
  priority: string;
};

export function buildRecommendationTemplateValues(
  overrides: Partial<RecommendationTemplateTestData> = {}
): RecommendationTemplateTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    title: `E2E BMI Recommendation ${suffix}`,
    message: `E2E recommendation message ${suffix}`,
    priority: "100",
    ...overrides,
  };
}

export const queueDisplayPageContent = {
  heading: "Event Queue",
  waitingColumn: "Waiting for Screening",
  nowServingColumn: "Now Serving",
  checkoutColumn: "Checkout Queue",
  observationColumn: "Under Observation",
  grabPatientButton: "Grab Patient",
  startProcessingButton: "Start Processing",
  patientClaimedToast: "Patient Claimed",
  releaseButton: "Release Back to Queue",
  beingSeenByYou: "Being seen by you",
};

export const processingWizardPageContent = {
  heading: "Process Appointment",
  overviewTitle: "Processing Overview",
  patientStepTitle: "Patient Information",
  aoeStepTitle: "AOE Questions",
  biometricStepTitle: "Biometric Screening",
  fluShotStepTitle: "Flu Shot Administration",
  summaryTitle: "Review & Complete",
  startProcessingButton: "Start Processing",
  continueButton: "Continue",
  /** BiometricForm submit label when the wizard passes `onCollect`. */
  vitalsCollectButton: "Continue to Review",
  /** FluShotForm submit label when the wizard passes `onCollect`. */
  fluShotCollectButton: "Continue",
  completeButton: "Complete Appointment",
  completeToast: "Processing Complete",
  followUpAriaLabel: "Follow-up timeframe",
  clinicalNoteLabel: /Clinical Note/,
  notifyPatientCheckboxId: "#notify-patient-complete",
  vaccineInformationHeading: "Vaccine Information",
};

export const occurrencePageContent = {
  listHeading: "Clinical Occurrence Report",
  createHeading: "New Occurrence Report",
  editHeading: "Edit Occurrence Report",
  createLink: "Report an Occurrence",
  saveButton: "Save Occurrence",
  updateButton: "Update Occurrence",
  searchPlaceholder: "Search by ID",
  clientPlaceholder: "Select client...",
  locationPlaceholder: "Select location...",
  typePlaceholder: "Select type",
  visitorType: "Visitor",
  patientType: "Patient",
  healthCenterType: "Health Center",
  healthCenterTypeOption: "Excursion",
  healthCenterTypePlaceholder: "Select health center type",
  patientPlaceholder: "Search for a patient...",
  patientSearchPlaceholder: "Search by name or DOB...",
  genderPlaceholder: "Select gender",
  genderOption: "Female",
  cocPlaceholder: "Select user...",
  cocSearchPlaceholder: "Search users...",
  cocUserName: "Playwright E2E",
  createSuccessToast: "Occurrence reported successfully",
  updateSuccessToast: "Occurrence updated successfully",
  taskAddedToast: "Task added",
  addTaskButton: "Add Task",
  commentAddedToast: "Comment added",
  postCommentButton: "Post Comment",
  commentPlaceholder: "Add a comment... Use @ to mention someone",
  editLink: "Edit Clinical Occurrence",
  investigationStatus: "Investigation",
  closedStatus: "Closed",
  statusFilterSubmenu: /^Status/,
  showClosedFilter: "Show Closed",
  closedListStatus: "closed",
  under18DateOfBirth: "2015-06-15",
  requiredClient: "Client is required",
  requiredPatient: "Patient is required",
  requiredDate: "Date of occurrence is required",
  requiredTime: "Time of occurrence is required",
  requiredDescription: "Occurrence description is required",
  requiredCoc: "COC is required",
  requiredParentGuardian:
    "Parent/Guardian is required for individuals under 18",
};

export type OccurrenceVisitorTestData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  occurrenceDate: string;
  occurrenceTime: string;
  description: string;
  response: string;
  outcomes: string;
  taskTitle: string;
};

export function buildOccurrenceVisitorValues(
  overrides: Partial<OccurrenceVisitorTestData> = {}
): OccurrenceVisitorTestData {
  const suffix = faker.string.alphanumeric({ length: 6, casing: "upper" });

  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dateOfBirth: "1990-06-15",
    gender: occurrencePageContent.genderOption,
    occurrenceDate: todayIsoDate(),
    occurrenceTime: "10:30",
    description: `E2E visitor occurrence ${suffix}`,
    response: `E2E response ${suffix}`,
    outcomes: `E2E outcomes ${suffix}`,
    taskTitle: `E2E occurrence task ${suffix}`,
    ...overrides,
  };
}

export const servicesManagerPageContent = {
  heading: "Services Manager",
  createServiceTypeLink: "Add Service Type",
  searchPlaceholder: "Search service types",
  openMenuLabel: "Open menu",
  editAction: "Edit",
  deleteAction: "Delete",
  deleteConfirm: "Delete",
  deleteDialogTitle: "Delete Service Type",
  hardDeleteSuccess: "Service Type permanently deleted.",
  deactivateWarning:
    /has existing Service Requests and cannot be permanently deleted/,
  hardDeleteWarning: /has not been used and can be permanently deleted/,
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  inactiveFilter: "Inactive",
};

export const servicesManagerFormContent = {
  heading: "Create New Service Type",
  editHeading: "Edit Service Type",
  saveButton: "Save",
  successMessage: "Service Type created",
  updateSuccessMessage: "Service Type updated",
  frequencyLabel: /^Frequency \(Months\)/,
  frequencySearchPlaceholder: "Search months...",
  requiredMessages: {
    name: "Service Type is required",
  },
};

export type ServiceTypeFormTestData = {
  name: string;
  frequencyMonths: number;
  notes: string;
  allowEmployeeEmail: boolean;
};

/** Distinct prefix so E2E service types are easy to identify in lists. */
export const E2E_SERVICE_TYPE_NAME_PREFIX = "!E2E Service Type";

export function buildServiceTypeFormValues(
  overrides: Partial<ServiceTypeFormTestData> = {}
): ServiceTypeFormTestData {
  const suffix = faker.string.alphanumeric({ length: 8, casing: "upper" });

  return {
    name: `${E2E_SERVICE_TYPE_NAME_PREFIX} ${suffix}`,
    frequencyMonths: 12,
    notes: `E2E service type notes ${suffix}`,
    allowEmployeeEmail: false,
    ...overrides,
  };
}

export const serviceLocationManagerPageContent = {
  heading: "Service Location Manager",
  createServiceLocationLink: "Add Service Location",
  searchPlaceholder: "Search service locations",
  openMenuLabel: "Open menu",
  editAction: "Edit",
  deleteAction: "Delete",
  deleteConfirm: "Delete",
  deleteDialogTitle: "Delete Service Location",
  deactivateSuccess: "Service Location deactivated",
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  inactiveFilter: "Inactive",
};

export const serviceLocationManagerFormContent = {
  heading: "Create New Service Location",
  editHeading: "Edit Service Location",
  saveButton: "Save",
  successMessage: "Service Location created",
  updateSuccessMessage: "Service Location updated",
  clientsPlaceholder: "Type Client Name...",
  clientsSearchPlaceholder: "Search by client name or employer code",
  servicesPlaceholder: "Type Service Name...",
  servicesSearchPlaceholder: "Search services...",
  stateLabel: /^State/,
  stateSearchPlaceholder: "Search state...",
  requiredMessages: {
    serviceProvider: "Service Provider is required",
    address1: "Address Line 1 is required",
    city: "City is required",
    serviceTypeIds: "At least one Service must be selected",
  },
};

export type ServiceLocationFormTestData = {
  serviceProvider: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  notes: string;
};

/** Distinct prefix so E2E service locations are easy to identify in lists. */
export const E2E_SERVICE_LOCATION_NAME_PREFIX = "!E2E Service Location";

export function buildServiceLocationFormValues(
  overrides: Partial<ServiceLocationFormTestData> = {}
): ServiceLocationFormTestData {
  const suffix = faker.string.alphanumeric({ length: 8, casing: "upper" });

  return {
    serviceProvider: `${E2E_SERVICE_LOCATION_NAME_PREFIX} ${suffix}`,
    address1: faker.location.streetAddress(),
    address2: "",
    city: faker.location.city(),
    state: "Alaska",
    zipCode: faker.location.zipCode("#####"),
    phone: faker.string.numeric(10),
    email: faker.internet.email({
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    notes: `E2E service location notes ${suffix}`,
    ...overrides,
  };
}

export const workLocationManagerPageContent = {
  heading: "Work Location Manager",
  createWorkLocationLink: "Add Work Location",
  searchPlaceholder: "Search work locations",
  openMenuLabel: "Open menu",
  viewAction: "View Details",
  editAction: "Edit",
  deleteAction: "Delete",
  deleteConfirm: "Delete",
  deleteDialogTitle: "Delete Work Location",
  deactivateSuccess: "Work Location deactivated",
  statusFilterSubmenu: /^Status/,
  activeFilter: "Active",
  inactiveFilter: "Inactive",
  notFoundHeading: "Work location not found",
  notFoundBackLink: "Back to work locations",
};

export const workLocationManagerFormContent = {
  heading: "Create New Work Location",
  editHeading: "Edit Work Location",
  saveButton: "Save",
  successMessage: "Work Location created",
  updateSuccessMessage: "Work Location updated",
  clientsPlaceholder: "Type Client Name...",
  clientsSearchPlaceholder: "Search by client name or employer code",
  usersPlaceholder: "Type User Name...",
  usersSearchPlaceholder: "Search users...",
  stateLabel: /^State/,
  stateSearchPlaceholder: "Search state...",
  activeStatusLabel: "Active Status",
  requiredMessages: {
    location: "Work Location is required.",
    address1: "Address Line 1 is required.",
    city: "City is required.",
  },
  zipInvalidMessage: "Enter a valid ZIP Code (12345 or 12345-6789).",
  phoneInvalidMessage: "Enter a valid 10-digit phone number.",
};

export type WorkLocationFormTestData = {
  location: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  notes: string;
};

/** Distinct prefix so E2E work locations are easy to identify in lists. */
export const E2E_WORK_LOCATION_NAME_PREFIX = "!E2E Work Location";

export function buildWorkLocationFormValues(
  overrides: Partial<WorkLocationFormTestData> = {}
): WorkLocationFormTestData {
  const suffix = faker.string.alphanumeric({ length: 8, casing: "upper" });

  return {
    location: `${E2E_WORK_LOCATION_NAME_PREFIX} ${suffix}`,
    address1: faker.location.streetAddress(),
    address2: "",
    city: faker.location.city(),
    state: "Alaska",
    zipCode: faker.location.zipCode("#####"),
    phone: faker.string.numeric(10),
    notes: `E2E work location notes ${suffix}`,
    ...overrides,
  };
}

export const SERVICE_REQUEST_STATUS_OPTIONS = [
  "New - Not Scheduled",
  "Scheduled",
  "No-Show",
  "Completed - Pending Documentation",
  "Completed",
  "Canceled",
] as const;

export type ServiceRequestStatusOption =
  (typeof SERVICE_REQUEST_STATUS_OPTIONS)[number];

export const serviceRequestWorklistPageContent = {
  heading: "Service Request Worklist",
  createServiceRequestLink: "Add Service Request",
  searchPlaceholder: "Search ID, name, location, service, outcome",
  openMenuLabel: "Open menu",
  viewAction: "View Details",
  editAction: "Edit",
  deleteAction: "Delete",
  deleteConfirm: "Delete",
  deleteDialogTitle: "Delete service request?",
  statusFilterSubmenu: /^Status/,
  dateFilterPlaceholder: "YYYY-MM-DD",
  targetDateFilterLabel: "Target Date",
  appointmentDateFilterLabel: "Appointment Date",
  completedDateFilterLabel: "Completed Date",
  nextDueFilterLabel: "Next Due",
  notFoundHeading: "Service request not found",
  notFoundBackLink: "Back to worklist",
};

/** Delete toast text is dynamic (includes the record's code). */
export function serviceRequestDeleteSuccessToast(code: string): string {
  return `Service request ${code} removed from list`;
}

export const serviceRequestWorklistFormContent = {
  heading: "Create New Service Request",
  editHeading: "Edit Service Request",
  saveButton: "Save",
  saveAndAddOtherButton: "Save & Add Other Service",
  successMessage: "Service request created",
  updateSuccessMessage: "Service request updated",
  attachmentRemovedMessage: "Attachment removed",
  clientsPlaceholder: "Type Client Name...",
  clientsSearchPlaceholder: "Search by client name or employer code",
  workLocationPlaceholder: "Select work location",
  workLocationSearchPlaceholder: "Search work locations...",
  serviceRequestedPlaceholder: "Select service",
  serviceRequestedSearchPlaceholder: "Search services...",
  serviceLocationPlaceholder: "Select service location",
  serviceLocationSearchPlaceholder: "Search service locations...",
  stateLabel: /^State/,
  stateSearchPlaceholder: "Search state...",
  statusLabel: /^Status/,
  outcomeLabel: /^Outcome/,
  deleteAttachmentDialogTitle: "Delete attachment?",
  deleteAttachmentConfirm: "Delete",
  defaultStatus: "New - Not Scheduled",
  /**
   * The exact Zod messages from service-request-schema.ts. Note that only a
   * subset of these actually surface on a bare empty-form submit: `phone_type`
   * ("Mobile"), `requested_completion` (today) and `status`
   * ("New - Not Scheduled") all have valid non-empty defaults; `clients`
   * auto-seeds from the tenant context on create; and `phone` is force-filled
   * with the "+1" dial code by PhoneInput's `forceDialCode` before Save is
   * ever clicked — so none of those five error out unless explicitly
   * cleared. See `ServiceRequestWorklistFormPage.expectRequiredFieldMessages`.
   */
  requiredMessages: {
    clients: "Client is required",
    firstName: "Employee First Name is required",
    lastName: "Employee Last Name is required",
    dob: "Date of Birth is required",
    workLocation: "Employee Work Location is required",
    email: "Email is required",
    invalidEmail: "Invalid email address",
    phone: "Phone is required",
    phoneType: "Phone Type is required",
    availability: "Availability is required",
    serviceRequested: "Service Requested is required",
    requestedCompletion: "Requested Completion is required",
    status: "Status is required",
  },
};

export type ServiceRequestFormTestData = {
  lastName: string;
  firstName: string;
  employeeId: string;
  dob: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  phoneType: "Mobile" | "Home" | "Work";
  availability: string;
};

/**
 * Distinct prefix on last name so E2E service requests are easy to find —
 * the worklist search hits `first_name`/`last_name` among other fields.
 */
export const E2E_SERVICE_REQUEST_LAST_NAME_PREFIX = "!E2E-SR";

export function buildServiceRequestFormValues(
  overrides: Partial<ServiceRequestFormTestData> = {}
): ServiceRequestFormTestData {
  const suffix = faker.string.alphanumeric({ length: 8, casing: "upper" });

  return {
    lastName: `${E2E_SERVICE_REQUEST_LAST_NAME_PREFIX} ${suffix}`,
    firstName: faker.person.firstName(),
    employeeId: faker.string.alphanumeric({ length: 6, casing: "upper" }),
    dob: "1990-05-15",
    address1: faker.location.streetAddress(),
    address2: "",
    city: faker.location.city(),
    state: "Alaska",
    zipCode: faker.location.zipCode("#####"),
    email: faker.internet.email({
      provider: "example.com",
      allowSpecialCharacters: false,
    }),
    phone: faker.string.numeric(10),
    phoneType: "Mobile",
    availability: `E2E availability notes ${suffix}`,
    ...overrides,
  };
}
