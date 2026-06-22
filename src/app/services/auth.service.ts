import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiBaseUrl = 'http://localhost:5000/api/auth';
  
  // Signal for session state
  currentUser = signal<any>(null);
  restoringSession = signal<boolean>(!!localStorage.getItem('jwt_token'));

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(emailOrUsername: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/login`, {
      email_or_username: emailOrUsername,
      password: password
    }).pipe(
      tap(res => {
        localStorage.setItem('jwt_token', res.access_token);
        this.currentUser.set(res.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.currentUser.set(null);
    this.restoringSession.set(false);
    this.router.navigate(['/login']);
  }

  restoreSession(): void {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // Decode user info locally or load profile from server
      this.http.get<any>(`${this.apiBaseUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: (res) => {
          this.currentUser.set({
            id_usuario: res.id_usuario,
            username: res.username,
            email: res.email,
            rol: res.rol,
            profile_id: res.rol === 'Estudiante' ? res.alumno?.id_alumno : res.docente?.id_docente,
            nombre: res.rol === 'Estudiante' ? res.alumno?.nombre : res.docente?.nombre_docente,
            foto_perfil: res.foto_perfil,
            gemini_api_key: res.gemini_api_key,
            sede: res.alumno?.sede,
            facultad: res.rol === 'Estudiante' ? res.alumno?.facultad : res.docente?.facultad,
            escuela: res.rol === 'Estudiante' ? res.alumno?.escuela : res.docente?.escuela_principal,
            ciclo: res.rol === 'Estudiante' ? res.alumno?.ciclo : null,
            tipo_docente: res.docente?.tipo_docente
          });
          this.restoringSession.set(false);
        },
        error: () => {
          this.logout();
          this.restoringSession.set(false);
        }
      });
    } else {
      this.restoringSession.set(false);
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  registerStudent(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/register/student`, payload);
  }


  updateProfile(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/profile/update`, payload);
  }

  requestRecovery(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/recovery/request`, { email });
  }

  verifyRecoveryCode(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/recovery/verify`, { email, code });
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/recovery/reset`, { email, code, new_password: newPassword });
  }
}
