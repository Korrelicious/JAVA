import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ItemCard from '../components/ItemCard';
import { colors } from '../constants/colors';
import { apiRequest } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function ListScreen({ navigation }) {
  const FILTER_KEY = 'recipe_filters';
  const { token, logout } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const firstLoad = useRef(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Favorites')}
            accessibilityRole="button"
            accessibilityLabel="Favoriter"
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Favoriter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Create')}
            accessibilityRole="button"
            accessibilityLabel="Nytt recept"
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Nytt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Logga ut"
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logga ut</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, logout]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

    useEffect(() => {
    async function loadFilters() {
      try {
        const stored = await AsyncStorage.getItem(FILTER_KEY);
        if (stored) {
          const saved = JSON.parse(stored);
          setSearch(saved.search || '');
          setDebouncedSearch(saved.search || '');
          setCategoryId(saved.categoryId || null);
        }
      } catch (e) {
        // Inga sparade filter kunde läsas
      } finally {
        setFiltersLoaded(true);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;
    AsyncStorage.setItem(
      FILTER_KEY,
      JSON.stringify({ search: debouncedSearch, categoryId })
    ).catch(() => {});
  }, [debouncedSearch, categoryId, filtersLoaded]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiRequest('/categories');
        setCategories(data || []);
      } catch (e) {
        // Kategorifilter visas inte om det misslyckas
      }
    }
    loadCategories();
  }, []);

  const loadRecipes = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (firstLoad.current) {
        setLoading(true);
      }
      setError('');
      try {
        const params = [];
        if (debouncedSearch) {
          params.push(`search=${encodeURIComponent(debouncedSearch)}`);
        }
        if (categoryId) {
          params.push(`categoryId=${categoryId}`);
        }
        const query = params.length ? `?${params.join('&')}` : '';
        const data = await apiRequest(`/recipes${query}`, { token });
        setRecipes(data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        firstLoad.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, debouncedSearch, categoryId]
  );

   useFocusEffect(
    useCallback(() => {
      if (filtersLoaded) {
        loadRecipes();
      }
    }, [loadRecipes, filtersLoaded])
  );

  const hasFilter = debouncedSearch || categoryId;

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setCategoryId(null);
  }

  const header = (
    <View>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Sök recept"
        returnKeyType="search"
        accessibilityLabel="Sök recept"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}
      >
        {categories.map((c) => {
          const selected = categoryId === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCategoryId(selected ? null : c.id)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrera på ${c.name}`}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Laddar recept"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={error ? [] : recipes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecipes(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadRecipes()}
                accessibilityRole="button"
                accessibilityLabel="Försök igen"
              >
                <Text style={styles.retryText}>Försök igen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {hasFilter ? 'Inga recept matchade din sökning.' : 'Inga recept hittades.'}
              </Text>
              {hasFilter ? (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={clearFilters}
                  accessibilityRole="button"
                  accessibilityLabel="Rensa sökning och filter"
                >
                  <Text style={styles.retryText}>Rensa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('Details', { item })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    minHeight: 48,
  },
  chips: {
    paddingBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14 },
  chipTextSelected: { color: colors.white },
  emptyBox: { alignItems: 'center', marginTop: 32 },
  errorText: {
    fontSize: 16,
    color: '#C92A2A',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 12,
  },
  retryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  headerButtons: { flexDirection: 'row' },
  logoutButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});