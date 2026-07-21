import { Children, cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ConverterFunction } from 'opencc-js';

export type AppLocale = 'zh-CN' | 'zh-TW';

export type LearningLocalizers = {
  display: ConverterFunction;
  normalizeSearch: ConverterFunction;
};

const LOCALE_STORAGE_KEY = 'shanyi-learning-locale';
let traditionalLocalizers: Promise<LearningLocalizers> | null = null;

export function readLearningLocale(): AppLocale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh-CN' || stored === 'zh-TW') return stored;
  } catch {
    // Language selection still works for the current session when storage is blocked.
  }
  return /^(zh-TW|zh-HK|zh-MO)/i.test(window.navigator.language) ? 'zh-TW' : 'zh-CN';
}

export function writeLearningLocale(locale: AppLocale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private browsing can block storage; the React state remains authoritative.
  }
}

export function loadTraditionalLocalizers() {
  if (!traditionalLocalizers) {
    traditionalLocalizers = import('opencc-js').then(({ default: OpenCC }) => {
      const displayConverter = OpenCC.Converter({ from: 'cn', to: 'twp' });
      const searchConverter = OpenCC.Converter({ from: 'twp', to: 'cn' });
      const displayCache = new Map<string, string>();
      const searchCache = new Map<string, string>();
      return {
        display: (text: string) => {
          const cached = displayCache.get(text);
          if (cached !== undefined) return cached;
          const converted = displayConverter(text);
          displayCache.set(text, converted);
          return converted;
        },
        normalizeSearch: (text: string) => {
          const cached = searchCache.get(text);
          if (cached !== undefined) return cached;
          const converted = searchConverter(text);
          searchCache.set(text, converted);
          return converted;
        },
      };
    });
  }
  return traditionalLocalizers;
}

export function localizeReactTree(node: ReactNode, convert: ConverterFunction): ReactNode {
  if (typeof node === 'string') return convert(node);
  if (Array.isArray(node)) return Children.map(node, (child) => localizeReactTree(child, convert));
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  const localizedProps: Record<string, unknown> = {};
  for (const key of ['aria-label', 'placeholder', 'title', 'alt']) {
    if (typeof props[key] === 'string') localizedProps[key] = convert(props[key]);
  }
  if ('children' in props) localizedProps.children = localizeReactTree(props.children as ReactNode, convert);
  return cloneElement(element, localizedProps);
}
