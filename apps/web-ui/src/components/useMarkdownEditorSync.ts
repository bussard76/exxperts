// Adapted from Omnigent's web/src/shell/useMarkdownEditorSync.ts.
// Source: https://github.com/omnigent-ai/omnigent/tree/da7555532be25cd127a3cdee8bf8bb32071932fb
// Copyright (2026) Databricks, Inc.; Apache-2.0.
// Changes: exxperts uses a TipTap surface and revision-based workspace saves.

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface Options {
	content: string;
	path: string;
	/** True when the file load has settled; path changes wait for real content. */
	isSettled: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
	onMutation?: () => void;
	setContentRef?: RefObject<((content: string) => void) | null>;
}

interface Result {
	editorKey: number;
	isDirty: boolean;
	setDirty: (value: boolean) => void;
	hasExternalUpdate: boolean;
	discardAndApplyExternal: () => void;
	dismissExternalUpdate: () => void;
	markSaved: (content: string) => void;
	reconcileServerContent: (serverContent: string) => boolean;
}

export function useMarkdownEditorSync({
	content,
	path,
	isSettled,
	onDirtyChange,
	onMutation,
	setContentRef,
}: Options): Result {
	const [editorKey, setEditorKey] = useState(0);
	const [isDirty, setIsDirty] = useState(false);
	const [hasExternalUpdate, setHasExternalUpdateState] = useState(false);
	const externalUpdateRef = useRef(false);
	const isDirtyRef = useRef(isDirty);
	isDirtyRef.current = isDirty;
	const pendingContentRef = useRef<string | null>(null);
	const setHasExternalUpdate = useCallback((value: boolean) => {
		if (externalUpdateRef.current !== value) { externalUpdateRef.current = value; onMutation?.(); }
		setHasExternalUpdateState(value);
	}, [onMutation]);
	const setPendingContent = useCallback((value: string | null) => {
		if (pendingContentRef.current !== value) { pendingContentRef.current = value; onMutation?.(); }
	}, [onMutation]);
	const lastSavedRef = useRef<string | null>(null);
	const prevContentRef = useRef(content);
	const prevPathRef = useRef(path);
	const pendingRemountRef = useRef(false);

	const setDirty = useCallback((value: boolean) => {
		isDirtyRef.current = value;
		setIsDirty(value);
		onDirtyChange?.(value);
	}, [onDirtyChange]);

	useEffect(() => {
		if (prevPathRef.current === path) return;
		prevPathRef.current = path;
		prevContentRef.current = content;
		setPendingContent(null);
		lastSavedRef.current = null;
		setHasExternalUpdate(false);
		setDirty(false);
		pendingRemountRef.current = true;
	}, [path, content, setDirty, setHasExternalUpdate, setPendingContent]);

	useEffect(() => {
		if (!isSettled || !pendingRemountRef.current) return;
		pendingRemountRef.current = false;
		prevContentRef.current = content;
		setEditorKey((key) => key + 1);
	}, [isSettled, path, content]);

	useEffect(() => {
		if (prevContentRef.current === content) return;
		if (content === lastSavedRef.current) {
			prevContentRef.current = content;
			return;
		}
		prevContentRef.current = content;
		if (pendingRemountRef.current) return;
		if (isDirtyRef.current) {
			setPendingContent(content);
			setHasExternalUpdate(true);
			return;
		}
		if (setContentRef?.current) setContentRef.current(content);
		else setEditorKey((key) => key + 1);
	}, [content, setContentRef, setHasExternalUpdate, setPendingContent]);

	useEffect(() => {
		if (isDirty || pendingContentRef.current === null) return;
		const pending = pendingContentRef.current;
		setPendingContent(null);
		setHasExternalUpdate(false);
		if (setContentRef?.current) setContentRef.current(pending);
		else setEditorKey((key) => key + 1);
	}, [isDirty, setContentRef, setHasExternalUpdate, setPendingContent]);

	const discardAndApplyExternal = useCallback(() => {
		const pending = pendingContentRef.current;
		setPendingContent(null);
		setHasExternalUpdate(false);
		setDirty(false);
		if (setContentRef?.current && pending !== null) setContentRef.current(pending);
		else setEditorKey((key) => key + 1);
	}, [setDirty, setContentRef, setHasExternalUpdate, setPendingContent]);

	const dismissExternalUpdate = useCallback(() => {
		setPendingContent(null);
		setHasExternalUpdate(false);
	}, [setHasExternalUpdate, setPendingContent]);

	const markSaved = useCallback((saved: string) => {
		if (lastSavedRef.current !== saved) { lastSavedRef.current = saved; onMutation?.(); }
	}, [onMutation]);

	const reconcileServerContent = useCallback((serverContent: string): boolean => {
		if (serverContent === prevContentRef.current || serverContent === lastSavedRef.current) return false;
		prevContentRef.current = serverContent;
		if (isDirtyRef.current) {
			setPendingContent(serverContent);
			setHasExternalUpdate(true);
			return true;
		}
		if (setContentRef?.current) setContentRef.current(serverContent);
		else setEditorKey((key) => key + 1);
		return false;
	}, [setContentRef, setHasExternalUpdate, setPendingContent]);

	return {
		editorKey,
		isDirty,
		setDirty,
		hasExternalUpdate,
		discardAndApplyExternal,
		dismissExternalUpdate,
		markSaved,
		reconcileServerContent,
	};
}
