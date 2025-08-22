import { TestBed } from '@angular/core/testing';

import { TokenInjectInterceptor } from './token-inject.interceptor';

describe('TokenInjectInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      TokenInjectInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: TokenInjectInterceptor = TestBed.inject(TokenInjectInterceptor);
    expect(interceptor).toBeTruthy();
  });
});