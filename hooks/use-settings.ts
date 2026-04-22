import { useSettings as useSettingsContext } from '@/context/SettingsContext';

export function useSettings() {
  return useSettingsContext();
}
