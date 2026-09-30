export type UserRoleMode = 'admin' | 'employee';

export type ActiveTab = 
  | 'dashboard' 
  | 'documents' 
  | 'matrix' 
  | 'pipeline' 
  | 'hitl' 
  | 'learning' 
  | 'policy' 
  | 'analytics';

export interface JobRole {
  id: string;
  title: string;
  department: string;
  description: string;
  activeLearners: number;
  mandatoryPolicyCount: number;
  competencyCount: number;
}

export interface Employee {
  id: string;
  name: string;
  roleId: string;
  roleTitle: string;
  department: string;
  joiningDate: string;
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';
  avatar: string;
  progressPercentage: number;
  currentMilestone: string;
  status: 'On Track' | 'Needs Attention' | 'Completed';
}

export type DocumentCategory = 'SOP' | 'HR Policy' | 'Compliance' | 'Technical Spec' | 'Security Policy' | 'FAQ';
export type SecurityStatus = 'Clean' | 'Potential Prompt Injection Detected' | 'Instruction Override Flagged';

export interface Document {
  id: string;
  documentId: string;
  title: string;
  category: DocumentCategory;
  version: string;
  effectiveDate: string;
  expiryDate: string;
  department: string;
  precedenceOrder: number;
  chunksCount: number;
  securityStatus: SecurityStatus;
  status: 'Active' | 'Obsolete' | 'Draft';
  fileFormat: 'pdf' | 'docx';
}

export interface TextChunk {
  id: string;
  chunkId: string;
  docId: string;
  docTitle: string;
  sectionId: string;
  heading: string;
  pageNumber?: number;
  paragraphRef?: string;
  content: string;
  vectorEmbeddingStatus: 'Indexed' | 'Pending';
  precedenceScore: number;
}

export interface MatrixRequirement {
  id: string;
  requirementId: string;
  roleId: string;
  competencyName: string;
  policyMapping: string;
  docId: string;
  sectionRef: string;
  isMandatory: boolean;
  priority: 'High' | 'Medium' | 'Low';
  dueStage: 'Day 1' | 'Week 1' | 'Week 2' | 'Month 1' | 'Month 2' | 'Month 3';
  status: 'Mapped' | 'Missing Document' | 'Needs Update';
}

export type ValidationStatus = 
  | 'Verified'
  | 'Verified with Warning'
  | 'Source Support Missing'
  | 'Requirement Missing'
  | 'Unsupported Requirement'
  | 'Outdated Source'
  | 'Contradiction Detected'
  | 'Manual Review Required';

export interface DualPipelineItem {
  id: string;
  fieldId: string;
  fieldName: string;
  genAiOutput: string;
  groundTruthExpected: string;
  status: ValidationStatus;
  reqId: string;
  sourceDocId: string;
  sourceSection: string;
  contradictionDetails?: string;
  resolutionNote?: string;
}

export interface DualPipelineResult {
  runId: string;
  employeeId: string;
  roleTitle: string;
  timestamp: string;
  mandatoryCoverageScore: number; // 0 - 100
  traceabilityScore: number;      // 0 - 100
  consistencyScore: number;       // 0 - 100
  missingRequirementsCount: number;
  unsupportedClaimsCount: number;
  contradictionCount: number;
  items: DualPipelineItem[];
  executionTimeMs: number;
  generatedPlanJson: any;
  validationReport?: OnboardingValidationReport;
}

export interface HitlReviewItem {
  id: string;
  pipelineItemId: string;
  employeeName: string;
  roleTitle: string;
  itemTitle: string;
  genAiOutput: string;
  groundTruthExcerpt: string;
  sourceDocId: string;
  sourceSection: string;
  sourcePageRef: string;
  contradictionType: 'Contradiction Detected' | 'Unsupported Claim' | 'Requirement Missing' | 'Manual Review Required';
  urgency: 'High' | 'Medium' | 'Low';
  status: 'Pending Review' | 'Approved Override' | 'Rejected' | 'Selective Regeneration Triggered';
  reviewerNotes?: string;
  reviewerName?: string;
  updatedAt?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  durationMinutes: number;
  stage: 'Day 1' | 'Week 1' | 'Week 2' | '30 Days' | '60 Days' | '90 Days';
  completed: boolean;
  isLocked: boolean;
  prerequisiteModuleId?: string;
  prerequisiteTitle?: string;
  objectives: string[];
  sourceCitations: {
    docId: string;
    docTitle: string;
    sectionId: string;
    excerpt: string;
  }[];
  summary: string;
}

