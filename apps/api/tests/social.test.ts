import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import request from 'supertest';
import {app} from '../src/app';
import {db} from '../src/db';
import {hashPassword,signToken} from '../src/auth';

const suffix=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
let alice:any,bob:any,outsider:any,anime:any,aliceToken:string,bobToken:string;

beforeAll(async()=>{
  const passwordHash=await hashPassword('password123');
  [alice,bob,outsider]=await Promise.all([
    db.user.create({data:{email:`alice-${suffix}@test.local`,username:`alice-${suffix}`,passwordHash}}),
    db.user.create({data:{email:`bob-${suffix}@test.local`,username:`bob-${suffix}`,passwordHash}}),
    db.user.create({data:{email:`outsider-${suffix}@test.local`,username:`outsider-${suffix}`,passwordHash}}),
  ]);
  anime=await db.anime.create({data:{anilistId:900000+Math.floor(Math.random()*9999),titleRomaji:'Test Anime',titleEnglish:'Test Anime',genres:['Action','Drama']}});
  aliceToken=signToken(alice.id);bobToken=signToken(bob.id);
});
afterAll(async()=>{await db.user.deleteMany({where:{id:{in:[alice.id,bob.id,outsider.id]}}});await db.anime.delete({where:{id:anime.id}});await db.$disconnect()});

describe('follow system',()=>{
  it('follows, rejects duplicates and rejects self follow',async()=>{
    const unauthenticated=await request(app).post(`/api/users/${bob.username}/follow`);expect(unauthenticated.status).toBe(401);
    const first=await request(app).post(`/api/users/${bob.username}/follow`).set('authorization',`Bearer ${aliceToken}`);expect(first.status).toBe(201);
    const duplicate=await request(app).post(`/api/users/${bob.username}/follow`).set('authorization',`Bearer ${aliceToken}`);expect(duplicate.status).toBe(409);
    const self=await request(app).post(`/api/users/${alice.username}/follow`).set('authorization',`Bearer ${aliceToken}`);expect(self.status).toBe(400);
    const profile=await request(app).get(`/api/users/${bob.username}`).set('authorization',`Bearer ${aliceToken}`);expect(profile.body.followerCount).toBe(1);expect(profile.body.isFollowing).toBe(true);
    const removed=await request(app).delete(`/api/users/${bob.username}/follow`).set('authorization',`Bearer ${aliceToken}`);expect(removed.status).toBe(204);
  });
});

describe('feed and stats',()=>{
  it('returns only followed users activity and paginates',async()=>{
    await db.follow.create({data:{followerId:alice.id,followingId:bob.id}});
    await db.activity.create({data:{userId:bob.id,type:'followed_user',targetId:outsider.id,metadata:{username:outsider.username}}});
    await db.activity.create({data:{userId:outsider.id,type:'followed_user',targetId:bob.id,metadata:{username:bob.username}}});
    const feed=await request(app).get('/api/feed?page=1&limit=1').set('authorization',`Bearer ${aliceToken}`);expect(feed.status).toBe(200);expect(feed.body.items).toHaveLength(1);expect(feed.body.items[0].actor.username).toBe(bob.username);expect(feed.body.pagination.total).toBe(1);
  });
  it('calculates status, rating, review and genre stats',async()=>{
    await db.portfolioEntry.create({data:{userId:alice.id,animeId:anime.id,status:'completed',personalRating:8}});
    await db.review.create({data:{userId:alice.id,animeId:anime.id,rating:9,body:'Great',containsSpoilers:true}});
    const stats=await request(app).get(`/api/users/${alice.username}/stats`);expect(stats.body.totalAnimeTracked).toBe(1);expect(stats.body.statusBreakdown.completed).toBe(1);expect(stats.body.averageRatingGiven).toBe(9);expect(stats.body.totalReviewsWritten).toBe(1);expect(stats.body.genreBreakdown).toEqual(expect.arrayContaining([{genre:'Action',count:1},{genre:'Drama',count:1}]));
  });
});

describe('spoiler reviews',()=>{
  it('round trips the spoiler flag through create and anime detail',async()=>{
    const response=await request(app).post(`/api/anime/${anime.id}/review`).set('authorization',`Bearer ${bobToken}`).send({rating:7,body:'Spoilers ahead',containsSpoilers:true});expect(response.status).toBe(201);expect(response.body.review.containsSpoilers).toBe(true);
    const patched=await request(app).patch(`/api/reviews/${response.body.review.id}`).set('authorization',`Bearer ${bobToken}`).send({rating:7,body:'Edited spoilers',containsSpoilers:false});expect(patched.status).toBe(200);const profile=await request(app).get(`/api/users/${bob.username}`);expect(profile.status).toBe(200);expect(profile.body.user.reviews.some((review:any)=>review.containsSpoilers===false)).toBe(true);
  });
});
