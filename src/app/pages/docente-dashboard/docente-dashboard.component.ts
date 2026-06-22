import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorService } from '../../services/tutor.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-dashboard.component.html'
})
export class DocenteDashboardComponent {
  // Active view tab inside dashboard
  activeTab = signal<string>('docente-tutoring');
  


  // Docente states
  docenteAppointments = signal<any[]>([]);
  selectedDocenteCita = signal<any>(null);
  docenteAvailabilityText = signal<string>('Lunes 10:00 a.m. - 12:00 p.m. (Cubículo B-302), Miércoles 3:00 p.m. - 5:00 p.m. (Cubículo B-302)');
  docenteAvailabilitySaved = signal<boolean>(false);

  // Tutoring sessions signals
  docenteSessions = signal<any[]>([]);
  cancelReason = signal<string>('');
  cancelFile = signal<File | null>(null);
  cancelFileName = signal<string>('');
  selectedSessionForCancellation = signal<any>(null);
  cancelError = signal<string>('');
  cancelSuccess = signal<string>('');

  // Session confirm/complete/report signals
  confirmSuccess = signal<string>('');
  confirmError = signal<string>('');
  completeSuccess = signal<string>('');
  completeError = signal<string>('');
  showReportModal = signal<any>(null);
  reportTipo = signal<string>('');
  reportDescripcion = signal<string>('');
  reportSuccess = signal<string>('');
  reportError = signal<string>('');

  // Profile modification fields
  profileNewPassword = signal<string>('');
  profileConfirmPassword = signal<string>('');
  showProfileNewPassword = signal<boolean>(false);
  showProfileConfirmPassword = signal<boolean>(false);
  profilePhotoBase64 = signal<string>('');
  profileSuccess = signal<string>('');
  profileError = signal<string>('');

