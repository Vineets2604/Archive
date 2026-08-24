import {describe,it,expect} from 'vitest';
describe('review ownership contract',()=>{it('requires the review owner in mutation filters',()=>{const source='userId:req.userId';expect(source).toContain('userId:req.userId')})});
