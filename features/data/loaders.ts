import type { WordData } from '@/lib/srs';

export async function loadHskWords(): Promise<WordData[]> {
  return (await import('@/data/hsk')).hskWords;
}

export async function loadToeicWords(): Promise<Array<WordData & { topicId: string; phonetic?: string }>> {
  return (await import('@/data/toeic')).toeicWords;
}

export async function loadToeicListeningData() {
  return import('@/data/toeic-lc-part2');
}

export async function loadToeicPart5Data() {
  return import('@/data/toeic-part5');
}

export async function loadHskSentenceStudyData() {
  return import('@/data/hsk-sentence-study');
}
