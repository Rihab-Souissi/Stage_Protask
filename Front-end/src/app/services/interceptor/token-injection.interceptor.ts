import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';
//import { TokenService } from '../token/token.service';
import { KeycloakService } from '../keycloak/keycloak.service';

@Injectable()
export class TokenInjectionInterceptor implements HttpInterceptor {

  constructor(
   // private tokenService: TokenService
   private keycloackService : KeycloakService
  ) {}


  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
   
   const token = this.keycloackService.keycloak.token;
    if (token) {
      const authReq = request.clone({
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      });
      return next.handle(authReq);
    }
    return next.handle(request);
  }
}
