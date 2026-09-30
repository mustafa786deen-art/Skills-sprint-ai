import type {
  HealthResponse,
  LoginRequest,
  LoginResponse,
  AuthMeResponse,
  DocumentUploadParams,
  DocumentUploadResponse,
  DocumentParseResponse,
  DocumentContentResponse,
  DocumentsListResponse,
  DocumentRequirementsResponse,
  ExtractRequirementsResponse,
  RoleRequirementsResponse,
  BuildRoleMatrixResponse,
  RolesListResponse,
  EmployeesListResponse,
  GenerateOnboardingResponse,
  ValidateOnboardingResponse
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const TOKEN_KEY = 'skillsprint_auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `API error (${response.status}): ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the API backend is running.`);
    }
    throw err;
  }
}

/**
  Checks backend health status.
  Endpoint: GET /health
 */
export async function getHealth(): Promise<HealthResponse> {
  return fetchWithAuth<HealthResponse>('/health', { method: 'GET' });
}

/**
  Authenticates user credentials or persona.
  Endpoint: POST /auth/login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return fetchWithAuth<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

/**
  Fetches current authenticated user profile.
  Endpoint: GET /auth/me
 */
export async function getMe(): Promise<AuthMeResponse> {
  return fetchWithAuth<AuthMeResponse>('/auth/me', { method: 'GET' });
}

/**
  Fetches stored documents list.
  Endpoint: GET /documents
 */
export async function getDocuments(): Promise<DocumentsListResponse> {
  return fetchWithAuth<DocumentsListResponse>('/documents', { method: 'GET' });
}

/**
  Fetches document metadata details by ID.
  Endpoint: GET /documents/{document_id}
 */
export async function getDocumentById(documentId: string): Promise<{ document: any }> {
  return fetchWithAuth<{ document: any }>(`/documents/${encodeURIComponent(documentId)}`, { method: 'GET' });
}

/**
  Uploads PDF or DOCX policy document with metadata.
  Endpoint: POST /documents/upload
 */
export async function uploadDocument(params: DocumentUploadParams): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.company_id) formData.append('company_id', params.company_id);
  if (params.document_name) formData.append('document_name', params.document_name);
  if (params.category) formData.append('category', params.category);
  if (params.version) formData.append('version', params.version);
  if (params.effective_date) formData.append('effective_date', params.effective_date);
  if (params.doc_id) formData.append('doc_id', params.doc_id);
  if (params.department) formData.append('department', params.department);
  if (params.precedence_order !== undefined) formData.append('precedence_order', String(params.precedence_order));
  if (params.security_status) formData.append('security_status', params.security_status);

  return fetchWithAuth<DocumentUploadResponse>('/documents/upload', {
    method: 'POST',
    body: formData
  });
}

/**
  Triggers parsing and indexing for a specific document ID.
  Endpoint: POST /documents/{document_id}/parse
 */
export async function parseDocument(documentId: string): Promise<DocumentParseResponse> {
  return fetchWithAuth<DocumentParseResponse>(`/documents/${encodeURIComponent(documentId)}/parse`, {
    method: 'POST'
  });
}

/**
  Fetches extracted content and text chunks for a document ID.
  Endpoint: GET /documents/{document_id}/content
 */
export async function getDocumentContent(documentId: string): Promise<DocumentContentResponse> {
  return fetchWithAuth<DocumentContentResponse>(`/documents/${encodeURIComponent(documentId)}/content`, {
    method: 'GET'
  });
}

/**
  Fetches available job roles.
  Endpoint: GET /roles
 */
export async function getRoles(): Promise<RolesListResponse> {
  return fetchWithAuth<RolesListResponse>('/roles', { method: 'GET' });
}

/**
  Fetches active employees list.
  Endpoint: GET /employees
 */
export async function getEmployees(): Promise<EmployeesListResponse> {
  return fetchWithAuth<EmployeesListResponse>('/employees', { method: 'GET' });
}

/**
  Triggers requirement extraction from a document.
  Endpoint: POST /documents/{document_id}/requirements/extract
 */
export async function extractDocumentRequirements(documentId: string): Promise<ExtractRequirementsResponse> {
  return fetchWithAuth<ExtractRequirementsResponse>(`/documents/${encodeURIComponent(documentId)}/requirements/extract`, {
    method: 'POST'
  });
}

/**
  Lists requirements extracted from a document.
  Endpoint: GET /documents/{document_id}/requirements
 */
export async function getDocumentRequirements(documentId: string): Promise<DocumentRequirementsResponse> {
  return fetchWithAuth<DocumentRequirementsResponse>(`/documents/${encodeURIComponent(documentId)}/requirements`, {
    method: 'GET'
  });
}

/**
  Triggers building requirement matrix for a job role.
  Endpoint: POST /roles/{role_id}/requirements/build
 */
export async function buildRoleMatrix(roleId: string): Promise<BuildRoleMatrixResponse> {
  return fetchWithAuth<BuildRoleMatrixResponse>(`/roles/${encodeURIComponent(roleId)}/requirements/build`, {
    method: 'POST'
  });
}

/**
  Lists requirements mapped to a specific job role.
  Endpoint: GET /roles/{role_id}/requirements
 */
export async function getRoleRequirements(roleId: string): Promise<RoleRequirementsResponse> {
  return fetchWithAuth<RoleRequirementsResponse>(`/roles/${encodeURIComponent(roleId)}/requirements`, {
    method: 'GET'
  });
}

/**
  Generates an onboarding plan for a given employee ID.
  Endpoint: POST /employees/{employee_id}/onboarding/generate
 */
export async function generateOnboarding(employeeId: string, options: any = {}): Promise<GenerateOnboardingResponse> {
  return fetchWithAuth<GenerateOnboardingResponse>(`/employees/${encodeURIComponent(employeeId)}/onboarding/generate`, {
    method: 'POST',
    body: JSON.stringify(options)
  });
}

/**
  Validates a generated onboarding plan against policy rules for an employee ID.
  Endpoint: POST /employees/{employee_id}/onboarding/validate
 */
export async function validateOnboarding(employeeId: string, onboardingPlan?: any): Promise<ValidateOnboardingResponse> {
  return fetchWithAuth<ValidateOnboardingResponse>(`/employees/${encodeURIComponent(employeeId)}/onboarding/validate`, {
    method: 'POST',
    body: JSON.stringify({ onboarding_plan: onboardingPlan })
  });
}

