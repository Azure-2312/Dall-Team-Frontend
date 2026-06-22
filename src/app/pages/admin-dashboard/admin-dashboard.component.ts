import { Component, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorService } from '../../services/tutor.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {
  // Active view tab inside dashboard
  activeTab = signal<string>('admin-dashboard');

  // User management state
  adminUserList = signal<any[]>([]);
  userActionMsg = signal<string>('');
  userActionError = signal<string>('');

  // User list filters
  filterCargo = signal<string>('all');
  filterFacultad = signal<string>('all');

  filteredUsers = computed(() => {
    const list = this.adminUserList();
    const cargo = this.filterCargo();
    const fac = this.filterFacultad();

    return list.filter(u => {
      // 1. Cargo/Tipo filter
      if (cargo !== 'all') {
        if (cargo === 'biblioteca') {
          if (u.rol !== 'Admin' || u.cargo !== 'Biblioteca') return false;
        } else if (cargo === 'otps') {
          if (u.rol !== 'Admin' || u.cargo !== 'Tutoría y Psicopedagogía') return false;
        } else if (cargo === 'docente') {
          if (u.rol !== 'Docente') return false;
        } else if (cargo === 'estudiante') {
          if (u.rol !== 'Estudiante') return false;
        }
      }

      // 2. Facultad filter
      if (fac !== 'all') {
        if (!u.facultad) return false;
        const normUserFac = u.facultad.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normFilterFac = fac.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!normUserFac.includes(normFilterFac)) return false;
      }

      return true;
    });
  });

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

  // Admin states
  adminMetrics = signal<any>(null);
  adminAuditLogs = signal<any[]>([]);
  adminActivityLogs = signal<any[]>([]);
  // User edit modal fields
  showEditUserModal = signal<boolean>(false);
  editingUser = signal<any>(null);
  editUsername = signal<string>('');
  editEmail = signal<string>('');
  editRol = signal<string>('');
  editPassword = signal<string>('');
  showEditUserPassword = signal<boolean>(false);
  editUserSuccess = signal<string>('');
  editUserError = signal<string>('');
  adminCourseId = signal<string>('INF02');
  adminSyllabusText = signal<string>('');
  adminIngestSuccess = signal<string>('');
  adminIngestError = signal<string>('');

  // Admin form management
  adminFormMode = signal<string>('none'); // 'none', 'admin', 'docente'

  // Admin access creation fields
  newAdminNombres = signal<string>('');
  newAdminApellidos = signal<string>('');
  newAdminEmail = signal<string>('');
  newAdminPassword = signal<string>('');
  showNewAdminPassword = signal<boolean>(false);
  newAdminSuccess = signal<string>('');
  newAdminError = signal<string>('');

  // Docente access creation fields (by admin)
  newDocenteNombres = signal<string>('');
  newDocenteApellidos = signal<string>('');
  newDocenteEmail = signal<string>('');
  newDocentePassword = signal<string>('');
  showNewDocentePassword = signal<boolean>(false);
  newDocenteSede = signal<string>('');
  newDocenteFacultad = signal<string>('');
  newDocenteEscuela = signal<string>('');
  newDocenteTipo = signal<string>('Permanente');
  newDocenteSuccess = signal<string>('');
  newDocenteError = signal<string>('');

  newDocenteFacultades = computed(() => {
    const s = this.newDocenteSede();
    if (!s) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    return sede ? sede.facultades : [];
  });

  newDocenteEscuelas = computed(() => {
    const s = this.newDocenteSede();
    const f = this.newDocenteFacultad();
    if (!s || !f) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    if (!sede) return [];
    const fac = sede.facultades.find(x => x.nombre === f);
    return fac ? fac.escuelas : [];
  });

  // Admin Gemini Malla Ingest signals
  adminMallaSede = signal<string>('');
  adminMallaFacultad = signal<string>('');
  adminMallaEscuela = signal<string>('');
  adminMallaInputMode = signal<'text' | 'pdf'>('text');
  adminMallaTexto = signal<string>('');
  adminMallaPDFFile = signal<File | null>(null);
  adminMallaPDFFileName = signal<string>('');
  adminMallaSuccess = signal<string>('');
  adminMallaError = signal<string>('');
  adminMallaLoading = signal<boolean>(false);
  adminMallaCourses = signal<any[]>([]);
  adminMallaQueried = signal<boolean>(false);
  adminMallaShowUpdateForm = signal<boolean>(false);

  // Computeds for separating regular and elective courses
  adminRegularCourses = computed(() => this.adminMallaCourses().filter(c => !c.es_electivo));
  adminElectiveCourses = computed(() => this.adminMallaCourses().filter(c => c.es_electivo));
  selectedAdminCourse = signal<any>(null);

  // Manual course creation signals
  newCourseId = signal<string>('');
  newCourseNombre = signal<string>('');
  newCourseCiclo = signal<number>(1);
  newCourseCreditos = signal<number>(3);
  newCoursePrereq = signal<string>('');
  newCourseTipo = signal<string>('General');
  newCourseEsElectivo = signal<boolean>(false);
  newCourseSuccess = signal<string>('');
  newCourseError = signal<string>('');

  // Course editing signals
  isEditing = signal<boolean>(false);
  editCourseNombre = signal<string>('');
  editCourseCiclo = signal<number>(1);
  editCourseCreditos = signal<number>(3);
  editCoursePrereq = signal<string>('');
  editCourseTipo = signal<string>('General'); // maps to tipo_estudio
  editCourseEsElectivo = signal<boolean>(false); // maps to tipo_curso
  editCourseSuccess = signal<string>('');
  editCourseError = signal<string>('');

  startEditingCourse(course: any) {
    this.editCourseNombre.set(course.nombre_curso);
    this.editCourseCiclo.set(course.ciclo_teorico);
    this.editCourseCreditos.set(course.creditos);
    this.editCoursePrereq.set(course.id_prerrequisito || '');
    this.editCourseTipo.set(course.tipo_estudio || course.tipo_curso || 'General');
    this.editCourseEsElectivo.set(course.es_electivo || course.tipo_curso === 'Electivo');
    this.editCourseSuccess.set('');
    this.editCourseError.set('');
    this.isEditing.set(true);
  }

  cancelEditingCourse() {
    this.isEditing.set(false);
  }

  onSaveCourseEdits() {
    const course = this.selectedAdminCourse();
    if (!course) return;
    this.editCourseSuccess.set('');
    this.editCourseError.set('');

    const payload = {
      nombre_curso: this.editCourseNombre(),
      ciclo_teorico: this.editCourseCiclo(),
      creditos: this.editCourseCreditos(),
      id_prerrequisito: this.editCoursePrereq() || null,
      tipo_estudio: this.editCourseTipo(),
      tipo_curso: this.editCourseEsElectivo() ? 'Electivo' : 'Estándar',
      es_electivo: this.editCourseEsElectivo()
    };

    this.tutorService.updateMallaCourse(course.id_curso, payload).subscribe({
      next: (res) => {
        this.editCourseSuccess.set(res.message);
        this.isEditing.set(false);
        // Refresh selected course details
        this.selectedAdminCourse.set(res.course);
        // Refresh mallas list
        const escuela = this.adminMallaEscuela();
        if (escuela) {
          this.onMallaEscuelaSelected(escuela);
        }
      },
      error: (err) => {
        this.editCourseError.set(err.error?.error || 'Error al actualizar asignatura.');
      }
    });
  }

  adminMallaFacultades = computed(() => {
    const s = this.adminMallaSede();
    if (!s) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    return sede ? sede.facultades : [];
  });

  adminMallaEscuelas = computed(() => {
    const s = this.adminMallaSede();
    const f = this.adminMallaFacultad();
    if (!s || !f) return [];
    const sede = this.sedesList.find(x => x.codigo === s);
    if (!sede) return [];
    const fac = sede.facultades.find(x => x.nombre === f);
    return fac ? fac.escuelas : [];
  });

  // Profile modification fields
  profileNewPassword = signal<string>('');
  profileConfirmPassword = signal<string>('');
  showProfileNewPassword = signal<boolean>(false);
  showProfileConfirmPassword = signal<boolean>(false);
  profilePhotoBase64 = signal<string>('');
  profileSuccess = signal<string>('');
  profileError = signal<string>('');

  // Tutoring requests signals
  adminTutoringSubTab = signal<string>('requests');
  adminTutoringRequests = signal<any[]>([]);
  adminTutorList = signal<any[]>([]);
  selectedRequestForApproval = signal<any>(null);
  selectedRequestForRejection = signal<any>(null);
  rejectReason = signal<string>('');
  approveEscuela = signal<string>('');
  approveDocenteId = signal<number | null>(null);
  approveDia = signal<string>('');
  approveHora = signal<string>('');
  approveLink = signal<string>('');
  approveError = signal<string>('');
  approveSuccess = signal<string>('');

  constructor(
    public tutorService: TutorService,
    public authService: AuthService,
    private router: Router
  ) {
    // Load admin data once session is active
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.rol === 'Admin') {
        this.loadAdminData();
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

  // --- ADMINISTRATOR ACTIONS ---
  loadAdminData() {
    this.tutorService.getAdminMetrics().subscribe(res => {
      this.adminMetrics.set(res);
    });
    this.tutorService.getAdminAuditLogs().subscribe(res => {
      this.adminAuditLogs.set(res);
    });
    this.tutorService.listUsers().subscribe(res => {
      this.adminUserList.set(res);
    });
    const user = this.authService.currentUser();
    if (user && user.username === 'admin') {
      this.tutorService.getActivityLogs().subscribe(res => {
        this.adminActivityLogs.set(res);
      });
    }
    this.loadAdminTutoringRequests();
  }

  loadAdminTutoringRequests() {
    this.tutorService.getAdminTutoringRequests().subscribe(res => {
      this.adminTutoringRequests.set(res);
    });
  }

  onToggleStudentSanction(user: any) {
    this.tutorService.toggleStudentSanction(user.id_usuario).subscribe({
      next: (res) => {
        this.userActionMsg.set(res.message);
        this.loadAdminData();
        setTimeout(() => this.userActionMsg.set(''), 3000);
      },
      error: (err) => this.userActionError.set(err.error?.error || 'Error al cambiar sanción.')
    });
  }

  selectRequestForApproval(req: any) {
    this.selectedRequestForApproval.set(req);
    this.approveEscuela.set(req.escuela_alumno || req.escuela || '');
    this.approveDocenteId.set(null);
    this.approveDia.set('Lunes');
    this.approveHora.set('14:00');
    this.approveLink.set('https://teams.microsoft.com/l/meetup-join/...');
    this.approveError.set('');
    this.approveSuccess.set('');
    this.adminTutorList.set([]);
    
    this.tutorService.getTutors(req.id_curso).subscribe({
      next: (tutors) => {
        this.adminTutorList.set(tutors);
        if (tutors.length > 0) {
          this.approveDocenteId.set(tutors[0].id_docente);
        }
      }
    });
  }

  confirmApproval(e: Event) {
    e.preventDefault();
    const req = this.selectedRequestForApproval();
    if (!req) return;
    const docId = this.approveDocenteId();
    if (!docId) {
      this.approveError.set('Debe seleccionar un docente para la tutoría.');
      return;
    }
    const payload = {
      escuela: this.approveEscuela(),
      id_docente: docId,
      dia: this.approveDia(),
      hora: this.approveHora(),
      link_llamada: this.approveLink()
    };
    this.tutorService.approveTutoringRequest(req.id_solicitud, payload).subscribe({
      next: (res) => {
        this.approveSuccess.set(res.message);
        this.loadAdminTutoringRequests();
        setTimeout(() => {
          this.selectedRequestForApproval.set(null);
        }, 1500);
      },
      error: (err) => {
        this.approveError.set(err.error?.error || 'Error al aprobar la tutoría.');
      }
    });
  }

  selectRequestForRejection(req: any) {
    this.selectedRequestForRejection.set(req);
    this.rejectReason.set('');
  }

  confirmRejection(e: Event) {
    e.preventDefault();
    const req = this.selectedRequestForRejection();
    if (!req) return;
    const reason = this.rejectReason().trim();
    if (!reason) return;
    this.tutorService.rejectTutoringRequest(req.id_solicitud, reason).subscribe({
      next: (res) => {
        this.loadAdminTutoringRequests();
        this.selectedRequestForRejection.set(null);
      },
      error: (err) => {
        alert(err.error?.error || 'Error al rechazar la tutoría.');
      }
    });
  }

  onResolveCancellation(req: any, decision: string) {
    this.tutorService.resolveCancellation(req.id_solicitud, decision).subscribe({
      next: (res) => {
        this.loadAdminTutoringRequests();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al procesar cancelación.');
      }
    });
  }

  getDownloadUrl(filePath: string): string {
    if (!filePath) return '';
    const parts = filePath.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    return `http://localhost:5000/api/resources/tutoring-requests/download/${filename}`;
  }

  toggleUserStatus(user: any) {
    this.tutorService.toggleUserStatus(user.id_usuario, !user.activo).subscribe({
      next: (res) => {
        this.userActionMsg.set(res.message);
        this.loadAdminData();
        setTimeout(() => this.userActionMsg.set(''), 3000);
      },
      error: (err) => this.userActionError.set(err.error?.error || 'Error al cambiar estado.')
    });
  }

  deleteUser(user: any) {
    if (!confirm(`¿Eliminar permanentemente la cuenta de "${user.username}"? Esta acción no se puede deshacer.`)) return;
    this.tutorService.deleteUser(user.id_usuario).subscribe({
      next: (res) => {
        this.userActionMsg.set(res.message);
        this.loadAdminData();
        setTimeout(() => this.userActionMsg.set(''), 3000);
      },
      error: (err) => this.userActionError.set(err.error?.error || 'Error al eliminar usuario.')
    });
  }

  openEditUserModal(user: any) {
    this.editingUser.set(user);
    this.editUsername.set(user.username);
    this.editEmail.set(user.email);
    this.editRol.set(user.rol);
    this.editPassword.set('');
    this.editUserSuccess.set('');
    this.editUserError.set('');
    this.showEditUserModal.set(true);
  }

  onUpdateUser(e: Event) {
    e.preventDefault();
    this.editUserSuccess.set('');
    this.editUserError.set('');
    const user = this.editingUser();
    if (!user) return;

    const payload: any = {
      username: this.editUsername(),
      email: this.editEmail(),
      rol: this.editRol()
    };
    if (this.editPassword()) {
      payload.password = this.editPassword();
    }

    this.tutorService.updateUser(user.id_usuario, payload).subscribe({
      next: (res) => {
        this.editUserSuccess.set(res.message);
        this.loadAdminData();
        setTimeout(() => {
          this.showEditUserModal.set(false);
          this.editingUser.set(null);
        }, 1500);
      },
      error: (err) => {
        this.editUserError.set(err.error?.error || 'Error al actualizar usuario.');
      }
    });
  }

  ingestSyllabus() {
    if (!this.adminSyllabusText() || !this.adminCourseId()) return;
    this.adminIngestSuccess.set('');
    this.adminIngestError.set('');

    this.tutorService.ingestSilabo(
      this.adminCourseId(),
      this.adminSyllabusText(),
      'consola_admin_RAG_PDF'
    ).subscribe({
      next: (res) => {
        this.adminIngestSuccess.set(res.message);
        this.adminSyllabusText.set('');
        this.loadAdminData();
      },
      error: (err) => {
        this.adminIngestError.set(err.error?.error || 'Error al cargar sílabo.');
      }
    });
  }

  onCreateAdmin(e: Event) {
    e.preventDefault();
    this.newAdminError.set('');
    this.newAdminSuccess.set('');

    const payload = {
      nombres: this.newAdminNombres(),
      apellidos: this.newAdminApellidos(),
      email: this.newAdminEmail(),
      password: this.newAdminPassword()
    };

    this.tutorService.createAdmin(payload).subscribe({
      next: (res) => {
        this.newAdminSuccess.set(res.message);
        this.newAdminNombres.set('');
        this.newAdminApellidos.set('');
        this.newAdminEmail.set('');
        this.newAdminPassword.set('');
        this.loadAdminData();
      },
      error: (err) => {
        this.newAdminError.set(err.error?.error || 'Error al registrar nuevo administrador.');
      }
    });
  }

  onCreateDocente(e: Event) {
    e.preventDefault();
    this.newDocenteError.set('');
    this.newDocenteSuccess.set('');

    const payload = {
      nombres: this.newDocenteNombres(),
      apellidos: this.newDocenteApellidos(),
      email: this.newDocenteEmail(),
      password: this.newDocentePassword(),
      sede_codigo: this.newDocenteSede(),
      facultad: this.newDocenteFacultad(),
      escuela_principal: this.newDocenteEscuela(),
      tipo_docente: this.newDocenteTipo()
    };

    this.tutorService.createDocente(payload).subscribe({
      next: (res) => {
        this.newDocenteSuccess.set(res.message);
        this.newDocenteNombres.set('');
        this.newDocenteApellidos.set('');
        this.newDocenteEmail.set('');
        this.newDocentePassword.set('');
        this.newDocenteSede.set('');
        this.newDocenteFacultad.set('');
        this.newDocenteEscuela.set('');
        this.loadAdminData();
      },
      error: (err) => {
        this.newDocenteError.set(err.error?.error || 'Error al registrar nuevo docente.');
      }
    });
  }

  onAdminMallaPDFChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.adminMallaPDFFile.set(file);
      this.adminMallaPDFFileName.set(file.name);
    }
  }

  onMallaEscuelaSelected(escuela: string) {
    this.adminMallaEscuela.set(escuela);
    this.adminMallaCourses.set([]);
    this.adminMallaQueried.set(false);
    this.adminMallaShowUpdateForm.set(false);
    this.adminMallaSuccess.set('');
    this.adminMallaError.set('');

    if (escuela) {
      this.tutorService.getMallaByEscuela(escuela).subscribe({
        next: (res) => {
          this.adminMallaCourses.set(res);
          this.adminMallaQueried.set(true);
        },
        error: (err) => {
          this.adminMallaError.set('Error al cargar la malla existente.');
        }
      });
    }
  }

  ingestMallaCurricularIA() {
    const escuela = this.adminMallaEscuela();
    if (!escuela) return;

    this.adminMallaSuccess.set('');
    this.adminMallaError.set('');

    if (this.adminMallaInputMode() === 'text') {
      const texto = this.adminMallaTexto();
      if (!texto) return;
      this.adminMallaLoading.set(true);

      this.tutorService.ingestMallaIA(escuela, texto).subscribe({
        next: (res) => {
          this.adminMallaSuccess.set(res.message);
          this.adminMallaTexto.set('');
          this.adminMallaLoading.set(false);
          this.adminMallaShowUpdateForm.set(false);
          this.loadAdminData();
          this.onMallaEscuelaSelected(escuela);
        },
        error: (err) => {
          this.adminMallaError.set(err.error?.error || 'Error al ingestar malla con IA.');
          this.adminMallaLoading.set(false);
        }
      });
    } else {
      const file = this.adminMallaPDFFile();
      if (!file) return;
      this.adminMallaLoading.set(true);

      this.tutorService.ingestMallaIAPDF(escuela, file).subscribe({
        next: (res) => {
          this.adminMallaSuccess.set(res.message);
          this.adminMallaPDFFile.set(null);
          this.adminMallaPDFFileName.set('');
          this.adminMallaLoading.set(false);
          this.adminMallaShowUpdateForm.set(false);
          this.loadAdminData();
          this.onMallaEscuelaSelected(escuela);
        },
        error: (err) => {
          this.adminMallaError.set(err.error?.error || 'Error al ingestar malla con IA desde el PDF.');
          this.adminMallaLoading.set(false);
        }
      });
    }
  }

  onCreateCourse(e: Event) {
    e.preventDefault();
    this.newCourseSuccess.set('');
    this.newCourseError.set('');

    const escuela = this.adminMallaEscuela();
    if (!escuela) {
      this.newCourseError.set('Debe seleccionar Sede, Facultad y Escuela primero.');
      return;
    }

    const payload = {
      id_curso: this.newCourseId(),
      nombre_curso: this.newCourseNombre(),
      escuela: escuela,
      ciclo_teorico: this.newCourseCiclo(),
      creditos: this.newCourseCreditos(),
      id_prerrequisito: this.newCoursePrereq() || null,
      tipo_estudio: this.newCourseTipo(),
      tipo_curso: this.newCourseEsElectivo() ? 'Electivo' : 'Estándar',
      es_electivo: this.newCourseEsElectivo()
    };

    this.tutorService.addMallaCourse(payload).subscribe({
      next: (res) => {
        this.newCourseSuccess.set(res.message);
        this.newCourseId.set('');
        this.newCourseNombre.set('');
        this.newCourseCiclo.set(1);
        this.newCourseCreditos.set(3);
        this.newCoursePrereq.set('');
        this.newCourseTipo.set('General');
        this.newCourseEsElectivo.set(false);
        this.adminMallaShowUpdateForm.set(false);
        // Reload courses
        this.onMallaEscuelaSelected(escuela);
      },
      error: (err) => {
        this.newCourseError.set(err.error?.error || 'Error al guardar la asignatura.');
      }
    });
  }

  // --- HELPER DROPDOWN CHANGE EVENTS ---
  onDocenteSedeChange(event: any) {
    const s = event.target.value;
    this.newDocenteSede.set(s);
    this.newDocenteFacultad.set('');
    this.newDocenteEscuela.set('');
  }

  onDocenteFacultadChange(event: any) {
    const f = event.target.value;
    this.newDocenteFacultad.set(f);
    this.newDocenteEscuela.set('');
  }

  onAdminMallaSedeChange(event: any) {
    const s = event.target.value;
    this.adminMallaSede.set(s);
    this.adminMallaFacultad.set('');
    this.adminMallaEscuela.set('');
    this.adminMallaCourses.set([]);
    this.adminMallaQueried.set(false);
    this.adminMallaShowUpdateForm.set(false);
  }

  onAdminMallaFacultadChange(event: any) {
    const f = event.target.value;
    this.adminMallaFacultad.set(f);
    this.adminMallaEscuela.set('');
    this.adminMallaCourses.set([]);
    this.adminMallaQueried.set(false);
    this.adminMallaShowUpdateForm.set(false);
  }

  onAdminMallaEscuelaChange(event: any) {
    const e = event.target.value;
    this.onMallaEscuelaSelected(e);
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
