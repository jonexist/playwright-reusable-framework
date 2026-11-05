import type { Response } from "@playwright/test";

/** Matches list/read requests routed through `/api/proxy/api/client`. */
export function isClientListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/client");
}

export function isClientListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isClientListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/client`. */
export function isClientCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/client");
}

/** Matches list/read requests routed through `/api/proxy/api/location`. */
export function isLocationListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/location");
}

export function isLocationListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches location list GETs filtered to a single status value (e.g. "active"). */
export function isLocationListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/location`. */
export function isLocationCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/location");
}

/** Matches list/read requests routed through `/api/proxy/api/scheduling/purposes`. */
export function isPurposeListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/purposes");
}

export function isPurposeListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isPurposeListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/scheduling/purposes`. */
export function isPurposeCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/purposes");
}

/** Matches updates routed through `/api/proxy/api/scheduling/purposes/:id`. */
export function isPurposeUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  // purposes/[id]/edit/page.tsx passes "api/scheduling/purposes/" (trailing
  // slash) into usePatchData, and buildUrl() only strips a *leading* slash
  // before appending `/${id}` — producing a double slash before the id
  // (".../purposes//{id}"), so allow 1+ slashes.
  return /\/api\/scheduling\/purposes\/+\d+$/.test(pathname);
}

/** Matches detail reads routed through `/api/proxy/api/scheduling/purposes/:id`. */
export function isPurposeDetailResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/purposes\/\d+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/patient`. */
export function isPatientListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/patient");
}

export function isPatientListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isPatientListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches patient list GETs filtered by `is_active` (true/false). */
export function isPatientListActiveResponse(
  response: Response,
  isActive: boolean
): boolean {
  if (!isPatientListResponse(response)) {
    return false;
  }

  return (
    new URL(response.url()).searchParams.get("is_active") === String(isActive)
  );
}

/** Matches detail/retrieve requests routed through `/api/proxy/api/patient/{id}`. */
export function isPatientDetailResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/patient\/\d+$/.test(pathname);
}

/** Matches create requests routed through `/api/proxy/api/patient`. */
export function isPatientCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/patient");
}

/** Matches list/read requests routed through `/api/proxy/api/users`. */
export function isUserListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/users");
}

export function isUserListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isUserListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches user list GETs filtered to a single status value (e.g. "active"). */
export function isUserListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isUserListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/users`. */
export function isUserCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/users");
}

/** Matches user PATCH used for edit and deactivate. */
export function isUserUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/users\/\d+$/.test(pathname);
}

/** Matches failed create POSTs routed through `/api/proxy/api/users`. */
export function isUserCreateErrorResponse(response: Response): boolean {
  return isUserCreateResponse(response) && response.status() >= 400;
}

/** Matches POST `/api/users/{id}/activate/`. */
export function isUserActivateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/users\/\d+\/activate$/.test(pathname);
}

/** Matches POST `/api/users/{id}/reject/`. */
export function isUserRejectResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/users\/\d+\/reject$/.test(pathname);
}

/** Matches GET `/api/users/{id}/delete-preview/`. */
export function isUserDeletePreviewResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/users\/\d+\/delete-preview$/.test(pathname);
}

/** Matches DELETE `/api/users/{id}`. */
export function isUserDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/users\/\d+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/roles`. */
export function isRoleListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/roles");
}

export function isRoleListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isRoleListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/roles`. */
export function isRoleCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/roles");
}

/** Matches role PATCH used for edit. */
export function isRoleUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/roles\/\d+$/.test(pathname);
}

/** Matches DELETE `/api/roles/{id}`. */
export function isRoleDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/roles\/\d+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/biometrics/screenings`. */
export function isBiometricScreeningListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/screenings");
}

export function isBiometricScreeningListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isBiometricScreeningListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches biometric list GETs filtered by `workflow_status`. */
export function isBiometricScreeningListWorkflowStatusResponse(
  response: Response,
  workflowStatus: string
): boolean {
  if (!isBiometricScreeningListResponse(response)) {
    return false;
  }

  return (
    new URL(response.url()).searchParams.get("workflow_status") ===
    workflowStatus
  );
}

