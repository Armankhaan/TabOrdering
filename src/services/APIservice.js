// src/services/APIservice.js
import axios from 'axios';
import Config from '../constants/Config';

const apiClient = axios.create({
  baseURL: Config.BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * 1. Fetch all active regions and their underlying sub-regions
 */
export const getTradeAreas = async (company_id = Config.COMPANY_ID) => {
  try {
    const response = await apiClient.get(`/trade-areas?company_id=${company_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trade areas:", error);
    throw error;
  }
};

/**
 * 2. Resolve branch details from a sub-region ID
 */
export const resolveBranch = async (sub_region_id) => {
  try {
    const response = await apiClient.get(`/branch-resolve?sub_region_id=${sub_region_id}`);
    return response.data;
  } catch (error) {
    console.error("Error resolving branch:", error);
    throw error;
  }
};

/**
 * 3. Fetch categories, products, and deals in one payload
 */
export const getCombinedMenu = async (company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/menu?company_id=${company_id}&branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching combined menu:", error);
    throw error;
  }
};

/**
 * 4. Get active categories for a branch
 */
export const getCategories = async (company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/categories?company_id=${company_id}&branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

/**
 * 5. Get products for a branch by category
 */
export const getProducts = async (company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID, category_id) => {
  try {
    const response = await apiClient.get(`/products?company_id=${company_id}&branch_id=${branch_id}&category_id=${category_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

/**
 * 6. Get single product with full variant hierarchy
 */
export const getProductDetails = async (product_id, company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/products/${product_id}?company_id=${company_id}&branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

/**
 * 7. List all active deals for a branch
 */
export const getDeals = async (company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/deals?company_id=${company_id}&branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching deals:", error);
    throw error;
  }
};

/**
 * 8. Get single deal details and attached items
 */
export const getDealDetails = async (deal_id, company_id = Config.COMPANY_ID, branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/deals/${deal_id}?company_id=${company_id}&branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching deal details:", error);
    throw error;
  }
};

/**
 * 9. Get tables for a branch
 */
export const getTables = async (branch_id = Config.DEFAULT_BRANCH_ID) => {
  try {
    const response = await apiClient.get(`/tables?branch_id=${branch_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tables:", error);
    throw error;
  }
};

/**
 * 10. Remove (un-select) a table
 */
export const removeTable = async (branch_id, table_number) => {
  try {
    const response = await apiClient.post('/tables/remove', {
      branch_id,
      table_number
    });
    return response.data;
  } catch (error) {
    console.error("Error removing table:", error);
    throw error;
  }
};

/**
 * Legacy support for banners 
 */
export const getBanners = async () => {
  try {
    const response = await axios.get('https://krc.shabanbabar.com/api/mobile-banners');
    return response.data;
  } catch (error) {
    // If legacy banners fail (e.g. 503 during migration), return null to handled gracefully
    return null;
  }
};