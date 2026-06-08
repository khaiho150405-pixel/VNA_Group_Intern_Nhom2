import { useState } from 'react';
// @ts-ignore
import vi from '@core/locales/vi.json';

const dictionaries: any = { vi };

export default function useLocales() {
  const [currentLang] = useState<'vi'>('vi'); // Có thể mở rộng thêm 'en'

  const translate = (key: string): string => {
    const keys = key.split('.');
    let result: any = dictionaries[currentLang];

    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key;
      }
    }
    return result as string;
  };

  return { translate, currentLang };
}