/** Matches create requests routed through `/api/proxy/api/biometrics/screenings`. */
export function isBiometricScreeningCreateResponse(
  response: Response
): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/screenings");
}

/** Matches update requests routed through `/api/proxy/api/biometrics/screenings/{id}`. */
export function isBiometricScreeningUpdateResponse(
  response: Response
): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/biometrics\/screenings\/\d+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/biometrics/flu-shots`. */
export function isFluShotListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/flu-shots");
}

export function isFluShotListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isFluShotListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches flu-shot list GETs filtered by `workflow_status`. */
export function isFluShotListWorkflowStatusResponse(
  response: Response,
  workflowStatus: string
): boolean {
  if (!isFluShotListResponse(response)) {
    return false;
  }

  return (
    new URL(response.url()).searchParams.get("workflow_status") ===
    workflowStatus
  );
}

/** Matches create requests routed through `/api/proxy/api/biometrics/flu-shots`. */
export function isFluShotCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/flu-shots");
}

/** Matches update requests routed through `/api/proxy/api/biometrics/flu-shots/{id}`. */
export function isFluShotUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/biometrics\/flu-shots\/\d+$/.test(pathname);
}

/** Matches send-registration POST for biometric screenings. */
export function isBiometricSendRegistrationResponse(
  response: Response
): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/screenings/send-registration");
}

/** Matches send-registration POST for flu shots. */
export function isFluShotSendRegistrationResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/flu-shots/send-registration");
}

/** Matches cancel POST for biometric screenings. */
export function isBiometricCancelResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/biometrics\/screenings\/\d+\/cancel$/.test(pathname);
}

/** Matches cancel POST for flu shots. */
export function isFluShotCancelResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/biometrics\/flu-shots\/\d+\/cancel$/.test(pathname);
}

/** Matches patient PATCH used for relocate during manual edit. */
export function isPatientUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/patient\/\d+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/scheduling/schedules`. */
export function isScheduleListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/schedules");
}

export function isScheduleListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isScheduleListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/scheduling/schedules`. */
export function isScheduleCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/schedules");
}

/** Matches create requests routed through `/api/proxy/api/scheduling/events`. */
export function isScheduleEventCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/events");
}

/** Matches list/read requests routed through `/api/proxy/api/scheduling/appointments`. */
export function isAppointmentListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/appointments");
}

export function isAppointmentListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isAppointmentListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches walk-in register POST. */
export function isWalkinRegisterResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/walkin/register");
}

/** Matches public registration POST. */
export function isPublicRegisterResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/public/register");
}

/** Matches appointment check-in POST. */
export function isAppointmentCheckInResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/appointments\/\d+\/check_in$/.test(pathname);
}

/** Matches appointment uncheck-in POST. */
export function isAppointmentUncheckInResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/appointments\/\d+\/uncheck_in$/.test(pathname);
}

/** Matches appointment cancel POST. */
export function isAppointmentCancelResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/appointments\/\d+\/cancel$/.test(pathname);
}

/** Matches appointment complete POST (processing wizard "Complete Appointment"). */
export function isAppointmentCompleteResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/appointments\/\d+\/complete$/.test(pathname);
}

/** Matches appointment no-show POST. */
export function isAppointmentNoShowResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/appointments\/\d+\/mark_no_show$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/scheduling/consents`. */
export function isConsentListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/consents");
}

