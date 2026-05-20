import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTradeAreas,
  resolveBranch,
  getCombinedMenu,
  getBanners
} from '../services/APIservice';
import Config from '../constants/Config';

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
  const [banners, setBanners] = useState([]);

  // Load saved data and initial trade areas on startup
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const [
          cachedCart,
          cachedMenuData,
          cachedBanners,
          savedCustomer,
          savedUsername,
          savedSubRegion,
          savedBranch
        ] = await Promise.all([
          AsyncStorage.getItem('cartItems'),
          AsyncStorage.getItem('menuData'),
          AsyncStorage.getItem('banners'),
          AsyncStorage.getItem('customerInfo'),
          AsyncStorage.getItem('username'),
          AsyncStorage.getItem('selectedSubRegion'),
          AsyncStorage.getItem('selectedBranch'),
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
        if (cachedBanners) setBanners(JSON.parse(cachedBanners));
        if (savedCustomer) setCustomerInfo(JSON.parse(savedCustomer));
        if (savedUsername) setUsername(savedUsername);

        if (savedSubRegion) setSelectedSubRegion(JSON.parse(savedSubRegion));

        // --- Configured Branch for Initial Load ---
        const hardcodedBranch = {
          id: Config.DEFAULT_BRANCH_ID,
          name: Config.DEFAULT_BRANCH_NAME,
          company_id: Config.COMPANY_ID
        };
        setSelectedBranch(hardcodedBranch);
        await fetchMenu(hardcodedBranch.id);

        // Fetch trade areas
        const tradeAreasData = await getTradeAreas(Config.COMPANY_ID);
        if (tradeAreasData.status) {
          setTradeAreas(tradeAreasData.trade_areas);
        }

        // Fetch banners
        try {
          const bannersData = await getBanners();
          if (bannersData) {
            setBanners(bannersData);
            await AsyncStorage.setItem('banners', JSON.stringify(bannersData));
          }
        } catch (e) {
          console.log('Banners service currently unavailable, using cached/empty state');
        }

      } catch (e) {
        console.warn('Failed to initialize app data', e);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // useEffect(() => {
  //   console.log('🛒 Cart Updated:', JSON.stringify(cartItems, null, 2));
  // }, [cartItems]);

  const loginStub = (id, password) => {
    if (id === Config.ADMIN_USERNAME && password === Config.ADMIN_PASSWORD) {
      const userInfo = { id: 1, name: 'Admin User', email: 'admin@krc.com' };
      updateCustomerInfo(userInfo);
      return true;
    }
    return false;
  };

  const fetchMenu = async (branchId = Config.DEFAULT_BRANCH_ID) => {
    try {
      const menuResponse = await getCombinedMenu(Config.COMPANY_ID, Config.DEFAULT_BRANCH_ID);
      if (menuResponse.status) {
        setMenuData({
          categories: menuResponse.menu.categories,
          deals: menuResponse.menu.deals || [],
          branch: menuResponse.menu.branch,
        });
        await AsyncStorage.setItem('menuData', JSON.stringify({
          categories: menuResponse.menu.categories,
          deals: menuResponse.menu.deals || [],
          branch: menuResponse.menu.branch,
        }));
      }
    } catch (error) {
      console.error("Error fetching menu for branch:", branchId, error);
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
        await fetchMenu(Config.DEFAULT_BRANCH_ID);
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
    try {
      await AsyncStorage.removeItem('customerInfo');
      await AsyncStorage.removeItem('username');
    } catch (e) {
      console.warn('Failed to clear user data', e);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        menuData,
        banners,
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
        loginStub,
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
