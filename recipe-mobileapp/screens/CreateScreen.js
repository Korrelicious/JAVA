import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/colors';
import { apiRequest } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function CreateScreen({ navigation, route }) {
  const { token } = useAuth();
  const existing = route.params?.recipe;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? null);
  const [ingredients, setIngredients] = useState(
    existing?.ingredients?.length
      ? existing.ingredients.map((i) => ({ name: i.name, amount: i.amount ?? '' }))
      : [{ name: '', amount: '' }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiRequest('/categories');
        setCategories(data || []);
      } catch (e) {
        setError(e.message);
      }
    }
    loadCategories();
  }, []);

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', amount: '' }]);
  }

  function removeIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !instructions.trim()) {
      setError('Titel och instruktioner måste fyllas i');
      return;
    }
    setError('');
    setLoading(true);
    try {
           await apiRequest(existing ? `/recipes/${existing.id}` : '/recipes', {
        method: existing ? 'PUT' : 'POST',
        token,
        body: {
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim(),
          imageUrl: imageUrl.trim() || null,
          categoryId,
          ingredients: ingredients
            .filter((i) => i.name.trim())
            .map((i) => ({ name: i.name.trim(), amount: i.amount.trim() })),
        },
      });
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.label}>Titel</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Receptets namn"
          accessibilityLabel="Titel"
        />

        <Text style={styles.label}>Beskrivning</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Kort beskrivning"
          accessibilityLabel="Beskrivning"
        />

        <Text style={styles.label}>Bild-URL</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Bild-URL"
        />

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.chips}>
          {categories.map((c) => {
            const selected = categoryId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setCategoryId(selected ? null : c.id)}
                accessibilityRole="button"
                accessibilityLabel={c.name}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Ingredienser</Text>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={ingredient.amount}
              onChangeText={(v) => updateIngredient(index, 'amount', v)}
              placeholder="Mängd"
              accessibilityLabel={`Mängd för ingrediens ${index + 1}`}
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={ingredient.name}
              onChangeText={(v) => updateIngredient(index, 'name', v)}
              placeholder="Ingrediens"
              accessibilityLabel={`Namn på ingrediens ${index + 1}`}
            />
            {ingredients.length > 1 ? (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeIngredient(index)}
                accessibilityRole="button"
                accessibilityLabel={`Ta bort ingrediens ${index + 1}`}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={addIngredient}
          accessibilityRole="button"
          accessibilityLabel="Lägg till ingrediens"
        >
          <Text style={styles.addText}>+ Lägg till ingrediens</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Instruktioner</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Beskriv hur receptet görs"
          multiline
          textAlignVertical="top"
          accessibilityLabel="Instruktioner"
        />

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Spara recept"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {existing ? 'Spara ändringar' : 'Spara recept'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 600,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    minHeight: 48,
  },
  multiline: {
    minHeight: 120,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.white,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  nameInput: {
    flex: 2,
  },
  removeButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 18,
    color: '#C92A2A',
  },
  addButton: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 16,
  },
  addText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#C92A2A',
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});