export function isConsentListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isConsentListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/scheduling/consents`. */
export function isConsentCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/consents");
}

/** Matches list/read requests routed through `/api/proxy/api/scheduling/aoe-lists`. */
export function isAoeListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/aoe-lists");
}

export function isAoeListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isAoeListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches create requests routed through `/api/proxy/api/scheduling/aoe-lists`. */
export function isAoeListCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/aoe-lists");
}

/** Matches POST `/api/scheduling/aoe-questions`. */
export function isAoeQuestionCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/scheduling/aoe-questions");
}

/** Matches list/read for recommendation templates. */
export function isRecommendationTemplateListResponse(
  response: Response
): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/recommendation-templates");
}

/** Matches create for recommendation templates. */
export function isRecommendationTemplateCreateResponse(
  response: Response
): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/biometrics/recommendation-templates");
}

/**
 * Matches the processing wizard's public schedule detail GET
 * (`?schedule=<slug>`), used to know when `hasRegistrationAoeQuestions` has
 * settled from its loading `null` to a final true/false.
 */
export function isPublicScheduleDetailResponse(
  response: Response,
  scheduleSlug?: string
): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const url = new URL(response.url());
  const pathname = url.pathname.replace(/\/$/, "");
  if (!pathname.endsWith("/api/scheduling/public/schedules")) {
    return false;
  }

  const slugParam = url.searchParams.get("schedule");
  if (!slugParam) {
    return false;
  }

  return scheduleSlug ? slugParam === scheduleSlug : true;
}

/** Matches queue claim POST. */
export function isQueueClaimResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/queue\/\d+\/claim$/.test(pathname);
}

/** Matches queue release-back-to-queue POST. */
export function isQueueReleaseResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/scheduling\/queue\/\d+\/release$/.test(pathname);
}

function occurrencePathname(response: Response): string {
  return new URL(response.url()).pathname.replace(/\/$/, "");
}

/** Matches list/read requests routed through `/api/proxy/api/clinical-occurrence/occurrences`. */
export function isOccurrenceListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  return occurrencePathname(response).endsWith(
    "/api/clinical-occurrence/occurrences"
  );
}

export function isOccurrenceListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isOccurrenceListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches occurrence list GETs filtered by `status` (e.g. open, closed). */
export function isOccurrenceListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isOccurrenceListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/clinical-occurrence/occurrences`. */
export function isOccurrenceCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  return occurrencePathname(response).endsWith(
    "/api/clinical-occurrence/occurrences"
  );
}

/** Matches update requests routed through `/api/proxy/api/clinical-occurrence/occurrences/:id`. */
export function isOccurrenceUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  return /\/api\/clinical-occurrence\/occurrences\/[^/]+$/.test(
    occurrencePathname(response)
  );
}

/** Matches task create requests routed through `/api/proxy/api/clinical-occurrence/tasks`. */
export function isOccurrenceTaskCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  return occurrencePathname(response).endsWith(
    "/api/clinical-occurrence/tasks"
  );
}

/** Matches comment create requests routed through `/api/proxy/api/clinical-occurrence/comments`. */
export function isOccurrenceCommentCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  return occurrencePathname(response).endsWith(
    "/api/clinical-occurrence/comments"
  );
}

/** Matches list/read requests routed through `/api/proxy/api/service-request/service-types`. */
export function isServiceTypeListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-types");
}

export function isServiceTypeListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isServiceTypeListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches service type list GETs filtered to a single status value (e.g. "active"). */
export function isServiceTypeListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isServiceTypeListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/service-request/service-types`. */
export function isServiceTypeCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-types");
}

/** Matches service type PATCH used for edit. */
export function isServiceTypeUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  // services-manager-detail.tsx passes SRM_SERVICE_TYPES_ENDPOINT with a
  // trailing slash into usePatchData, and buildUrl() only strips a *leading*
  // slash before appending `/${id}` — producing a double slash before the id
  // (".../service-types//{id}"), so allow one-or-more slashes there.
  return /\/api\/service-request\/service-types\/+[^/]+$/.test(pathname);
}

/** Matches DELETE `/api/service-request/service-types/{id}`. */
export function isServiceTypeDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-types\/[^/]+$/.test(pathname);
}

/** Matches POST `/api/service-request/service-types/{id}/files`. */
export function isServiceTypeFileUploadResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-types\/[^/]+\/files$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/service-request/service-locations`. */
export function isServiceLocationListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-locations");
}

export function isServiceLocationListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isServiceLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches service location list GETs filtered to a single status value (e.g. "active"). */
export function isServiceLocationListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isServiceLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/service-request/service-locations`. */
export function isServiceLocationCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-locations");
}

/** Matches service location PATCH used for edit. */
export function isServiceLocationUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  // service-location-manager-detail.tsx passes SRM_SERVICE_LOCATIONS_ENDPOINT
  // with a trailing slash into usePatchData, and buildUrl() only strips a
  // *leading* slash before appending `/${id}` — producing a double slash
  // before the id (".../service-locations//{id}"), so allow 1+ slashes.
  return /\/api\/service-request\/service-locations\/+[^/]+$/.test(pathname);
}

/** Matches DELETE `/api/service-request/service-locations/{id}` (soft deactivate). */
export function isServiceLocationDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-locations\/[^/]+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/service-request/work-locations`. */
export function isWorkLocationListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/work-locations");
}

