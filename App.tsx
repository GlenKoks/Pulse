import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { NewsDataProvider } from './src/hooks/NewsDataContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { NewsListScreen } from './src/screens/NewsListScreen';
import { Colors } from './src/utils/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    News: '📰',
  };
  return (
    <View style={[tabStyles.iconContainer, focused && tabStyles.iconFocused]}>
      <Text style={tabStyles.icon}>{icons[name] || '●'}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {
    backgroundColor: Colors.primary + '33',
  },
  icon: {
    fontSize: 18,
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NewsDataProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={Colors.background} />
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: Colors.surface,
                  borderTopColor: Colors.border,
                  borderTopWidth: 1,
                  paddingBottom: Platform.OS === 'ios' ? 0 : 8,
                  paddingTop: 8,
                  height: Platform.OS === 'ios' ? 80 : 60,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {
                  fontSize: 11,
                  fontWeight: '600',
                  marginTop: 2,
                },
              }}
            >
              <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                  tabBarLabel: 'Аналитика',
                  tabBarIcon: ({ focused }) => <TabIcon name="Dashboard" focused={focused} />,
                }}
              />
              <Tab.Screen
                name="News"
                component={NewsListScreen}
                options={{
                  tabBarLabel: 'Новости',
                  tabBarIcon: ({ focused }) => <TabIcon name="News" focused={focused} />,
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </NewsDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
