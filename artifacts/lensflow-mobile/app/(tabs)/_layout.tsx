import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tab = (
    name: string,
    title: string,
    sf: string,
    feather: keyof typeof Feather.glyphMap,
  ) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarIcon: ({ color }) =>
          isIOS ? (
            <SymbolView name={sf as any} tintColor={color} size={24} />
          ) : (
            <Feather name={feather} size={22} color={color} />
          ),
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ),
      }}
    >
      {tab("index", "Home", "house", "home")}
      {tab("create", "Create", "plus.circle", "plus-circle")}
      {tab("mia", "Mia", "message", "message-circle")}
      {tab("profile", "Profile", "person", "user")}
    </Tabs>
  );
}
