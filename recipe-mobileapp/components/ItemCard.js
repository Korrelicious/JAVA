import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export default function ItemCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint="Öppnar receptet"
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.image} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.categoryName ? (
          <Text style={styles.category}>{item.categoryName}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    minHeight: 48,
    elevation: 2,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: '#E9ECEF',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  category: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
});