export interface QuizQuestion {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  userSelectedAnswer?: number;
  explanation: string;
  sourceDocId: string;
  sourceSection: string;
}

export interface ScenarioTask {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  simulatedScenario: string;
  submissionCriteria: {
    criterion: string;
    weight: number;
    passCondition: string;
  }[];
  userSubmission?: string;
  evaluatedResult?: {
    passed: boolean;
    score: number;
    feedback: string;
  };
}


export interface ImpactAnalysisResult {
  updatedDocId: string;
  docTitle: string;
  oldVersion: string;
  newVersion: string;
  changeSummary: string;
  affectedEmployeeCount: number;
  affectedPlanCount: number;
  outdatedModuleIds: string[];
  outdatedQuizIds: string[];
  preservedModuleCount: number;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalPlansGenerated: number;
  mandatoryCoverageAvg: number;
  sourceTraceabilityAvg: number;
  flaggedCount: number;
  activeEmployeesCount: number;
  departmentCoverage: {
    department: string;
    coveragePercent: number;
    flagCount: number;
  }[];
  flagDistribution: {
    category: string;
    count: number;
    color: string;
  }[];
  completionVelocity: {
    month: string;
    completedPlans: number;
    avgDaysToComplete: number;
  }[];
}

export interface HealthResponse {
  status: string;
  service: string;
  total_documents_stored?: number;
  total_chunks_stored?: number;
  message?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRoleMode;
  department?: string;
  employeeId?: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
  roleMode: UserRoleMode;
  employeeId?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  message?: string;
}

export interface AuthMeResponse {
  user: AuthUser;
}

export interface DocumentUploadParams {
  company_id?: string;
  document_name?: string;
  category?: string;
  version?: string;
  effective_date?: string;
  doc_id?: string;
  department?: string;
  precedence_order?: number;
  security_status?: string;
  file: File;
}

export interface DocumentUploadResponse {
  message: string;
  doc_id: string;
  filename: string;
  document_name?: string;
  company_id?: string;
  format?: string;
  chunks_stored: number;
  total_stored_chunks?: number;
  status?: string;
  parsed?: boolean;
}

export interface DocumentParseResponse {
  message: string;
  document_id: string;
  status: string;
  chunks_extracted: number;
  parsed_at?: string;
}

export interface DocumentContentResponse {
  document_id: string;
  content: string;
  chunks: any[];
  chunks_count: number;
}

export interface DocumentsListResponse {
  documents: any[];
  total_chunks: number;
  doc_ids: string[];
}

export interface DocumentRequirementItem {
  id: string;
  requirement_id: string;
  doc_id: string;
  requirement_text: string;
  mandatory: boolean;
  requirement_type: string;
  source_reference: string;
  competency?: string;
  created_at?: string;
}

export interface DocumentRequirementsResponse {
  document_id: string;
  requirements: DocumentRequirementItem[];
  total: number;
}

export interface ExtractRequirementsResponse {
  message: string;
  document_id: string;
  requirements: DocumentRequirementItem[];
  total_extracted: number;
}

export interface RoleRequirementMatrixItem {
  id: string;
  role_id: string;
  requirement_id: string;
  requirement: string;
  mandatory: boolean;
  relevance: string;
  competency: string;
  procedure: string;
  prerequisite: string;
  source_reference: string;
  doc_id?: string;
  created_at?: string;
}

export interface RoleRequirementsResponse {
  role_id: string;
  requirements: RoleRequirementMatrixItem[];
  total: number;
}

export interface BuildRoleMatrixResponse {
  message: string;
  role_id: string;
  requirements: RoleRequirementMatrixItem[];
  total_requirements: number;
}

export interface RolesListResponse {
  roles: JobRole[];
}

export interface EmployeesListResponse {
  employees: Employee[];
}

export interface GenerateOnboardingResponse {
  onboarding_plan: any;
  status: string;
}

export interface OnboardingValidationReport {
  employee_id: string;
  status: string;
  accuracy_score: number;
  mandatoryCoverageScore: number;
  traceabilityScore: number;
  consistencyScore: number;
  errors: string[];
  warnings: string[];
  missing_requirements: number;
  unsupported_items: number;
  invalid_references: number;
  duplicate_items: number;
  role_mismatches: number;
  outdated_sources: number;
  contradictions: number;
  superseded_requirements: number;
  precedence_results: any;
  manual_review_items: any[];
  timestamp?: string;
}

export interface ValidateOnboardingResponse {
  validation: OnboardingValidationReport;
  status: string;
}
