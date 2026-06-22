import { Component, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // Login fields
  loginEmail = signal<string>('');
  loginPassword = signal<string>('');
  loginError = signal<string>('');
  showLoginPassword = signal<boolean>(false);

  // Auth view mode (login, signup, recovery)
  authMode = signal<string>('login');

  sedesList = [
    {
      codigo: 'SL01',
      nombre: 'Sede SL01',
      direccion: 'Av. Nicolás de Piérola 347 / 351, Cercado de Lima',
      facultades: [
        {
          nombre: 'Facultad de Derecho y Ciencia Política',
          escuelas: ['Escuela Profesional de Ciencias Politicas', 'Escuela Profesional de Derecho']
        },
        {
          nombre: 'Facultad de Ciencias Sociales',
          escuelas: ['Escuela Profesional de Ciencias de la Comunicacion', 'Escuela Profesional de Sociologia', 'Escuela Profesional de Trabajo Social']
        },
        {
          nombre: 'Facultad de Educación',
          escuelas: ['Escuela Profesional de Educación Inicial', 'Escuela Profesional de Educación Primaria', 'Escuela Profesional de Educación Secundaria', 'Escuela Profesional de Educación Fisica']
        },
        {
          nombre: 'Facultad de Humanidades',
          escuelas: ['Escuela Profesional de Antropología y Arqueología', 'Escuela Profesional de Filosofía', 'Escuela Profesional de Historia', 'Escuela Profesional de Lingüística y Literatura']
        }
      ]
    },
    {
      codigo: 'SL02',
      nombre: 'Sede SL02',
      direccion: 'Av. Nicolás de Piérola 262, Cercado de Lima',
      facultades: [
        {
          nombre: 'Facultad de Ciencias Económicas',
          escuelas: ['Escuela Profesional de Economia']
        },
        {
          nombre: 'Facultad de Ciencias Financieras y Contables',
          escuelas: ['Escuela Profesional de Contabilidad']
        }
      ]
    },
    {
      codigo: 'SL04',
      nombre: 'Sede SL04',
      direccion: 'Pasaje Páez 140, Jesús María',
      facultades: [
        {
          nombre: 'Facultad de Arquitectura y Urbanismo',
          escuelas: ['Escuela Profesional de Arquitectura']
        }
      ]
    },
    {
      codigo: 'SL05',
      nombre: 'Sede SL05',
      direccion: 'Calle Roma 350 / Calle Francia 726, Miraflores',
      facultades: [
        {
          nombre: 'Facultad de Oceanografía, Pesquería, Ciencias Alimentarias y Acuicultura',
          escuelas: ['Escuela Profesional de Ingeniería Alimentaria', 'Escuela Profesional de Ingeniería en Acuicultura', 'Escuela Profesional de Ingeniería Pesquera']
        }
      ]
    },
    {
      codigo: 'SL06',
      nombre: 'Sede SL06',
      direccion: 'Jr. Diego de Agüero (ex Yungay) 206, Magdalena del Mar',
      facultades: [
        {
          nombre: 'Facultad de Ingeniería Civil',
          escuelas: ['Escuela Profesional de Ingeniería Civil']
        }
      ]
    },
    {
      codigo: 'SL07',
      nombre: 'Sede SL07',
      direccion: 'Av. Óscar R. Benavides (ex Colonial) 450, Cercado de Lima',
      facultades: [
        {
          nombre: 'Facultad de Ingeniería Industrial y de Sistemas (FIIS)',
          escuelas: ['Escuela Profesional de Ingeniería de Sistemas', 'Escuela Profesional de Ingeniería Industrial', 'Escuela Profesional de Ingeniería de Transportes', 'Escuela Profesional de Ingeniería Agroindustria']
        },
        {
          nombre: 'Facultad de Administración',
          escuelas: ['Escuela Profesional de Administración de Empresas', 'Escuela Profesional de Administración de Turismo', 'Escuela Profesional de Administración Publica', 'Escuela Profesional de Marketing', 'Escuela Profesional de Negocios Internacionales']
        },
        {
          nombre: 'Facultad de Psicología',
          escuelas: ['Escuela Profesional de Psicología']
        },
        {
          nombre: 'Facultad de Ingeniería Geográfica, Ambiental y Ecoturismo',
          escuelas: ['Escuela Profesional de Ingeniería Geografica', 'Escuela Profesional de Ingeniería Ambiental', 'Escuela Profesional de Ingeniería en Ecoturismo']
        }
      ]
    },
    {
      codigo: 'SL08',
      nombre: 'Sede SL08',
      direccion: 'Jr. Iquique 127, Breña',
      facultades: [
        {
          nombre: 'Facultad de Ingeniería Electronica e Informatica',
          escuelas: ['Escuela Profesional de Ingeniería Electrónica', 'Escuela Profesional de Ingeniería Informática', 'Escuela Profesional de Ingeniería Mecatrónica', 'Escuela Profesional de Ingeniería de Telecomunicaciones']
        }
      ]
    },
    {
      codigo: 'SL09',
      nombre: 'Sede SL09',
      direccion: 'Calle San Marcos 351, Pueblo Libre',
      facultades: [
        {
          nombre: 'Facultad de Odontologia',
          escuelas: ['Escuela Profesional de Odontología']
        }
      ]
    },
    {
      codigo: 'SL10',
      nombre: 'Sede SL10',
      direccion: 'Jr. Río Chepén 290, El Agustino',
      facultades: [
        {
          nombre: 'Facultad de Ciencias y Naturales y Matemáticas',
          escuelas: ['Escuela Profesional de Biologia', 'Escuela Profesional de Fisica', 'Escuela Profesional de Matematica', 'Escuela Profesional de Quimica', 'Escuela Profesional de Estadistica']
        },
        {
          nombre: 'Facultad de Medicina "Hipólito Unanue"',
          escuelas: ['Escuela Profesional de Medicina', 'Escuela Profesional de Enfermeria', 'Escuela Profesional de Nutricion', 'Escuela Profesional de Obstetricia']
        },
        {
          nombre: 'Facultad de Tecnología Medica',
          escuelas: ['Escuela Profesional de Terapias de Rehabilitación', 'Escuela Profesional de Radioimagen', 'Escuela Profesional de Laboratorio y Anatomía Patologica']
        }
      ]
    },
    {
      codigo: 'F01L01',
      nombre: 'Sede F01L01',
      direccion: 'Av. Néstor Gambetta 10, Callao',
      facultades: [
        {
          nombre: 'Facultad Ciencias Financieras y Contables, Sede Oquendo',
          escuelas: ['Escuela Profesional de Contabilidad']
        },
        {
          nombre: 'Facultad Ciencias Economicas, Sede Oquendo',
          escuelas: ['Escuela Profesional de Economia']
        }
      ]
    }
  ];

  // Signup fields
  signupRole = signal<string>('Estudiante');
  signupNombres = signal<string>('');
  signupApellidos = signal<string>('');
  signupEmail = signal<string>('');
  signupIdAlumno = signal<string>('');
  signupPassword = signal<string>('');
  showSignupPassword = signal<boolean>(false);
  signupSede = signal<string>('');
  signupFacultad = signal<string>('');
  signupEscuela = signal<string>('');
  signupError = signal<string>('');
  signupSuccess = signal<string>('');

  signupFacultades = computed(() => {
    const s = this.signupSede();
    if (!s) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    return sede ? sede.facultades : [];
  });

  signupEscuelas = computed(() => {
    const s = this.signupSede();
    const f = this.signupFacultad();
    if (!s || !f) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    if (!sede) return [];
    const fac = sede.facultades.find(x => x.nombre === f);
    return fac ? fac.escuelas : [];
  });

  // Password Recovery fields
  recoveryStep = signal<number>(1);
  recoveryEmail = signal<string>('');
  recoveryCode = signal<string>('');
  recoveryNewPassword = signal<string>('');
  recoveryConfirmNewPassword = signal<string>('');
  showRecoveryNewPassword = signal<boolean>(false);
  showRecoveryConfirmPassword = signal<boolean>(false);
  recoveryError = signal<string>('');
  recoverySuccess = signal<string>('');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        if (user.rol === 'Estudiante') {
          this.router.navigate(['/student/dashboard']);
        } else if (user.rol === 'Docente') {
          this.router.navigate(['/docente/dashboard']);
        } else if (user.rol === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        }
      }
    });
  }

  onLogin(e: Event) {
    e.preventDefault();
    this.loginError.set('');
    
    this.authService.login(this.loginEmail(), this.loginPassword()).subscribe({
      next: (res) => {
        this.loginEmail.set('');
        this.loginPassword.set('');
      },
      error: (err) => {
        this.loginError.set(err.error?.error || 'Error al conectar con el servidor.');
      }
    });
  }

  onSignup(e: Event) {
    e.preventDefault();
    this.signupError.set('');
    this.signupSuccess.set('');

    const payload = {
      nombres: this.signupNombres(),
      apellidos: this.signupApellidos(),
      email: this.signupEmail(),
      id_alumno: this.signupIdAlumno(),
      password: this.signupPassword(),
      sede_codigo: this.signupSede(),
      facultad: this.signupFacultad(),
      escuela: this.signupEscuela()
    };
    this.authService.registerStudent(payload).subscribe({
      next: (res) => {
        this.signupSuccess.set('¡Estudiante registrado con éxito! Inicia sesión para continuar.');
        this.clearSignupForm();
      },
      error: (err) => {
        this.signupError.set(err.error?.error || 'Error en el registro del estudiante.');
      }
    });
  }

  clearSignupForm() {
    this.signupNombres.set('');
    this.signupApellidos.set('');
    this.signupEmail.set('');
    this.signupIdAlumno.set('');
    this.signupPassword.set('');
    this.signupSede.set('');
    this.signupFacultad.set('');
    this.signupEscuela.set('');
  }

  onSignupSedeChange(event: any) {
    const s = event.target.value;
    this.signupSede.set(s);
    this.signupFacultad.set('');
    this.signupEscuela.set('');
  }

  onSignupFacultadChange(event: any) {
    const f = event.target.value;
    this.signupFacultad.set(f);
    this.signupEscuela.set('');
  }

  onRecoveryRequest(e: Event) {
    e.preventDefault();
    this.recoveryError.set('');
    this.recoverySuccess.set('');

    this.authService.requestRecovery(this.recoveryEmail()).subscribe({
      next: (res) => {
        this.recoverySuccess.set('Código enviado. Por favor, revise su correo o consulte la consola.');
        this.recoveryStep.set(2);
      },
      error: (err) => {
        this.recoveryError.set(err.error?.error || 'Error al solicitar el código de recuperación.');
      }
    });
  }

  onRecoveryVerify(e: Event) {
    e.preventDefault();
    this.recoveryError.set('');
    this.recoverySuccess.set('');

    this.authService.verifyRecoveryCode(this.recoveryEmail(), this.recoveryCode()).subscribe({
      next: (res) => {
        this.recoverySuccess.set('Código validado con éxito. Ingrese su nueva contraseña.');
        this.recoveryStep.set(3);
      },
      error: (err) => {
        this.recoveryError.set(err.error?.error || 'Código incorrecto o vencido.');
      }
    });
  }

  onRecoveryReset(e: Event) {
    e.preventDefault();
    this.recoveryError.set('');
    this.recoverySuccess.set('');

    if (this.recoveryNewPassword() !== this.recoveryConfirmNewPassword()) {
      this.recoveryError.set('Las contraseñas ingresadas no coinciden.');
      return;
    }

    this.authService.resetPassword(this.recoveryEmail(), this.recoveryCode(), this.recoveryNewPassword()).subscribe({
      next: (res) => {
        this.recoverySuccess.set('¡Contraseña restablecida con éxito! Ya puede iniciar sesión.');
        this.recoveryStep.set(4);
      },
      error: (err) => {
        this.recoveryError.set(err.error?.error || 'Error al restablecer la contraseña.');
      }
    });
  }
}
