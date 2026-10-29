import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { apiRequest } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function DetailsScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const [item, setItem] = useState(route.params.item);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function refresh() {
        try {
          const data = await apiRequest(`/recipes/${route.params.item.id}`, { token });
          setItem(data);
        } catch (e) {
          // Behåller det som redan visas
        }
        try {
          const favorites = await apiRequest('/favorites', { token });
          setIsFavorite(
            (favorites || []).some((f) => f.id === route.params.item.id)
          );
        } catch (e) {
          // Behåller nuvarande favoritstatus
        }
      }
      refresh();
    }, [route.params.item.id, token])
  );

  const isOwner = user && user.id === item.ownerId;

  async function toggleFavorite() {
    setError('');
    setFavLoading(true);
    try {
      await apiRequest(`/favorites/${item.id}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        token,
      });
      setIsFavorite(!isFavorite);
    } catch (e) {
      setError(e.message);
    } finally {
      setFavLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Ta bort recept', `Vill du ta bort "${item.title}"?`, [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: handleDelete },
    ]);
  }

    async function handleShare() {
    const ingredientLines = (item.ingredients || [])
      .map((i) => `• ${i.amount ? `${i.amount} ` : ''}${i.name}`)
      .join('\n');

    const message =
      `${item.title}\n\n` +
      (item.description ? `${item.description}\n\n` : '') +
      `Ingredienser:\n${ingredientLines || 'Inga ingredienser angivna.'}\n\n` +
      `Instruktioner:\n${item.instructions}`;

    try {
      await Share.share({ title: item.title, message });
    } catch (e) {
      setError('Kunde inte dela receptet.');
    }
  }

  async function handleDelete() {
    setError('');
    setDeleting(true);
    try {
      await apiRequest(`/recipes/${item.id}`, { method: 'DELETE', token });
      navigation.goBack();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            accessibilityLabel={`Bild på ${item.title}`}
          />
        ) : null}

        <Text style={styles.title} accessibilityRole="header">
          {item.title}
        </Text>

        {item.categoryName ? (
          <Text style={styles.meta}>Kategori: {item.categoryName}</Text>
        ) : null}
        <Text style={styles.meta}>Av {item.ownerName}</Text>

        <TouchableOpacity
          style={[
            styles.favButton,
            isFavorite && styles.favButtonActive,
            favLoading && styles.disabled,
          ]}
          onPress={toggleFavorite}
          disabled={favLoading}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'
          }
          accessibilityState={{ selected: isFavorite, disabled: favLoading }}
        >
          {favLoading ? (
            <ActivityIndicator color={isFavorite ? colors.white : colors.primary} />
          ) : (
            <Text style={[styles.favText, isFavorite && styles.favTextActive]}>
              {isFavorite ? '★ Favorit' : '☆ Lägg till som favorit'}
            </Text>
          )}
        </TouchableOpacity>

                <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Dela recept"
          accessibilityHint="Öppnar delningsmenyn"
        >
          <Text style={styles.shareText}>Dela recept</Text>
        </TouchableOpacity>

        {item.description ? <Text style={styles.text}>{item.description}</Text> : null}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Ingredienser
        </Text>
        {item.ingredients && item.ingredients.length > 0 ? (
          item.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.text}>
              • {ingredient.amount ? `${ingredient.amount} ` : ''}
              {ingredient.name}
            </Text>
          ))
        ) : (
          <Text style={styles.text}>Inga ingredienser angivna.</Text>
        )}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Instruktioner
        </Text>
        <Text style={styles.text}>{item.instructions}</Text>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {isOwner ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('Create', { recipe: item })}
              accessibilityRole="button"
              accessibilityLabel="Redigera recept"
            >
              <Text style={styles.editText}>Redigera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.disabled]}
              onPress={confirmDelete}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Ta bort recept"
              accessibilityState={{ disabled: deleting }}
            >
              {deleting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.deleteText}>Ta bort</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: 600 },
  image: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  meta: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  favButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    marginVertical: 12,
  },
  favButtonActive: { backgroundColor: colors.primary },
  favText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  favTextActive: { color: colors.white },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  text: { fontSize: 16, lineHeight: 24, color: colors.text, marginBottom: 4 },
  error: { color: '#C92A2A', fontSize: 14, marginTop: 12 },
  actions: { marginTop: 24 },
  editButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 12,
  },
  editText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#C92A2A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  deleteText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
    shareButton: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 12,
  },
  shareText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});