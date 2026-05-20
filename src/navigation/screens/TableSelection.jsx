// src/navigation/screens/TableSelection.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StoreContext } from '../../context/StoreContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { getTables, removeTable } from '../../services/APIservice';
import Config from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function TableSelection() {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { selectedBranch, updateOrderDetails } = useContext(StoreContext);
  
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTablesData = async () => {
      try {
        const branchId = selectedBranch?.id || Config.DEFAULT_BRANCH_ID;
        const response = await getTables(branchId);
        
        if (response && response.available_tables) {
          setTables(response.available_tables);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch tables. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTablesData();
  }, [selectedBranch]);

  const handleTableSelect = async (table) => {
    try {
      const branchId = selectedBranch?.id || Config.DEFAULT_BRANCH_ID;
      // Extract digits only from table if it's like "Table 5"
      const tableNumber = typeof table === 'string' 
        ? table.replace(/^\D+/g, '') 
        : table.toString();
      
      await removeTable(branchId, tableNumber);

      updateOrderDetails({
        orderType: 'Dine In',
        table_id: table, // e.g., "Table 5"
        tableName: table
      });
      
      Toast.show({
        type: 'success',
        text1: 'Table Selected',
        text2: `You selected ${table}`,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs', params: { screen: 'Updates' } }],
      });
    } catch (error) {
      console.error('Error removing table on selection:', error);
      Toast.show({
        type: 'error',
        text1: 'Selection Failed',
        text2: 'Could not reserve the table. Please try again.',
      });
    }
  };

  const styles = getStyles(theme);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Table</Text>

      {tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tables available for this branch.</Text>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tableCard}
              onPress={() => handleTableSelect(item)}
            >
              <Text style={styles.tableName}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <Toast />
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tableCard: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  }
});
