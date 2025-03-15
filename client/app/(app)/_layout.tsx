import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';

export default function Layout() {
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#445b73');
    NavigationBar.setButtonStyleAsync('light')
  }, [])

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#445b73", 
          borderTopWidth: 0,
          height: 50, 
        },
        tabBarActiveTintColor: "#fff", 
        tabBarInactiveTintColor: "#a0a0a0",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold", 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Чат",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Меню",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}