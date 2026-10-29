import FavoritesScreen from '../screens/FavoriteScreen';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ListScreen from '../screens/ListScreen';
import DetailsScreen from '../screens/DetailsScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/colors';
import CreateScreen from '../screens/CreateScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel="Laddar"
        />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen
            name="List"
            component={ListScreen}
            options={{ title: 'Recept' }}
          />
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={{ title: 'Recept' }}
          />
          <Stack.Screen
            name="Create"
            component={CreateScreen}
            options={({ route }) => ({
              title: route.params?.recipe ? 'Redigera recept' : 'Nytt recept',
            })}
          />
         <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: 'Favoriter' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Receptappen' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Logga in' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Skapa konto' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}