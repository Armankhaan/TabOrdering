import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import {
  getTradeAreas,
  resolveBranch,
  getCombinedMenu,
  getCategories,
  getProducts,
  getProductDetails,
  getDeals,
  getDealDetails
} from '../services/APIservice';
import Config from '../constants/Config';
import getErrorMessage from '../utils/errorHelper';

export const StoreContext = createContext({});

const StoreContextProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [menuData, setMenuData] = useState({
    categories: [],
    deals: [],
    branch: null,
  });

  const [tradeAreas, setTradeAreas] = useState([]);
  const [selectedSubRegion, setSelectedSubRegion] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  // Load saved data and initial trade areas on startup
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const safeGetItem = async (key) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (e) {
            console.warn(`Error reading key ${key} from AsyncStorage:`, e);
            if (e.message && (e.message.includes('CursorWindow') || e.message.includes('too big'))) {
              try {
                await AsyncStorage.removeItem(key);
              } catch (clearErr) {
                console.warn(`Failed to clear oversized key ${key}:`, clearErr);
              }
            }
            return null;
          }
        };

        const [
          cachedCart,
          cachedMenuData,
          savedCustomer,
          savedUsername,
          savedSubRegion,
          savedBranch
        ] = await Promise.all([
          safeGetItem('cartItems'),
          safeGetItem('menuData'),
          safeGetItem('customerInfo'),
          safeGetItem('username'),
          safeGetItem('selectedSubRegion'),
          safeGetItem('selectedBranch'),
        ]);

        if (cachedCart) setCartItems(JSON.parse(cachedCart));
        if (cachedMenuData) {
          const parsed = JSON.parse(cachedMenuData);
          setMenuData({
            categories: parsed.categories || [],
            deals: parsed.deals || [],
            branch: parsed.branch || null
          });
        }
        if (savedCustomer) setCustomerInfo(JSON.parse(savedCustomer));
        if (savedUsername) setUsername(savedUsername);

        if (savedSubRegion) setSelectedSubRegion(JSON.parse(savedSubRegion));

        let activeBranch = null;
        if (savedBranch) {
          try {
            activeBranch = JSON.parse(savedBranch);
          } catch (e) {
            console.warn('Failed to parse saved branch', e);
          }
        }
        setSelectedBranch(activeBranch);

        let userCompId = null;
        if (savedCustomer) {
          try {
            userCompId = JSON.parse(savedCustomer).company_id;
          } catch (e) { }
        }

        const compIdToUse = activeBranch?.company_id || userCompId;

        // Each network call is isolated — a failure in one won't abort the others
        // Menu fetch
        if (activeBranch && activeBranch.id && compIdToUse) {
          try {
            await fetchMenu(activeBranch.id, compIdToUse);
          } catch (e) {
            console.warn('Menu fetch failed, app will use cached menu data:', e.message);
          }
        }

        // Trade areas fetch
        if (compIdToUse) {
          try {
            const tradeAreasData = await getTradeAreas(compIdToUse);
            if (tradeAreasData && tradeAreasData.status) {
              setTradeAreas(tradeAreasData.trade_areas);
            }
          } catch (e) {
            console.warn('Trade areas fetch failed, continuing without trade areas:', e.message);
          }
        }

      } catch (e) {
        console.warn('Failed to initialize app data:', e.message);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // useEffect(() => {
  //   console.log('🛒 Cart Updated:', JSON.stringify(cartItems, null, 2));
  // }, [cartItems]);

  const loginUser = async (id, password) => {
    let deviceId = '';
    let deviceDetails = '';
    try {
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId();
      } else if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync();
      } else {
        deviceId = 'unknown_device';
      }
      const deviceBrand = Device.brand || 'Unknown';
      const deviceModel = Device.modelName || 'Unknown';
      deviceDetails = `${deviceBrand} ${deviceModel}`;
    } catch (deviceError) {
      console.warn('Failed to retrieve device details:', deviceError.message || deviceError);
    }

    try {
      const payload = {
        username: id,
        password: password,
        deviceId: deviceId,
        device_id: deviceId,
        deviceDetails: deviceDetails,
        device_details: deviceDetails
      };
      // console.log('Login payload:', payload);
      const response = await axios.post(`${Config.BASE_URL}/app-users/login`, payload);

      if (response.data && response.data.status) {
        const user = response.data.user;
        const userInfo = {
          id: user.id,
          name: user.username,
          username: user.username,
          email: user.email,
          employee_id: user.employee_id,
          company_id: user.company_id,
          access_token: response.data.access_token
        };
        await updateCustomerInfo(userInfo);

        if (user.branches && user.branches.length > 0) {
          const branch = user.branches[0];
          setSelectedBranch(branch);
          await AsyncStorage.setItem('selectedBranch', JSON.stringify(branch));

          // Dynamically fetch combined menu for the branch & company
          try {
            await fetchMenu(branch.id, user.company_id || branch.company_id);
          } catch (menuErr) {
            console.warn('Failed to fetch menu on login:', menuErr.message);
          }
        } else {
          setSelectedBranch(null);
          await AsyncStorage.removeItem('selectedBranch');
          setMenuData({ categories: [], deals: [], branch: null });
          await AsyncStorage.removeItem('menuData');
        }

        // Dynamically fetch trade areas for the user's company
        if (user.company_id) {
          try {
            const tradeAreasData = await getTradeAreas(user.company_id);
            if (tradeAreasData && tradeAreasData.status) {
              setTradeAreas(tradeAreasData.trade_areas);
            }
          } catch (tradeErr) {
            console.warn('Failed to fetch trade areas on login:', tradeErr.message);
          }
        }

        return { success: true };
      }
      return {
        success: false,
        message: response.data && response.data.message ? response.data.message : 'Invalid credentials'
      };
    } catch (error) {
      console.log('Login error:', error.message || error);
      const apiMessage = getErrorMessage(error, 'Login error occurred');
      return { success: false, message: apiMessage };
    }
  };

  /**
   * Slim down a category list for safe AsyncStorage caching.
   * Removes large nested variant trees from products to stay well under
   * Android's ~2MB CursorWindow limit.
   */
  const slimCategories = (categories = []) =>
    categories.map(cat => ({
      ...cat,
      products: (cat.products || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        description: p.description,
        pos_code: p.pos_code,
        ref_code: p.ref_code,
        // Omit variants, addon_groups, etc. — too large for AsyncStorage
      })),
    }));

  const fetchMenu = async (branchId, companyId) => {
    try {
      if (!branchId || !companyId) return;

      // 1. Fetch Deals
      let dealsList = [];
      try {
        const dealsRes = await getDeals(companyId, branchId);
        dealsList = dealsRes?.data?.deals || dealsRes?.deals || [];
      } catch (err) {
        console.error('Error fetching deals:', err);
      }

      // We will skip fetching full deal details here (lazy load on click instead)
      const fullDeals = dealsList;

      // 3. Fetch Categories
      let categoriesList = [];
      try {
        const categoriesRes = await getCategories(companyId, branchId);
        categoriesList = categoriesRes?.data?.categories || categoriesRes?.categories || [];
      } catch (err) {
        console.error('Error fetching categories:', err);
      }

      // 4. Fetch Products for each category and then Product Details for each product
      const fullCategories = await Promise.all(
        categoriesList.map(async (category) => {
          try {
            const productsRes = await getProducts(companyId, branchId, category.id);
            const productsList = productsRes?.data?.products || productsRes?.products || [];

            // We will skip fetching full product details here (lazy load on click instead)
            return {
              ...category,
              products: productsList
            };
          } catch (err) {
            console.error('Error fetching products for category', category.id, err);
            return { ...category, products: [] };
          }
        })
      );


      // We still need the branch object, we can use the currently selected branch or construct a basic one
      // The branch data from menu was mainly used to pass along, so we can preserve the old behavior
      // by retrieving the active branch if available.
      let branch = null;
      try {
        const savedBranch = await AsyncStorage.getItem('selectedBranch');
        if (savedBranch) {
          branch = JSON.parse(savedBranch);
        }
      } catch (e) { }
      if (!branch) {
        branch = { id: branchId, company_id: companyId };
      }

      // Use full data in-memory for the running session
      setMenuData({ categories: fullCategories, deals: fullDeals, branch });

      // Cache only a slimmed payload to avoid CursorWindow overflow on Android
      try {
        const cachePayload = JSON.stringify({
          categories: slimCategories(fullCategories),
          deals: fullDeals.map(d => ({
            id: d.id,
            name: d.name,
            price: d.price,
            image: d.image,
            ref_code: d.ref_code,
            pos_code: d.pos_code,
          })),
          branch,
        });
        // Only persist if under 1.5 MB to be safe
        if (cachePayload.length < 1_500_000) {
          await AsyncStorage.setItem('menuData', cachePayload);
        } else {
          console.warn('menuData cache skipped — payload too large for AsyncStorage:', cachePayload.length, 'bytes');
          await AsyncStorage.removeItem('menuData');
        }
      } catch (e) {
        console.warn('Failed to save menuData cache:', e.message);
      }
    } catch (error) {
      console.error('Error fetching menu for branch:', branchId, error.message);
      throw error; // Re-throw so initApp's try-catch can log it
    }
  };

  const handleSelectSubRegion = async (subRegion) => {
    setLoading(true);
    try {
      setSelectedSubRegion(subRegion);
      await AsyncStorage.setItem('selectedSubRegion', JSON.stringify(subRegion));

      const branchResponse = await resolveBranch(subRegion.id);
      if (branchResponse.status) {
        const branch = branchResponse.data.branch;
        setSelectedBranch(branch);
        await AsyncStorage.setItem('selectedBranch', JSON.stringify(branch));

        // Automatically fetch menu for the FORCED branch ID
        await fetchMenu(branch.id, branch.company_id);
      }
    } catch (error) {
      console.error("Error resolving branch for sub-region:", subRegion.id, error);
    } finally {
      setLoading(false);
    }
  };

  const persistCart = async (items) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart', e);
    }
  };

  const addToCart = (key, price, name, image, pos_code, details, quantity = 1, options = {}) => {
    setCartItems(prev => {
      const existing = prev[key];
      const newQty = existing ? existing.quantity + quantity : quantity;
      const updated = {
        ...prev,
        [key]: { key, price, name, image, pos_code, details, quantity: newQty, options },
      };
      persistCart(updated);
      return updated;
    });
  };

  const updateCartQuantity = (key, qty) => {
    setCartItems(prev => {
      const updated = { ...prev, [key]: { ...prev[key], quantity: qty } };
      persistCart(updated);
      return updated;
    });
  };

  const removeFromCart = (key) => {
    setCartItems(prev => {
      const upd = { ...prev };
      delete upd[key];
      persistCart(upd);
      return upd;
    });
  };

  const clearCart = () => {
    setCartItems({});
    AsyncStorage.removeItem('cartItems');
  };

  const updateUsername = (name) => {
    setUsername(name);
  };

  const updateCustomerInfo = async (info) => {
    setCustomerInfo(info);
    const name = info.name || '';
    setUsername(name);
    try {
      await AsyncStorage.setItem('customerInfo', JSON.stringify(info));
      await AsyncStorage.setItem('username', name);
    } catch (e) {
      console.warn('Failed to save customer info', e);
    }
  };

  const updateOrderDetails = (details) => {
    setOrderDetails(details);
  };

  const clearCustomerInfo = async () => {
    setUsername('');
    setCustomerInfo(null);
    setSelectedBranch(null);
    setMenuData({ categories: [], deals: [], branch: null });
    try {
      await AsyncStorage.removeItem('customerInfo');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('selectedBranch');
      await AsyncStorage.removeItem('menuData');
    } catch (e) {
      console.warn('Failed to clear user data', e);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        menuData,
        loading,
        tradeAreas,
        selectedSubRegion,
        selectedBranch,
        handleSelectSubRegion,
        fetchMenu,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        username,
        customerInfo,
        orderDetails,
        loginStub: loginUser,
        updateUsername,
        updateCustomerInfo,
        updateOrderDetails,
        clearCustomerInfo,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
