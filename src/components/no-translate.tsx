import { createElement, type ReactNode } from 'react';
import { Platform } from 'react-native';

export function NoTranslate({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return createElement('span', { translate: 'no', className: 'notranslate' }, children);
  }
  return <>{children}</>;
}
