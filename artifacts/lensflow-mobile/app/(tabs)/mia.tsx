import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createMorganConversation, streamMorganMessage } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME =
  "G'day! I'm Morgan from LensFlow AI 👋\n\nI'm your market intelligence partner, property finder, and pipeline expert — all in one. What do you need?";

const SUGGESTIONS = [
  "🏠 Find a property for my client",
  "Find mortgagee properties in Brisbane under $900k",
  "How does the pipeline work?",
  "Which presenter should I use?",
];

export default function MorganScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [initError, setInitError] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);
  const abortRef = useRef<AbortController | null>(null);

  const initConversation = useCallback(() => {
    setInitError(false);
    createMorganConversation()
      .then((id) => {
        setConversationId(id);
        setMessages([{ id: "welcome", role: "assistant", content: WELCOME }]);
      })
      .catch(() => setInitError(true));
  }, []);

  useEffect(() => {
    initConversation();
    return () => abortRef.current?.abort();
  }, [initConversation]);

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || streaming || !conversationId) return;

      setInput("");
      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamMorganMessage(
          conversationId,
          text,
          (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m,
              ),
            );
          },
          controller.signal,
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.content === ""
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [input, streaming, conversationId],
  );

  const showSuggestions = messages.length === 1 && !streaming;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="message-circle" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.headerName, { color: colors.foreground }]}>Morgan</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            LensFlow AI · Always here to help
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        {initError ? (
          <View style={styles.center}>
            <Text style={{ color: colors.mutedForeground, marginBottom: 10 }}>
              Couldn’t connect to Morgan.
            </Text>
            <Pressable onPress={initConversation}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : conversationId === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <Bubble message={item} colors={colors} />
            )}
          />
        )}

        {showSuggestions && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                style={[styles.chip, { borderColor: colors.primary + "55" }]}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              paddingBottom: insets.bottom + 10,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.inputBar,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask Morgan anything…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              editable={!streaming}
              onSubmitEditing={() => send()}
            />
            <Pressable
              onPress={() => send()}
              disabled={!input.trim() || streaming}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !input.trim() || streaming ? 0.4 : 1,
                },
              ]}
            >
              {streaming ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({
  message,
  colors,
}: {
  message: Message;
  colors: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      {!isUser && (
        <View style={[styles.bubbleAvatar, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="message-circle" size={13} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderTopRightRadius: 4 }
            : {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderTopLeftRadius: 4,
              },
        ]}
      >
        {message.content === "" ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  bubbleAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12.5 },
  composer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    maxHeight: 110,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
