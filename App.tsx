import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NewsDataProvider } from './src/hooks/NewsDataContext';
import { ThemeProvider } from './src/hooks/ThemeContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EntityScreen } from './src/screens/EntityScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NewsDataProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Entity" component={EntityScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </NewsDataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
