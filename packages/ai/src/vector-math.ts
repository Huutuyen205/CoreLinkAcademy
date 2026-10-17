/**
 * Tính tích vô hướng của 2 vector
 */
export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Tính chuẩn Euclidean (L2 Norm) của vector
 */
export function vectorNorm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Tính độ tương đồng Cosine giữa 2 vector [-1, 1]
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const dot = dotProduct(a, b);
  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

/**
 * Tìm top K đoạn kiến thức có độ tương đồng cao nhất
 */
export function findTopKChunks<T extends { id: string; embedding?: any }>(
  queryEmbedding: number[],
  chunks: T[],
  topK = 5,
  minSimilarity = 0.5
): Array<{ chunk: T; similarity: number }> {
  const scored = chunks
    .map((chunk) => {
      let emb = chunk.embedding;
      if (typeof emb === 'string') {
        try {
          emb = JSON.parse(emb);
        } catch {
          emb = null;
        }
      }
      if (!Array.isArray(emb)) return { chunk, similarity: 0 };
      const similarity = cosineSimilarity(queryEmbedding, emb);
      return { chunk, similarity };
    })
    .filter((item) => item.similarity >= minSimilarity);

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}

/**
 * Sinh vector nhúng giả lập nhất quán theo chuỗi văn bản (dùng cho offline/testing)
 */
export function generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/[\s,.;:!?\(\)\[\]"'/+-]+/).filter((w) => w.length > 0);
  const vector: number[] = new Array(dimensions).fill(0);

  for (const word of words) {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 31 + word.charCodeAt(j)) >>> 0;
    }
    vector[hash % dimensions] += 1.0;

    // Subwords 3-grams
    if (word.length >= 3) {
      for (let k = 0; k <= word.length - 3; k++) {
        const sub = word.slice(k, k + 3);
        let subHash = 0;
        for (let s = 0; s < sub.length; s++) {
          subHash = (subHash * 37 + sub.charCodeAt(s)) >>> 0;
        }
        vector[subHash % dimensions] += 0.5;
      }
    }
  }

  // Chuẩn hóa vector đơn vị L2
  const norm = vectorNorm(vector);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  }
  return vector;
}
