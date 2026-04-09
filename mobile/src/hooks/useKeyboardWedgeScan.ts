import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { TextInput } from "react-native";
import {
  AppState,
  InteractionManager,
  Platform,
  type TextInputProps,
} from "react-native";

const WEDGE_KEYBOARD: TextInputProps["keyboardType"] =
  Platform.OS === "android" ? "visible-password" : "default";

/** Delay before clearing the wedge line after Enter (next tag ready). */
const CLEAR_DELAY_MS = 50;

/** Debounce blur refocus so rapid blur/focus cycles do not fight other controls. */
const REFOCUS_DEBOUNCE_MS = 48;

/** Initial focus delay when wedge becomes active (after tab transition). */
const INITIAL_FOCUS_DELAY_MS = 100;

export type KeyboardWedgeOptions = {
  /**
   * When `current === true`, refocus is skipped (e.g. while a native picker
   * or other overlay needs focus). Optional.
   */
  pauseRefocusRef?: MutableRefObject<boolean>;
};

const BARCODE_8 = /^\d{8}$/;

function dedupeOrderedSeed(barcodes: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of barcodes) {
    const t = b.trim();
    if (!BARCODE_8.test(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * HID keyboard-wedge capture for Android RFID guns: rapid 8-digit barcode + Enter.
 * Batches count updates with requestAnimationFrame to reduce re-renders under burst scans.
 *
 * Refocus is narrowed: only when the wedge is enabled, app is active, and pause is off.
 * Uses InteractionManager + debouncing to avoid fighting navigation and layout.
 */
export function useKeyboardWedgeScan(
  enabled: boolean,
  options?: KeyboardWedgeOptions,
) {
  const pauseRefocusRef = options?.pauseRefocusRef;

  const inputRef = useRef<TextInput>(null);
  const lineRef = useRef("");
  const [line, setLine] = useState("");
  const scannedRef = useRef<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  const enabledRef = useRef(enabled);
  const refocusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const prevAppStateRef = useRef(AppState.currentState);

  const [count, setCount] = useState(0);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled && refocusTimeoutRef.current != null) {
      clearTimeout(refocusTimeoutRef.current);
      refocusTimeoutRef.current = null;
    }
  }, [enabled]);

  const canRefocus = useCallback(() => {
    if (!enabledRef.current) return false;
    if (appStateRef.current !== "active") return false;
    if (pauseRefocusRef?.current) return false;
    return true;
  }, [pauseRefocusRef]);

  const focusInputSafely = useCallback(() => {
    if (!canRefocus()) return;
    InteractionManager.runAfterInteractions(() => {
      if (!canRefocus()) return;
      inputRef.current?.focus();
    });
  }, [canRefocus]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = prevAppStateRef.current;
      prevAppStateRef.current = next;
      appStateRef.current = next;
      if (next === "active" && prev !== "active" && enabledRef.current) {
        focusInputSafely();
      }
    });
    return () => sub.remove();
  }, [focusInputSafely]);

  const scheduleRefocusFromBlur = useCallback(() => {
    if (!enabledRef.current) return;
    if (refocusTimeoutRef.current != null) {
      clearTimeout(refocusTimeoutRef.current);
    }
    refocusTimeoutRef.current = setTimeout(() => {
      refocusTimeoutRef.current = null;
      focusInputSafely();
    }, REFOCUS_DEBOUNCE_MS);
  }, [focusInputSafely]);

  const scheduleCountUpdate = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setCount(seenRef.current.size);
    });
  }, []);

  const commitTag = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) {
        lineRef.current = "";
        setLine("");
        return;
      }
      if (!BARCODE_8.test(code)) {
        lineRef.current = "";
        setLine("");
        return;
      }
      if (!seenRef.current.has(code)) {
        seenRef.current.add(code);
        scannedRef.current.push(code);
        scheduleCountUpdate();
      }
      lineRef.current = "";
      setLine("");
      setTimeout(() => {
        lineRef.current = "";
        setLine("");
      }, CLEAR_DELAY_MS);
    },
    [scheduleCountUpdate],
  );

  const onChangeText = useCallback((t: string) => {
    lineRef.current = t;
    setLine(t);
  }, []);

  const onSubmitEditing = useCallback(() => {
    commitTag(lineRef.current);
  }, [commitTag]);

  const onBlur = useCallback(() => {
    if (!enabledRef.current) return;
    scheduleRefocusFromBlur();
  }, [scheduleRefocusFromBlur]);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      if (!enabledRef.current) return;
      focusInputSafely();
    }, INITIAL_FOCUS_DELAY_MS);
    return () => clearTimeout(t);
  }, [enabled, focusInputSafely]);

  useEffect(() => {
    return () => {
      if (refocusTimeoutRef.current != null) {
        clearTimeout(refocusTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback((seed?: readonly string[]) => {
    if (seed && seed.length > 0) {
      const ordered = dedupeOrderedSeed(seed);
      scannedRef.current = [...ordered];
      seenRef.current = new Set(ordered);
      setCount(ordered.length);
    } else {
      scannedRef.current = [];
      seenRef.current = new Set();
      setCount(0);
    }
    lineRef.current = "";
    setLine("");
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const getScanned = useCallback(() => [...scannedRef.current], []);

  return {
    inputRef,
    line,
    count,
    reset,
    getScanned,
    wedgeInputProps: {
      value: line,
      onChangeText,
      onSubmitEditing,
      onBlur,
      showSoftInputOnFocus: false,
      blurOnSubmit: false,
      autoFocus: enabled,
      autoCapitalize: "none" as const,
      autoCorrect: false,
      keyboardType: WEDGE_KEYBOARD,
      returnKeyType: "done" as const,
      editable: enabled,
    },
  };
}
