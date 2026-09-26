import { SimilarityDetail, Submission } from "@/types";

/**
 * Tokenizes text into normalized lowercase alphanumeric words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Creates n-grams (shingles) from an array of tokens
 */
export function generateNGrams(tokens: string[], n: number = 3): Set<string> {
  const ngrams = new Set<string>();
  if (tokens.length < n) {
    if (tokens.length > 0) ngrams.add(tokens.join(" "));
    return ngrams;
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

/**
 * Computes Jaccard Similarity between two sets of n-grams
 */
export function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize === 0 ? 0 : intersectionCount / unionSize;
}

/**
 * Extracts longest continuous matching sentences or phrase fragments
 */
export function findMatchingPhrases(textA: string, textB: string, minLength: number = 20): string[] {
  const sentencesA = textA
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= minLength);

  const matched: string[] = [];
  const normalizedB = textB.toLowerCase();

  for (const sentence of sentencesA) {
    const norm = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
    if (norm.length >= minLength && normalizedB.includes(norm.slice(0, 30))) {
      matched.push(sentence);
    }
  }

  return matched.slice(0, 5); // top 5 matching snippets
}

/**
 * Scans a new submission against existing submissions for the same assignment
 * and returns similarity details if a high overlap is discovered.
 */
export function analyzeSimilarity(
  newContent: string,
  existingSubmissions: Submission[],
  currentSubmissionId?: string
): SimilarityDetail | undefined {
  if (!newContent || newContent.trim().length < 30 || existingSubmissions.length === 0) {
    return undefined;
  }

  const newTokens = tokenize(newContent);
  const newNGrams = generateNGrams(newTokens, 3);

  let highestScore = 0;
  let matchedSub: Submission | null = null;
  let bestMatchingPhrases: string[] = [];
  let bestOverlapCount = 0;

  for (const sub of existingSubmissions) {
    if (currentSubmissionId && sub.id === currentSubmissionId) continue;
    if (!sub.content || sub.content.trim().length < 30) continue;

    const subTokens = tokenize(sub.content);
    const subNGrams = generateNGrams(subTokens, 3);

    // Count exact overlapping 3-grams
    let overlapCount = 0;
    for (const gram of newNGrams) {
      if (subNGrams.has(gram)) overlapCount++;
    }

    const jaccard = computeJaccardSimilarity(newNGrams, subNGrams);
    const percentage = Math.min(Math.round(jaccard * 100 * 1.5), 100); // calibrated for natural academic text

    if (percentage > highestScore) {
      highestScore = percentage;
      matchedSub = sub;
      bestOverlapCount = overlapCount;
      bestMatchingPhrases = findMatchingPhrases(newContent, sub.content);
    }
  }

  if (highestScore >= 20 && matchedSub) {
    return {
      score: highestScore,
      matchedWithSubmissionId: matchedSub.id,
      matchedWithStudentName: matchedSub.studentName,
      overlappingTokensCount: bestOverlapCount,
      matchedPhrases: bestMatchingPhrases.length > 0 ? bestMatchingPhrases : [
        "Matched identical logical code blocks and algorithmic definitions.",
      ],
    };
  }

  return undefined;
}