  constructor(
    public tutorService: TutorService,
    public authService: AuthService,
    private router: Router
  ) {
    // Load docente data once session is loaded
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.rol === 'Docente') {
        this.loadDocenteData(user.profile_id);
        this.tutorService.getWeekInfo().subscribe();
      }
    }, { allowSignalWrites: true });

  }

  onLogout() {
    this.authService.logout();
    this.profileNewPassword.set('');
    this.profileConfirmPassword.set('');
    this.profilePhotoBase64.set('');
    this.profileSuccess.set('');
    this.profileError.set('');
  }



  // --- DOCENTE ACTIONS ---
  loadDocenteData(idDocente: number) {
    this.loadDocenteSessions(idDocente);
  }

  loadDocenteSessions(idDocente: number) {
    this.tutorService.getDocenteTutoringSessions(idDocente).subscribe(res => {
      this.docenteSessions.set(res);
    });
  }

  onCancelFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.cancelFile.set(file);
      this.cancelFileName.set(file.name);
    }
  }

  openCancellationModal(session: any) {
    this.selectedSessionForCancellation.set(session);
    this.cancelReason.set('');
    this.cancelFile.set(null);
    this.cancelFileName.set('');
    this.cancelError.set('');
    this.cancelSuccess.set('');
  }

  submitCancellationRequest(e: Event) {
    e.preventDefault();
    const session = this.selectedSessionForCancellation();
    if (!session) return;
    const reason = this.cancelReason().trim();
    const file = this.cancelFile();
    if (!reason || !file) {
      this.cancelError.set('Debe ingresar una justificación y subir un archivo de evidencia.');
      return;
    }
    const formData = new FormData();
    formData.append('motivo_cancelacion_docente', reason);
    formData.append('file', file);
    
    this.tutorService.requestCancellationDocente(session.id_solicitud, formData).subscribe({
      next: (res) => {
        this.cancelSuccess.set('Solicitud de cancelación enviada a OTPS con éxito.');
        const user = this.authService.currentUser();
        if (user) {
          this.loadDocenteSessions(user.profile_id);
        }
        setTimeout(() => {
          this.selectedSessionForCancellation.set(null);
        }, 1500);
      },
      error: (err) => {
        this.cancelError.set(err.error?.error || 'Error al enviar la solicitud de cancelación.');
      }
    });
  }

  confirmSession(idSolicitud: number) {
    this.confirmSuccess.set('');
    this.confirmError.set('');
    this.tutorService.confirmTutoringSession(idSolicitud).subscribe({
      next: (res) => {
        this.confirmSuccess.set(res.message);
        const user = this.authService.currentUser();
        if (user) this.loadDocenteSessions(user.profile_id);
        setTimeout(() => this.confirmSuccess.set(''), 3000);
      },
      error: (err) => this.confirmError.set(err.error?.error || 'Error al confirmar la tutoría.')
    });
  }

  completeSession(idSolicitud: number) {
    this.completeSuccess.set('');
    this.completeError.set('');
    this.tutorService.completeTutoringSession(idSolicitud).subscribe({
      next: (res) => {
        this.completeSuccess.set(res.message);
        const user = this.authService.currentUser();
        if (user) this.loadDocenteSessions(user.profile_id);
        setTimeout(() => this.completeSuccess.set(''), 3000);
      },
      error: (err) => this.completeError.set(err.error?.error || 'Error al completar la tutoría.')
    });
  }

  openReportModal(session: any) {
    this.showReportModal.set(session);
    this.reportTipo.set('');
    this.reportDescripcion.set('');
    this.reportSuccess.set('');
    this.reportError.set('');
  }

  submitReport() {
    const session = this.showReportModal();
    if (!session || !this.reportTipo()) return;
    this.reportSuccess.set('');
    this.reportError.set('');
    this.tutorService.reportTutoringIncident(
      session.id_solicitud,
      'docente',
      this.reportTipo(),
      this.reportDescripcion()
    ).subscribe({
      next: (res) => {
        this.reportSuccess.set('Reporte enviado con éxito.');
        setTimeout(() => this.showReportModal.set(null), 2000);
      },
      error: (err) => this.reportError.set(err.error?.error || 'Error al enviar el reporte.')
    });
  }

  saveAvailability() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.docenteAvailabilitySaved.set(false);

    // Mock parse slots
    const defaultSlots = [
      { dia: 'Lunes', hora: '10:00 a.m. - 12:00 p.m.', cubiculo: 'Pabellón B - Cubículo 302', id_curso: 'INF02' },
      { dia: 'Miércoles', hora: '3:00 p.m. - 5:00 p.m.', cubiculo: 'Pabellón B - Cubículo 302', id_curso: 'INF02' }
    ];

    this.tutorService.updateAvailability(user.profile_id, defaultSlots).subscribe(() => {
      this.docenteAvailabilitySaved.set(true);
    });
  }

  changeAppointmentStatus(idCita: number, status: string) {
    const user = this.authService.currentUser();
    if (!user) return;
    this.tutorService.updateAppointmentStatus(idCita, status).subscribe(() => {
      this.loadDocenteData(user.profile_id);
      this.selectedDocenteCita.set(null);
    });
  }

  // --- PROFILE UPDATE HANDLERS ---
  onProfilePhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePhotoBase64.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onUpdateProfile(e: Event) {
    e.preventDefault();
    this.profileError.set('');
    this.profileSuccess.set('');

    const payload: any = {};
    if (this.profilePhotoBase64()) {
      payload.foto_perfil = this.profilePhotoBase64();
    }

    if (this.profileNewPassword()) {
      if (this.profileNewPassword() !== this.profileConfirmPassword()) {
        this.profileError.set('Las contraseñas no coinciden.');
        return;
      }
      payload.new_password = this.profileNewPassword();
    }

    if (Object.keys(payload).length === 0) {
      this.profileError.set('No se han modificado campos.');
      return;
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.profileSuccess.set('¡Perfil actualizado con éxito!');
        this.profileNewPassword.set('');
        this.profileConfirmPassword.set('');
        this.profilePhotoBase64.set('');
        const curUser = this.authService.currentUser();
        if (curUser) {
          if (payload.foto_perfil) {
            curUser.foto_perfil = payload.foto_perfil;
          }
          this.authService.currentUser.set({ ...curUser });
        }
      },
      error: (err) => {
        this.profileError.set(err.error?.error || 'Error al actualizar el perfil.');
      }
    });
  }
}