export function isWorkLocationListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isWorkLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches work location list GETs filtered to a single status value (e.g. "active"). */
export function isWorkLocationListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isWorkLocationListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/** Matches create requests routed through `/api/proxy/api/service-request/work-locations`. */
export function isWorkLocationCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/work-locations");
}

/** Matches work location PATCH used for edit. */
export function isWorkLocationUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  // work-location-manager-detail.tsx passes SRM_WORK_LOCATIONS_ENDPOINT with
  // a trailing slash into usePatchData, and buildUrl() only strips a
  // *leading* slash before appending `/${id}` — producing a double slash
  // before the id (".../work-locations//{id}"), so allow 1+ slashes.
  return /\/api\/service-request\/work-locations\/+[^/]+$/.test(pathname);
}

/** Matches DELETE `/api/service-request/work-locations/{id}` (soft deactivate). */
export function isWorkLocationDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/work-locations\/[^/]+$/.test(pathname);
}

/** Matches list/read requests routed through `/api/proxy/api/service-request/service-requests`. */
export function isServiceRequestListResponse(response: Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-requests");
}

export function isServiceRequestListSearchResponse(
  response: Response,
  query: string
): boolean {
  if (!isServiceRequestListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("search") === query;
}

/** Matches service request list GETs filtered to a single status value. */
export function isServiceRequestListStatusResponse(
  response: Response,
  status: string
): boolean {
  if (!isServiceRequestListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get("status") === status;
}

/**
 * Matches service request list GETs filtered by one of the four date
 * filters (Target Date/Appointment Date/Completed Date/Next Due), which all
 * share this same shape — a single generic helper avoids four near-duplicate
 * functions.
 */
export function isServiceRequestListDateFilterResponse(
  response: Response,
  param:
    | "requested_completion"
    | "appointment_at"
    | "completion_date"
    | "next_due_date",
  value: string
): boolean {
  if (!isServiceRequestListResponse(response)) {
    return false;
  }

  return new URL(response.url()).searchParams.get(param) === value;
}

/** Matches create requests routed through `/api/proxy/api/service-request/service-requests`. */
export function isServiceRequestCreateResponse(response: Response): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return pathname.endsWith("/api/service-request/service-requests");
}

/** Matches service request PATCH used for edit. */
export function isServiceRequestUpdateResponse(response: Response): boolean {
  if (response.request().method() !== "PATCH") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  // service-request-detail.tsx passes SRM_SERVICE_REQUESTS_ENDPOINT with a
  // trailing slash into usePatchData, and buildUrl() only strips a *leading*
  // slash before appending `/${id}` — producing a double slash before the id
  // (".../service-requests//{id}"), so allow 1+ slashes.
  return /\/api\/service-request\/service-requests\/+[^/]+$/.test(pathname);
}

/** Matches DELETE `/api/service-request/service-requests/{id}` (hard delete). */
export function isServiceRequestDeleteResponse(response: Response): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-requests\/[^/]+$/.test(pathname);
}

/** Matches POST `/api/service-request/service-requests/{id}/files/` (attachment upload). */
export function isServiceRequestFileUploadResponse(
  response: Response
): boolean {
  if (response.request().method() !== "POST") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-requests\/[^/]+\/files$/.test(
    pathname
  );
}

/**
 * Matches DELETE `/api/service-request/service-request-files/{id}` (attachment
 * delete). This is a distinct router basename from `service-requests` (the
 * parent record) — do not confuse with `isServiceRequestDeleteResponse`.
 */
export function isServiceRequestAttachmentDeleteResponse(
  response: Response
): boolean {
  if (response.request().method() !== "DELETE") {
    return false;
  }

  const pathname = new URL(response.url()).pathname.replace(/\/$/, "");
  return /\/api\/service-request\/service-request-files\/[^/]+$/.test(pathname);
}
