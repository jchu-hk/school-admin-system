import apiClient from './client';

// ============ Asset Types ============
export interface Asset {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  availableQuantity: number;
  value: number;
  unit?: string;
  purchaseDate?: string;
  supplier?: string;
  location?: string;
  status: string;
  description?: string;
  remark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetDto {
  schoolId: string;
  name: string;
  code: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity?: number;
  unit?: string;
  value?: number;
  purchaseDate?: string;
  supplier?: string;
  location?: string;
  status?: string;
  description?: string;
  remark?: string;
}

export interface UpdateAssetDto {
  name?: string;
  code?: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity?: number;
  availableQuantity?: number;
  unit?: string;
  value?: number;
  purchaseDate?: string;
  supplier?: string;
  location?: string;
  status?: string;
  isActive?: boolean;
  description?: string;
  remark?: string;
}

export interface AssetQueryParams {
  page?: number;
  pageSize?: number;
  schoolId?: string;
  category?: string;
  status?: string;
  location?: string;
  keyword?: string;
  isActive?: boolean;
}

// ============ Asset Rental Types ============
export interface AssetRental {
  id: string;
  assetId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerDepartment?: string;
  lendDate: string;
  dueDate?: string;
  returnDate?: string;
  renterId?: string;
  renterName?: string;
  quantity: number;
  status: string;
  purpose?: string;
  note?: string;
  returnNote?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalDto {
  assetId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerDepartment?: string;
  lendDate: string;
  dueDate?: string;
  quantity?: number;
  purpose?: string;
  note?: string;
}

export interface UpdateRentalDto {
  dueDate?: string;
  returnDate?: string;
  status?: string;
  note?: string;
  returnNote?: string;
}

export interface ApproveRentalDto {
  note?: string;
  dueDate?: string;
}

export interface ReturnRentalDto {
  quantity?: number;
  returnNote?: string;
}

export interface RentalQueryParams {
  page?: number;
  pageSize?: number;
  assetId?: string;
  borrowerId?: string;
  status?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// ============ API Functions ============

// Asset APIs
export async function getAssets(params: AssetQueryParams = {}): Promise<{ data: Asset[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get('/asset', { params });
  return response.data;
}

export async function getAsset(id: string): Promise<Asset> {
  const response = await apiClient.get(`/asset/${id}`);
  return response.data;
}

export async function createAsset(data: CreateAssetDto): Promise<Asset> {
  const response = await apiClient.post('/asset', data);
  return response.data;
}

export async function updateAsset(id: string, data: UpdateAssetDto): Promise<Asset> {
  const response = await apiClient.put(`/asset/${id}`, data);
  return response.data;
}

export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/asset/${id}`);
}

export async function getAssetStatistics(schoolId: string): Promise<{
  totalAssets: number;
  totalValue: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  const response = await apiClient.get('/asset/statistics', { params: { schoolId } });
  return response.data;
}

// Asset Rental APIs
export async function getRentals(params: RentalQueryParams = {}): Promise<{ data: AssetRental[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get('/asset/rentals', { params });
  return response.data;
}

export async function getRental(id: string): Promise<AssetRental> {
  const response = await apiClient.get(`/asset/rentals/${id}`);
  return response.data;
}

export async function createRental(data: CreateRentalDto): Promise<AssetRental> {
  const response = await apiClient.post('/asset/rentals', data);
  return response.data;
}

export async function updateRental(id: string, data: UpdateRentalDto): Promise<AssetRental> {
  const response = await apiClient.put(`/asset/rentals/${id}`, data);
  return response.data;
}

export async function deleteRental(id: string): Promise<void> {
  await apiClient.delete(`/asset/rentals/${id}`);
}

export async function approveRental(id: string, data: ApproveRentalDto = {}): Promise<AssetRental> {
  const response = await apiClient.post(`/asset/rentals/${id}/approve`, data);
  return response.data;
}

export async function lendAsset(id: string): Promise<AssetRental> {
  const response = await apiClient.post(`/asset/rentals/${id}/lend`);
  return response.data;
}

export async function returnAsset(id: string, data: ReturnRentalDto = {}): Promise<AssetRental> {
  const response = await apiClient.post(`/asset/rentals/${id}/return`, data);
  return response.data;
}

export async function rejectRental(id: string, note: string = ''): Promise<AssetRental> {
  const response = await apiClient.post(`/asset/rentals/${id}/reject`, { note });
  return response.data;
}

export async function getOverdueRentals(): Promise<AssetRental[]> {
  const response = await apiClient.get('/asset/rentals/overdue');
  return response.data;
}
