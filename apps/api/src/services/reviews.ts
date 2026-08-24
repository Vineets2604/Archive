import { db } from '../db';

export async function withLikeData<T extends { id: string }>(reviews: T[], userId?: string) {
  if (!reviews.length) return reviews.map(review => ({ ...review, likeCount: 0, likedByMe: false }));
  const ids = reviews.map(review => review.id);
  const counts = await db.reviewLike.groupBy({
    by: ['reviewId'], where: { reviewId: { in: ids } }, _count: { _all: true },
  });
  const liked = userId ? await db.reviewLike.findMany({
    where: { reviewId: { in: ids }, userId }, select: { reviewId: true },
  }) : [];
  const countMap = new Map(counts.map(row => [row.reviewId, row._count._all]));
  const likedSet = new Set(liked.map(row => row.reviewId));
  return reviews.map(review => ({ ...review, likeCount: countMap.get(review.id) ?? 0, likedByMe: likedSet.has(review.id) }));
}
