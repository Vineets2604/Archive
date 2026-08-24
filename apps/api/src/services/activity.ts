import {db} from '../db';
import type {Prisma} from '@prisma/client';
import {withLikeData} from './reviews';

export async function createActivity(tx: any, data: {userId:string; type:'review_created'|'portfolio_added'|'followed_user'; targetId:string; metadata: Prisma.InputJsonValue}) {
  return tx.activity.create({data});
}

export async function getActivityPage(userIds:string[], page:number, limit:number, requesterId?: string) {
  const where = {userId:{in:userIds}};
  const [rows,total] = await Promise.all([
    db.activity.findMany({where, orderBy:{createdAt:'desc'}, skip:(page-1)*limit, take:limit, include:{user:{select:{username:true,avatarUrl:true}}}}),
    db.activity.count({where}),
  ]);
  const reviewIds = rows.filter(row=>row.type==='review_created').map(row=>row.targetId);
  const animeIds = rows.filter(row=>row.type==='portfolio_added').map(row=>row.targetId);
  const followedIds = rows.filter(row=>row.type==='followed_user').map(row=>row.targetId);
  const [rawReviews, anime, followedUsers] = await Promise.all([
    reviewIds.length ? db.review.findMany({where:{id:{in:reviewIds}},include:{anime:true}}) : [],
    animeIds.length ? db.anime.findMany({where:{id:{in:animeIds}}}) : [],
    followedIds.length ? db.user.findMany({where:{id:{in:followedIds}},select:{id:true,username:true,avatarUrl:true,bio:true}}) : [],
  ]);
  const reviews = await withLikeData(rawReviews, requesterId);
  const reviewMap = new Map(reviews.map(item=>[item.id,item]));
  const animeMap = new Map(anime.map(item=>[item.id,item]));
  const userMap = new Map(followedUsers.map(item=>[item.id,item]));
  const items = rows.map(row=>({
    id:row.id, type:row.type, createdAt:row.createdAt, actor:row.user, metadata:row.metadata,
    target: row.type==='review_created' ? reviewMap.get(row.targetId) ?? null : row.type==='portfolio_added' ? animeMap.get(row.targetId) ?? null : userMap.get(row.targetId) ?? null,
  }));
  return {items,pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}};
}

export async function getPublicActivity(userId:string, page:number, limit:number) {
  return getActivityPage([userId], page, limit);
}
