import { TestBed } from '@angular/core/testing';

import { TokenInjectionInterceptor } from './token-injection.interceptor';

describe('TokenInjectionInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      TokenInjectionInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: TokenInjectionInterceptor = TestBed.inject(TokenInjectionInterceptor);
    expect(interceptor).toBeTruthy();
  });
});