import { apiClient } from './client';
import type {
  AgentsDetailResponse,
  AutostrikeDetailResponse,
  CollectionsDetailResponse,
  DisbursementsDetailResponse,
  ReportExportFormat,
  ReportExportRequest,
  ReportFilters,
  ReportGranularity,
  ReportSummaryResponse,
  RevenueDetailResponse,
  RiskDetailResponse,
} from '@/lib/types';

export interface ReportQueryParams {
  date_from?: string;
  date_to?: string;
  timezone?: string;
  granularity?: ReportGranularity;
  agent_id?: string;
  product_id?: string;
  loan_type?: string;
  status?: string;
  channel?: string;
  risk_level?: string;
}

export interface ReportDetailParams extends ReportQueryParams {
  page?: number;
  page_size?: number;
}

function buildExportPayload(
  reportType: string,
  exportFormat: ReportExportFormat,
  dateFrom?: string,
  dateTo?: string,
  timezone = 'Africa/Kampala',
  granularity: ReportGranularity = 'day',
  filters: ReportFilters = {},
): ReportExportRequest {
  return {
    report_type: reportType,
    export_format: exportFormat,
    date_from: dateFrom,
    date_to: dateTo,
    timezone,
    granularity,
    filters,
  };
}

async function downloadExportBlob(
  payload: ReportExportRequest,
  endpoint: '/reports/export' | '/reports/export-detail' = '/reports/export-detail',
): Promise<Blob> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const url = new URL(`${baseUrl}${endpoint}`);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiClient.getAccessToken() ? { Authorization: `Bearer ${apiClient.getAccessToken()}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {
      // Keep default error message.
    }
    throw new Error(message);
  }

  return response.blob();
}

export const reportsApi = {
  getSummary: async (params?: ReportQueryParams): Promise<ReportSummaryResponse> => {
    return apiClient.get<ReportSummaryResponse>('/reports/summary', params);
  },

  getDisbursementsDetail: async (params?: ReportDetailParams): Promise<DisbursementsDetailResponse> => {
    return apiClient.get<DisbursementsDetailResponse>('/reports/summary/disbursements', params);
  },

  getCollectionsDetail: async (params?: ReportDetailParams): Promise<CollectionsDetailResponse> => {
    return apiClient.get<CollectionsDetailResponse>('/reports/summary/collections', params);
  },

  getRevenueDetail: async (params?: ReportDetailParams): Promise<RevenueDetailResponse> => {
    return apiClient.get<RevenueDetailResponse>('/reports/summary/revenue', params);
  },

  getRiskDetail: async (params?: ReportDetailParams): Promise<RiskDetailResponse> => {
    return apiClient.get<RiskDetailResponse>('/reports/summary/risk', params);
  },

  getAutostrikeDetail: async (params?: ReportDetailParams): Promise<AutostrikeDetailResponse> => {
    return apiClient.get<AutostrikeDetailResponse>('/reports/summary/autostrike', params);
  },

  getAgentsDetail: async (params?: ReportDetailParams): Promise<AgentsDetailResponse> => {
    return apiClient.get<AgentsDetailResponse>('/reports/summary/agents', params);
  },

  exportSummary: async (payload: ReportExportRequest): Promise<Blob> => {
    return downloadExportBlob(payload, '/reports/export');
  },

  exportDetail: async (
    reportType: string,
    exportFormat: ReportExportFormat,
    dateFrom?: string,
    dateTo?: string,
    timezone = 'Africa/Kampala',
    granularity: ReportGranularity = 'day',
    filters: ReportFilters = {},
  ): Promise<Blob> => {
    const payload = buildExportPayload(reportType, exportFormat, dateFrom, dateTo, timezone, granularity, filters);
    return downloadExportBlob(payload, '/reports/export-detail');
  },
};
