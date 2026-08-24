import {db} from '../db';
export async function getUserStats(userId:string) {
  const [portfolio,reviews] = await Promise.all([
    db.portfolioEntry.findMany({where:{userId},include:{anime:{select:{genres:true}}}}),
    db.review.findMany({where:{userId},select:{rating:true}}),
  ]);
  const statusBreakdown = {watching:0,completed:0,dropped:0,plan_to_watch:0};
  const genres = new Map<string,number>();
  for (const entry of portfolio) { statusBreakdown[entry.status] += 1; for (const genre of entry.anime.genres) genres.set(genre,(genres.get(genre)||0)+1); }
  const genreBreakdown = [...genres.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5).map(([genre,count])=>({genre,count}));
  return {totalAnimeTracked:portfolio.length,statusBreakdown,averageRatingGiven:reviews.length?Number((reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length).toFixed(2)):null,totalReviewsWritten:reviews.length,genreBreakdown};
}
