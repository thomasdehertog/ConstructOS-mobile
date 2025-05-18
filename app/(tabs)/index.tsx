import { Text, View } from "react-native";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api"; // Adjusted path for being inside (tabs)

export default function HomeScreen() { // Renamed from Index to HomeScreen for clarity
  const tasks = useQuery(api.tasks.get);

  if (!tasks) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {tasks.map(({ _id, text }) => (
        <Text key={_id}>{text}</Text>
      ))}
    </View>
  );
}
