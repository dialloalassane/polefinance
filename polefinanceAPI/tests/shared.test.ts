import { describe,it,expect } from 'vitest';
import { quantile, sampleStd, normInv } from '../src/calculations/shared';

describe('shared primitives',()=>{
 it('uses sample standard deviation',()=>{expect(sampleStd([1,2,3])).toBeCloseTo(1,12)});
 it('uses Hyndman-Fan type 7 quantile',()=>{const x=[-0.040035,-0.029994,-0.020058,-0.020049,-0.01,0.02,0.020026,0.02005,0.040008,0.040016]; expect(quantile(x,.05)).toBeCloseTo(-0.03551655,7)});
 it('inverse normal 95%',()=>{expect(normInv(.95)).toBeCloseTo(1.6448536269,7)});
});
