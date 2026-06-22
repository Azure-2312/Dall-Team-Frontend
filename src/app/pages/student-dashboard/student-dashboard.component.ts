import { Component, effect, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorService } from '../../services/tutor.service';
import { AuthService } from '../../services/auth.service';

interface BoardImage {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isSelected?: boolean;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent {
  // Active view tab inside dashboard
  activeTab = signal<string>('courses');
  
  // Modal toggle state for adding courses of previous cycles
  showAddCourseModal = signal<boolean>(false);

  // Syllabus banner state
  bannerText = signal<string>('');
  bannerTopic = signal<string>('');
  bannerReadings = signal<string>('');

  // Notebook tab states
  notesText = signal<string>('');
  notesReadings = signal<string>('');
  notesWeek = signal<number>(11);
  notesUploadSuccess = signal<string>('');
  notesUploadError = signal<string>('');
  notesSearchQuery = signal<string>('');
  notesSearchResults = signal<any[]>([]);

  // Workspace Triptych Signals
  weeks = signal<any[]>([]);
  selectedWeek = signal<number>(1);
  notesSaving = signal<boolean>(false);
  notesSaveSuccess = signal<string>('');
  notesSaveError = signal<string>('');

  // Collapsible panels signals
  isLeftPanelRetracted = signal<boolean>(false);
  isRightPanelRetracted = signal<boolean>(false);
  isWhiteboardMaximized = signal<boolean>(false);
  isFloatingChatOpen = signal<boolean>(false);

  // Whiteboard tool configs
  drawingTool = signal<'pencil' | 'highlighter' | 'text' | 'eraser' | 'select'>('pencil');
  brushColor = signal<string>('#002d62'); // UNFV Blue
  brushSize = signal<number>(4);
  fontSize = signal<number>(18);
  uploadedBgUrl = signal<string | null>(null);
  canvasDataSignal = signal<string | null>(null);

  isBgPdf = computed(() => {
    const url = this.uploadedBgUrl();
    return url ? url.toLowerCase().endsWith('.pdf') : false;
  });

  images: BoardImage[] = [];
  imageElementCache: Map<string, HTMLImageElement> = new Map();
  selectedImageIndex = signal<number | null>(null);
  isResizingBg = false;

  // Chat Signals
  chatMessage = signal<string>('');
  chatHistory = signal<any[]>([]);
  chatLoading = signal<boolean>(false);



  // Evaluator tab states
  activeQuiz = signal<any[] | null>(null);
  currentQuestionIndex = signal<number>(0);
  selectedOptionIndex = signal<number | null>(null);
  quizSubmitted = signal<boolean>(false);
  score = signal<number>(0);
  quizLoading = signal<boolean>(false);
  quizError = signal<string>('');
  weaknesses = signal<any[]>([]);

  // Library / Resources states
  kohaSearchQuery = signal<string>('');
  kohaBooks = signal<any[]>([]);
  kohaSearchLoading = signal<boolean>(false);
  kohaSearchError = signal<string>('');
  kohaSearchSede = signal<string>('');
  isKohaSedeDropdownOpen = signal<boolean>(false);
  
  kohaSedes = [
    { code: '', name: 'Todas las bibliotecas' },
    { code: '8245', name: 'Administración' },
    { code: '3220', name: 'Arquitectura y Urbanismo' },
    { code: 'B01', name: 'Biblioteca Central' },
    { code: '1209', name: 'Ciencias Económicas' },
    { code: '1210', name: 'Ciencias Financieras y Contables' },
    { code: '16276', name: 'Ciencias Naturales y Matemática' },
    { code: '10268', name: 'Ciencias Sociales' },
    { code: '10266', name: 'Derecho y Ciencia Política' },
    { code: '10265', name: 'Educación' },
    { code: '12247', name: 'Electrónica e Informática' },
    { code: '2216', name: 'EUPG' },
    { code: '8246', name: 'Geográfica Ambiental y Ecoturismo' },
    { code: '10267', name: 'Humanidades' },
    { code: '8248', name: 'Industrial y Sistemas' },
    { code: '7240', name: 'Ingeniería Civil' },
    { code: '16285', name: 'Medicina "HIPOLITO UNANUE"' },
    { code: '4225', name: 'Oceanografía, Pesquería, Ciencias Alimentarias y Acuicultura' },
    { code: '13275', name: 'Odontología' },
    { code: '8249', name: 'Psicología' },
    { code: '16270', name: 'Tecnología Médica' }
  ];

  tutors = signal<any[]>([]);
  selectedTutor = signal<any>(null);
  selectedSlot = signal<any>(null);
  bookingSuccess = signal<string>('');

  // Wellbeing states
  wellbeingQuery = signal<string>('');
  wellbeingFeedback = signal<any>(null);

  // Solicitudes de Tutoría states
  studentTutoringRequests = signal<any[]>([]);
  studentGroupTutorings = signal<any[]>([]);
  studentUniones = signal<any[]>([]);
  isStudentSancionado = signal<boolean>(false);
  reqCourseId = signal<string>('');
  reqStudentCount = signal<number>(2);
  reqFile = signal<File | null>(null);
  reqFileName = signal<string>('');
  reqAcceptNotice = signal<boolean>(false);
  reqSuccess = signal<string>('');
  reqError = signal<string>('');
  joinAcceptNotice = signal<boolean>(false);
  joinSuccess = signal<string>('');
  joinError = signal<string>('');

  // Tutoring Session complete/report signals for student
  completarStudentSuccess = signal<string>('');
  completarStudentError = signal<string>('');
  reporteAlumnoModal = signal<any>(null);
  reportStudentTipo = signal<string>('');
  reportStudentDescripcion = signal<string>('');
  reportStudentSuccess = signal<string>('');
  reportStudentError = signal<string>('');

  // Profile modification fields
  profileNewPassword = signal<string>('');
  profileConfirmPassword = signal<string>('');
  showProfileNewPassword = signal<boolean>(false);
  showProfileConfirmPassword = signal<boolean>(false);
  profilePhotoBase64 = signal<string>('');
  profileSuccess = signal<string>('');
  profileError = signal<string>('');

  // Student Syllabus Ingestion
  studentSyllabusText = signal<string>('');
  studentSyllabusInputMode = signal<'text' | 'pdf'>('text');
  studentSyllabusPDFFile = signal<File | null>(null);
  studentSyllabusPDFFileName = signal<string>('');
  studentSyllabusSuccess = signal<string>('');
  studentSyllabusError = signal<string>('');
  studentSyllabusLoading = signal<boolean>(false);
  showSyllabusUploadForm = signal<boolean>(false);

  // Custom sheets signals
  selectedSheet = signal<string | null>(null);
  sheets = signal<string[]>([]);
  isSyllabusCollapsed = signal<boolean>(false);
  isSheetsCollapsed = signal<boolean>(true);
  newSheetName = signal<string>('');

  // Computed signal to filter student courses by current academic cycle
  studentCoursesOfCurrentCycle = computed(() => {
    const student = this.tutorService.student();
    if (!student) return [];
    // Filter the full curriculum for student's school to match their active cycle
    return this.tutorService.fullMalla().filter(c => c.ciclo === student.ciclo);
  });

  constructor(
    public tutorService: TutorService,
    public authService: AuthService,
    private router: Router
  ) {
    // Load student data once session is loaded
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.rol === 'Estudiante') {
        this.tutorService.loadStudent(user.profile_id).subscribe(() => {
          this.notesWeek.set(this.tutorService.currentWeek());
          
          // Map student school/faculty to Koha default branch
          const studentData = this.tutorService.student();
          if (studentData) {
            const normalizeStr = (str: string) => 
              (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
            
            const fac = normalizeStr(studentData.facultad);
            const esc = normalizeStr(studentData.escuela);
            let defaultSede = '';
            
            if (fac.includes('FIIS') || fac.includes('INDUSTRIAL') || fac.includes('SISTEMAS') || esc.includes('SISTEMAS') || esc.includes('INDUSTRIAL')) {
              defaultSede = '8248';
            } else if (fac.includes('ADMINISTRAC')) {
              defaultSede = '8245';
            } else if (fac.includes('ARQUITECTURA')) {
              defaultSede = '3220';
            } else if (fac.includes('ECONOMICA') || esc.includes('ECONOMICA')) {
              defaultSede = '1209';
            } else if (fac.includes('FINANCIERA') || fac.includes('CONTABLE') || esc.includes('CONTABILIDAD') || esc.includes('FINANCIERA')) {
              defaultSede = '1210';
            } else if (fac.includes('NATURAL') || fac.includes('MATEMATICA') || esc.includes('MATEMATICA') || esc.includes('BIOLOGIA') || esc.includes('FISICA') || esc.includes('QUIMICA')) {
              defaultSede = '16276';
            } else if (fac.includes('SOCIAL') || esc.includes('SOCIOLOGIA') || esc.includes('TRABAJO SOCIAL') || esc.includes('COMUNICACION')) {
              defaultSede = '10268';
            } else if (fac.includes('DERECHO') || esc.includes('DERECHO') || esc.includes('POLITICA')) {
              defaultSede = '10266';
            } else if (fac.includes('EDUCACION') || esc.includes('EDUCACION')) {
              defaultSede = '10265';
            } else if (fac.includes('ELECTRONICA') || fac.includes('INFORMATICA') || esc.includes('ELECTRONICA') || esc.includes('INFORMATICA') || esc.includes('TELECOMUNICACIONES')) {
              defaultSede = '12247';
            } else if (fac.includes('GEOGRAFICA') || fac.includes('AMBIENTAL') || esc.includes('GEOGRAFICA') || esc.includes('AMBIENTAL') || esc.includes('ECOTURISMO')) {
              defaultSede = '8246';
            } else if (fac.includes('HUMANIDADES') || esc.includes('HISTORIA') || esc.includes('LITERATURA') || esc.includes('FILOSOFIA') || esc.includes('ARQUEOLOGIA')) {
              defaultSede = '10267';
            } else if (fac.includes('CIVIL') || esc.includes('CIVIL')) {
              defaultSede = '7240';
            } else if (fac.includes('MEDICINA') || esc.includes('MEDICINA') || esc.includes('ENFERMERIA') || esc.includes('NUTRICION')) {
              defaultSede = '16285';
            } else if (fac.includes('PESQUERIA') || fac.includes('OCEANOGRAFIA') || esc.includes('PESQUERIA') || esc.includes('ACUICULTURA') || esc.includes('ALIMENTARIAS')) {
              defaultSede = '4225';
            } else if (fac.includes('ODONTOLOGIA') || esc.includes('ODONTOLOGIA')) {
              defaultSede = '13275';
            } else if (fac.includes('PSICOLOGIA') || esc.includes('PSICOLOGIA')) {
              defaultSede = '8249';
            } else if (fac.includes('TECNOLOGIA MEDICA') || esc.includes('TECNOLOGIA MEDICA')) {
              defaultSede = '16270';
            }
            
            this.kohaSearchSede.set(defaultSede);
          }
          
          this.searchKoha('');
          this.loadStudentTutoringRequests();
        });
      }
    }, { allowSignalWrites: true });

    // React to active tab change to tutoring to reload requests
    effect(() => {
      const tab = this.activeTab();
      if (tab === 'tutoring') {
        this.loadStudentTutoringRequests();
      }
    }, { allowSignalWrites: true });

    // React to active course changes
    effect(() => {
      const course = this.tutorService.activeCourse();
      const user = this.authService.currentUser();
      
      if (course && user && user.rol === 'Estudiante') {
        this.loadBanner(course.id_curso);
        this.loadWeaknesses(course.id_curso);
        this.loadTutors(course.id_curso);
      }
    }, { allowSignalWrites: true });

    // React to layout retraction/expansion changes to adjust canvas size and prevent stretching
    effect(() => {
      this.isLeftPanelRetracted();
      this.isRightPanelRetracted();
      this.isWhiteboardMaximized();
      
      this.initCanvas();
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

  // --- COURSE SELECTION ---
  selectCourse(course: any) {
    this.tutorService.activeCourse.set(course);
    this.activeTab.set('course-workspace');
    this.activeQuiz.set(null);
    this.notesSearchResults.set([]);
    this.notesUploadSuccess.set('');
    this.notesUploadError.set('');
    this.bookingSuccess.set('');

    // Load weeks of this course
    this.tutorService.getCourseWeeks(course.id_curso).subscribe(res => {
      this.weeks.set(res);
      // Select the current academic week by default (safeguard range 1-16)
      const currentAcademicWeek = Math.min(16, Math.max(1, this.tutorService.currentWeek()));
      this.selectWeek(currentAcademicWeek);
      this.loadCourseSheets();
    });
  }

  goBackToCourses() {
    this.tutorService.activeCourse.set(null);
    this.activeTab.set('courses');
    this.weeks.set([]);
    this.sheets.set([]);
    this.selectedSheet.set(null);
    this.newSheetName.set('');
    this.chatHistory.set([]);
    this.uploadedBgUrl.set(null);
    this.canvasDataSignal.set(null);
    this.isWhiteboardMaximized.set(false);
    this.isFloatingChatOpen.set(false);
  }

  // --- ESPACIO DE TRABAJO TRÍPTICO: PIZARRA, DIBUJO Y TUTOR IA ---
  isDrawing = false;
  lastX = 0;
  lastY = 0;
  ctx: CanvasRenderingContext2D | null = null;

  // Vector Whiteboard State
  strokes: Array<{ points: Array<{x: number, y: number}>, color: string, size: number, type: 'pencil' | 'highlighter' | 'eraser' }> = [];
  texts: Array<{ text: string, x: number, y: number, size: number, color: string, isSelected?: boolean }> = [];
  bgX = 50;
  bgY = 50;
  bgW = 320;
  bgH = 240;
  panX = 0;
  panY = 0;
  zoom = 1.0;

  // Interaction variables
  selectedTextIndex = signal<number | null>(null);
  isDraggingText = false;
  isDraggingBg = false;
  isPanning = false;
  lastClickTime = 0;

  // Image cache
  bgImgElement: HTMLImageElement | null = null;
  legacyOverlayImg: HTMLImageElement | null = null;

  // Whiteboard Undo/Redo Stacks
  undoStack: any[] = [];
  redoStack: any[] = [];

  // Proactive AI speech bubble signals
  floatingAiMessage = signal<string>('¡Hola! Soy tu Tutor IA. ¿Listo para aprender hoy?');
  showFloatingBubble = signal<boolean>(true);

  // New TutorTooltip signals and variables for analytics and contextual tooltips
  tutorTooltipMessage = signal<string>('');
  tutorTooltipOptions = signal<string[]>([]);
  showTutorTooltip = signal<boolean>(false);
  lastTooltipTime = 0;
  lastTooltipType = '';
  inactivityTimer: any = null;
  tutorTooltipTimeout: any = null;

  saveUndoState() {
    if (this.undoStack.length >= 50) {
      this.undoStack.shift();
    }
    this.undoStack.push(this.getCanvasStateSnapshot());
    this.redoStack = []; // Clear redo stack on new action
  }

  getCanvasStateSnapshot(): any {
    return {
      bgX: this.bgX,
      bgY: this.bgY,
      bgW: this.bgW,
      bgH: this.bgH,
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom,
      texts: JSON.parse(JSON.stringify(this.texts)),
      strokes: JSON.parse(JSON.stringify(this.strokes)),
      images: JSON.parse(JSON.stringify(this.images))
    };
  }

  restoreCanvasState(state: any) {
    if (!state) return;
    this.bgX = state.bgX ?? 50;
    this.bgY = state.bgY ?? 50;
    this.bgW = state.bgW ?? 320;
    this.bgH = state.bgH ?? 240;
    this.panX = state.panX ?? 0;
    this.panY = state.panY ?? 0;
    this.zoom = state.zoom ?? 1.0;
    this.strokes = state.strokes ?? [];
    this.texts = state.texts ?? [];
    this.images = state.images ?? [];
    this.selectedTextIndex.set(null);
    this.selectedImageIndex.set(null);
    this.redrawCanvas();
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const currentState = this.getCanvasStateSnapshot();
    this.redoStack.push(currentState);
    const prevState = this.undoStack.pop();
    this.restoreCanvasState(prevState);
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const currentState = this.getCanvasStateSnapshot();
    this.undoStack.push(currentState);
    const nextState = this.redoStack.pop();
    this.restoreCanvasState(nextState);
  }

  updateFloatingAiTip() {
    const list = this.weaknesses();
    if (list && list.length > 0) {
      this.floatingAiMessage.set(`Veo que tuviste algunos errores en: "${list[0].tema_central}". ¡Pregúntame y lo repasamos juntos!`);
      this.showFloatingBubble.set(true);
      return;
    }

    const theme = this.getSelectedWeekTheme();
    if (theme && !theme.includes('repaso de los temas') && !theme.includes('Continuación y repaso')) {
      this.floatingAiMessage.set(`Tema de la semana: "${theme}". ¿Quieres que te explique algún concepto con una analogía?`);
      this.showFloatingBubble.set(true);
      return;
    }

    this.floatingAiMessage.set('¡Hola! Soy tu Tutor IA. Puedes escribirme o subir fotos a la pizarra para guiarte en tu aprendizaje.');
    this.showFloatingBubble.set(true);
  }

  showTutorBubble(eventType: string, metadata: any = {}) {
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (!student) return;

    // 1. Send the event to the tracking API in background (decoupled)
    this.tutorService.trackEvent(student.id_alumno, eventType, metadata).subscribe({
      error: (err) => console.error('Error tracking event:', err)
    });

    // 2. Debounce and frequency control:
    const now = Date.now();
    const elapsed = now - this.lastTooltipTime;
    
    if (elapsed < 20000 && eventType === this.lastTooltipType) {
      return;
    }
    if (elapsed < 10000) { // General absolute threshold for any bubble to prevent spam
      return;
    }

    this.lastTooltipTime = now;
    this.lastTooltipType = eventType;

    const courseId = course ? course.id_curso : null;
    const weekNum = this.selectedWeek();

    // 3. Query Gemini for a quick custom message
    this.tutorService.getTutorQuickMessage(student.id_alumno, eventType, courseId, weekNum, metadata).subscribe({
      next: (res) => {
        if (res && res.message) {
          if (this.tutorTooltipTimeout) {
            clearTimeout(this.tutorTooltipTimeout);
          }
          
          this.tutorTooltipMessage.set(res.message);
          const opts = res.options || [];
          this.tutorTooltipOptions.set(opts);
          this.showTutorTooltip.set(true);
          
          // Also save this generated tooltip message and its interactive options to the tutor chat history
          this.chatHistory.update(h => [...h, {
            sender: 'ia',
            text: res.message,
            options: opts
          }]);
          this.scrollChatToBottom();
          
          // Auto close after 8 seconds
          this.tutorTooltipTimeout = setTimeout(() => {
            this.showTutorTooltip.set(false);
          }, 8000);
        }
      },
      error: (err) => {
        console.error('Error getting quick AI tutor message:', err);
      }
    });
  }

  respondToTutorTooltip(optionText: string) {
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (!student || !course) return;

    // Close tooltip bubble
    this.showTutorTooltip.set(false);

    // Open floating chat window so student can see the ongoing dialog
    this.isFloatingChatOpen.set(true);

    // Clear active options from all messages in chatHistory to prevent duplicate click actions
    this.chatHistory.update(history => history.map(m => {
      if (m.options && m.options.length > 0) {
        return { ...m, options: [] };
      }
      return m;
    }));

    // Add user response to chat history
    const historyPayload = [...this.chatHistory()];
    this.chatHistory.update(h => [...h, { sender: 'user', text: optionText }]);
    this.chatLoading.set(true);
    this.scrollChatToBottom();

    // Query Gemini chat endpoint with the selected option as direct user text
    this.tutorService.sendTimelineChatMessage(
      student.id_alumno,
      course.id_curso,
      this.selectedWeek(),
      optionText,
      historyPayload,
      this.selectedSheet()
    ).subscribe({
      next: (res) => {
        this.chatLoading.set(false);
        this.chatHistory.update(h => [...h, {
          sender: 'ia',
          text: res.respuesta,
          books: res.libros_recomendados || [],
          options: res.options || []
        }]);
        this.scrollChatToBottom();
      },
      error: (err) => {
        console.error("Error sending response option to Tutor IA:", err);
        this.chatLoading.set(false);
        this.chatHistory.update(h => [...h, {
          sender: 'ia',
          text: 'Disculpa, ha ocurrido un error al conectar con tu Tutor IA. Por favor, intenta de nuevo.'
        }]);
        this.scrollChatToBottom();
      }
    });
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    // 10 minutes = 600,000 milliseconds
    this.inactivityTimer = setTimeout(() => {
      const student = this.tutorService.student();
      const course = this.tutorService.activeCourse();
      if (student && course && this.activeTab() === 'course-workspace') {
        this.showTutorBubble('tiempo_inactivo_pizarra', {
          semana: this.selectedWeek(),
          nombre_hoja: this.selectedSheet()
        });
      }
    }, 600000);
  }

  getBrushColorRgba(alpha = 1.0): string {
    const hex = this.brushColor();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  selectWeek(weekNum: number) {
    this.selectedWeek.set(weekNum);
    this.selectedSheet.set(null);
    
    // Do NOT clear chat history (single chat session)
    this.chatMessage.set('');
    this.notesSaveSuccess.set('');
    this.notesSaveError.set('');
    this.selectedTextIndex.set(null);

    // Reset whiteboard state variables and navigation history
    this.undoStack = [];
    this.redoStack = [];
    this.updateFloatingAiTip();

    this.texts = [];
    this.strokes = [];
    this.images = [];
    this.selectedImageIndex.set(null);
    this.bgX = 50;
    this.bgY = 50;
    this.bgW = 320;
    this.bgH = 240;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.bgImgElement = null;
    this.legacyOverlayImg = null;

    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (student && course) {
      this.notesSaving.set(true);
      this.tutorService.getWeekNotes(student.id_alumno, course.id_curso, weekNum).subscribe({
        next: (res) => {
          this.notesText.set(res.texto_notes || res.texto_notas || '');
          this.uploadedBgUrl.set(res.background_url || null);
          const rawCanvasData = res.canvas_data || null;
          this.canvasDataSignal.set(rawCanvasData);
          
          if (rawCanvasData) {
            if (rawCanvasData.startsWith('{')) {
              try {
                const state = JSON.parse(rawCanvasData);
                this.bgX = state.bgX ?? 50;
                this.bgY = state.bgY ?? 50;
                this.bgW = state.bgW ?? 320;
                this.bgH = state.bgH ?? 240;
                this.panX = state.panX ?? 0;
                this.panY = state.panY ?? 0;
                this.zoom = state.zoom ?? 1.0;
                this.strokes = state.strokes ?? [];
                this.texts = state.texts ?? [];
                this.images = state.images ?? [];
              } catch (e) {
                console.error("Error parsing JSON canvas data, fallback to image overlay", e);
              }
            }
          }
          
          // Fallback / legacy support:
          if (this.images.length === 0 && this.uploadedBgUrl()) {
            this.images = [{
              url: this.uploadedBgUrl()!,
              x: this.bgX,
              y: this.bgY,
              w: this.bgW,
              h: this.bgH
            }];
          }

          this.notesSaving.set(false);
          this.initCanvas();
        },
        error: () => {
          this.notesText.set('');
          this.uploadedBgUrl.set(null);
          this.canvasDataSignal.set(null);
          this.notesSaving.set(false);
          this.initCanvas();
        }
      });
    }
  }

  selectSheet(sheetName: string) {
    this.selectedSheet.set(sheetName);
    
    // Do NOT clear chat history (single chat session)
    this.chatMessage.set('');
    this.notesSaveSuccess.set('');
    this.notesSaveError.set('');
    this.selectedTextIndex.set(null);

    // Reset whiteboard state variables and navigation history
    this.undoStack = [];
    this.redoStack = [];
    this.updateFloatingAiTip();

    this.texts = [];
    this.strokes = [];
    this.images = [];
    this.selectedImageIndex.set(null);
    this.bgX = 50;
    this.bgY = 50;
    this.bgW = 320;
    this.bgH = 240;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.bgImgElement = null;
    this.legacyOverlayImg = null;

    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (student && course) {
      this.notesSaving.set(true);
      this.tutorService.getSheetNotes(student.id_alumno, course.id_curso, sheetName).subscribe({
        next: (res) => {
          this.notesText.set(res.texto_notes || res.texto_notas || '');
          this.uploadedBgUrl.set(res.background_url || null);
          const rawCanvasData = res.canvas_data || null;
          this.canvasDataSignal.set(rawCanvasData);
          
          if (rawCanvasData) {
            if (rawCanvasData.startsWith('{')) {
              try {
                const state = JSON.parse(rawCanvasData);
                this.bgX = state.bgX ?? 50;
                this.bgY = state.bgY ?? 50;
                this.bgW = state.bgW ?? 320;
                this.bgH = state.bgH ?? 240;
                this.panX = state.panX ?? 0;
                this.panY = state.panY ?? 0;
                this.zoom = state.zoom ?? 1.0;
                this.strokes = state.strokes ?? [];
                this.texts = state.texts ?? [];
                this.images = state.images ?? [];
              } catch(e) {
                console.error("Error parsing JSON canvas data, fallback to image overlay", e);
              }
            }
          }
          
          // Fallback / legacy support:
          if (this.images.length === 0 && this.uploadedBgUrl()) {
            this.images = [{
              url: this.uploadedBgUrl()!,
              x: this.bgX,
              y: this.bgY,
              w: this.bgW,
              h: this.bgH
            }];
          }

          this.notesSaving.set(false);
          this.initCanvas();
        },
        error: () => {
          this.notesText.set('');
          this.uploadedBgUrl.set(null);
          this.canvasDataSignal.set(null);
          this.notesSaving.set(false);
          this.initCanvas();
        }
      });
    }
  }

  loadCourseSheets() {
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (student && course) {
      this.tutorService.getCourseSheets(student.id_alumno, course.id_curso).subscribe(res => {
        this.sheets.set(res);
      });
    }
  }

  createSheet() {
    const name = this.newSheetName().trim();
    if (!name) return;
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (student && course) {
      this.tutorService.saveSheetNotes(student.id_alumno, course.id_curso, name, '', null, null).subscribe({
        next: () => {
          this.newSheetName.set('');
          this.loadCourseSheets();
          this.selectSheet(name); // Select the newly created sheet
        },
        error: (err) => {
          alert('Error al crear la hoja.');
        }
      });
    }
  }

  deleteSheet(sheetName: string, event: Event) {
    event.stopPropagation(); // Prevent selecting the sheet when clicking delete
    if (!confirm(`¿Estás seguro de que deseas eliminar la hoja "${sheetName}"?`)) return;
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (student && course) {
      this.tutorService.deleteSheet(student.id_alumno, course.id_curso, sheetName).subscribe({
        next: () => {
          if (this.selectedSheet() === sheetName) {
            // Select the current academic week fallback
            const currentAcademicWeek = Math.min(16, Math.max(1, this.tutorService.currentWeek()));
            this.selectWeek(currentAcademicWeek);
          }
          this.loadCourseSheets();
        },
        error: (err) => {
          alert('Error al eliminar la hoja.');
        }
      });
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.initCanvas();
  }

  initCanvas() {
    this.resetInactivityTimer();
    // Run once at 50ms for immediate feedback
    setTimeout(() => this.resizeCanvasOnly(), 50);
    // Run again at 250ms once the sidebar transition completes
    setTimeout(() => this.resizeCanvasOnly(), 250);
  }

  resizeCanvasOnly() {
    const canvas = document.getElementById('whiteboardCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.updateBrush();
      
      this.redrawCanvas();
    }
  }

  redrawCanvas() {
    const canvas = document.getElementById('whiteboardCanvas') as HTMLCanvasElement;
    if (!canvas || !this.ctx) return;
    
    // Clear main canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create temporary offscreen canvas to render transparent drawings layer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw all uploaded/inserted images on main canvas
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      let imgEl = this.imageElementCache.get(img.url);
      if (!imgEl) {
        imgEl = new Image();
        imgEl.onload = () => this.redrawCanvas();
        imgEl.src = img.url;
        this.imageElementCache.set(img.url, imgEl);
      }
      
      if (imgEl.complete) {
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.drawImage(imgEl, img.x, img.y, img.w, img.h);
        
        // Draw dotted selection box and corner handle around selected image
        if (img.isSelected) {
          this.ctx.strokeStyle = '#ea580c'; // gold-orange
          this.ctx.lineWidth = 2 / this.zoom;
          this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
          this.ctx.strokeRect(img.x, img.y, img.w, img.h);
          this.ctx.setLineDash([]);
          
          // Draw resize handle circle at bottom-right corner
          this.ctx.fillStyle = '#ea580c';
          this.ctx.beginPath();
          this.ctx.arc(img.x + img.w, img.y + img.h, 6 / this.zoom, 0, 2 * Math.PI);
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }
    
    // Draw legacy overlay image if present (backward compatibility)
    const legacyUrl = this.canvasDataSignal();
    if (legacyUrl && legacyUrl.startsWith('data:image')) {
      if (!this.legacyOverlayImg) {
        this.legacyOverlayImg = new Image();
        this.legacyOverlayImg.onload = () => {
          this.redrawCanvas();
        };
        this.legacyOverlayImg.src = legacyUrl;
      }
      if (this.legacyOverlayImg.complete) {
        this.ctx.drawImage(this.legacyOverlayImg, 0, 0);
      }
    }
    
    // Draw drawing layer onto tempCtx
    tempCtx.save();
    tempCtx.translate(this.panX, this.panY);
    tempCtx.scale(this.zoom, this.zoom);
    
    // Render strokes
    for (const stroke of this.strokes) {
      if (stroke.points.length === 0) continue;
      
      tempCtx.beginPath();
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';
      tempCtx.lineWidth = stroke.size;
      
      if (stroke.type === 'eraser') {
        tempCtx.globalCompositeOperation = 'destination-out';
      } else {
        tempCtx.globalCompositeOperation = 'source-over';
      }
      
      tempCtx.strokeStyle = stroke.color;
      
      tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      tempCtx.stroke();
    }
    
    // Render text objects
    tempCtx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < this.texts.length; i++) {
      const txt = this.texts[i];
      tempCtx.font = `bold ${txt.size}px Outfit, Inter, Arial`;
      tempCtx.fillStyle = txt.color;
      tempCtx.fillText(txt.text, txt.x, txt.y);
      
      // Draw a dotted selector box around the selected text
      if (txt.isSelected) {
        tempCtx.strokeStyle = '#ea580c'; // gold-orange accent
        tempCtx.lineWidth = 1.5;
        tempCtx.setLineDash([3, 3]);
        const txtW = txt.text.length * (txt.size * 0.55);
        tempCtx.strokeRect(txt.x - 4, txt.y - txt.size, txtW + 8, txt.size + 8);
        tempCtx.setLineDash([]);
      }
    }
    
    tempCtx.restore();
    
    // Composite offscreen drawings layer on top of main canvas
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  updateBrush() {
    if (this.ctx) {
      this.ctx.strokeStyle = this.brushColor();
      this.ctx.lineWidth = this.brushSize();
    }
  }

  startDrawing(event: MouseEvent) {
    this.resetInactivityTimer();
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas || !this.ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    // dynamic zoom independent coordinate formula
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    // convert coordinate space relative to pan & zoom
    const canvasX = (x - this.panX) / this.zoom;
    const canvasY = (y - this.panY) / this.zoom;
    
    if (this.drawingTool() === 'text') {
      const text = prompt('Escribe el texto que deseas colocar:');
      if (text) {
        this.saveUndoState();
        this.texts.push({
          text: text,
          x: canvasX,
          y: canvasY,
          size: this.fontSize(),
          color: this.brushColor()
        });
        this.redrawCanvas();
      }
      return;
    }
    
    if (this.drawingTool() === 'select') {
      // Double click hold to Pan
      const now = Date.now();
      if (now - this.lastClickTime < 300) {
        this.isPanning = true;
        this.lastX = x;
        this.lastY = y;
        this.lastClickTime = now;
        return;
      }
      this.lastClickTime = now;

      // 1. Check if we hit a text object
      let hitTextIndex = -1;
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const txt = this.texts[i];
        const txtW = txt.text.length * (txt.size * 0.55);
        const txtH = txt.size;
        if (canvasX >= txt.x && canvasX <= txt.x + txtW && canvasY >= txt.y - txtH && canvasY <= txt.y + 5) {
          hitTextIndex = i;
          break;
        }
      }
      if (hitTextIndex !== -1) {
        this.images.forEach(img => img.isSelected = false);
        this.selectedImageIndex.set(null);

        this.texts.forEach(t => t.isSelected = false);
        this.texts[hitTextIndex].isSelected = true;
        this.selectedTextIndex.set(hitTextIndex);
        this.saveUndoState();
        this.isDraggingText = true;
        this.lastX = x;
        this.lastY = y;
        this.redrawCanvas();
        return;
      }
      
      // 2. Check if we hit a resize handle of the currently selected image
      const selectedImgIdx = this.selectedImageIndex();
      if (selectedImgIdx !== null && selectedImgIdx >= 0 && selectedImgIdx < this.images.length) {
        const img = this.images[selectedImgIdx];
        const handleSize = 15; // hitbox size in virtual pixels
        const cornerX = img.x + img.w;
        const cornerY = img.y + img.h;
        if (canvasX >= cornerX - handleSize && canvasX <= cornerX + handleSize &&
            canvasY >= cornerY - handleSize && canvasY <= cornerY + handleSize) {
          this.saveUndoState();
          this.isResizingBg = true;
          this.lastX = x;
          this.lastY = y;
          return;
        }
      }

      // 3. Check if we hit any image
      let hitImageIndex = -1;
      for (let i = this.images.length - 1; i >= 0; i--) {
        const img = this.images[i];
        if (canvasX >= img.x && canvasX <= img.x + img.w && canvasY >= img.y && canvasY <= img.y + img.h) {
          hitImageIndex = i;
          break;
        }
      }
      if (hitImageIndex !== -1) {
        this.texts.forEach(t => t.isSelected = false);
        this.selectedTextIndex.set(null);

        this.images.forEach(img => img.isSelected = false);
        this.images[hitImageIndex].isSelected = true;
        this.selectedImageIndex.set(hitImageIndex);
        this.saveUndoState();
        this.isDraggingBg = true;
        this.lastX = x;
        this.lastY = y;
        this.redrawCanvas();
        return;
      }
      
      // 4. Hit nothing -> deselect everything
      this.texts.forEach(t => t.isSelected = false);
      this.selectedTextIndex.set(null);
      this.images.forEach(img => img.isSelected = false);
      this.selectedImageIndex.set(null);
      this.redrawCanvas();
      return;
    }
    
    // Drawing modes
    this.saveUndoState();
    this.isDrawing = true;
    const strokeType = this.drawingTool() as any;
    const strokeColor = this.drawingTool() === 'highlighter' ? this.getBrushColorRgba(0.35) : this.brushColor();
    const strokeSize = this.drawingTool() === 'eraser' ? this.brushSize() * 3 : this.brushSize();
    
    this.strokes.push({
      points: [{x: canvasX, y: canvasY}],
      color: strokeColor,
      size: strokeSize,
      type: strokeType
    });
  }

  draw(event: MouseEvent) {
    this.resetInactivityTimer();
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas || !this.ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    if (this.isPanning) {
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      this.panX += dx;
      this.panY += dy;
      this.lastX = x;
      this.lastY = y;
      this.redrawCanvas();
      return;
    }
    
    if (this.isDrawing) {
      const canvasX = (x - this.panX) / this.zoom;
      const canvasY = (y - this.panY) / this.zoom;
      
      const lastStroke = this.strokes[this.strokes.length - 1];
      lastStroke.points.push({x: canvasX, y: canvasY});
      this.redrawCanvas();
      return;
    }
    
    if (this.isDraggingText && this.selectedTextIndex() !== null) {
      const dx = (x - this.lastX) / this.zoom;
      const dy = (y - this.lastY) / this.zoom;
      const idx = this.selectedTextIndex()!;
      this.texts[idx].x += dx;
      this.texts[idx].y += dy;
      this.lastX = x;
      this.lastY = y;
      this.redrawCanvas();
      return;
    }
    
    if (this.isResizingBg && this.selectedImageIndex() !== null) {
      const idx = this.selectedImageIndex()!;
      const img = this.images[idx];
      const dx = (x - this.lastX) / this.zoom;
      const dy = (y - this.lastY) / this.zoom;
      
      img.w = Math.max(50, img.w + dx);
      img.h = Math.max(50, img.h + dy);
      
      this.lastX = x;
      this.lastY = y;
      this.redrawCanvas();
      return;
    }
    
    if (this.isDraggingBg && this.selectedImageIndex() !== null) {
      const idx = this.selectedImageIndex()!;
      const img = this.images[idx];
      const dx = (x - this.lastX) / this.zoom;
      const dy = (y - this.lastY) / this.zoom;
      
      img.x += dx;
      img.y += dy;
      
      this.lastX = x;
      this.lastY = y;
      this.redrawCanvas();
      return;
    }
  }

  stopDrawing(event: MouseEvent) {
    this.isDrawing = false;
    this.isDraggingText = false;
    this.isDraggingBg = false;
    this.isResizingBg = false;
    this.isPanning = false;
  }

  zoomIn() {
    this.zoom = Math.min(3.0, this.zoom + 0.15);
    this.redrawCanvas();
  }

  zoomOut() {
    this.zoom = Math.max(0.4, this.zoom - 0.15);
    this.redrawCanvas();
  }

  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.bgX = 50;
    this.bgY = 50;
    this.redrawCanvas();
  }

  onWheelZoom(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoom = Math.min(3.0, this.zoom + 0.05);
    } else {
      this.zoom = Math.max(0.4, this.zoom - 0.05);
    }
    this.redrawCanvas();
  }

  toggleWhiteboardMaximize() {
    this.isWhiteboardMaximized.set(!this.isWhiteboardMaximized());
    setTimeout(() => {
      const canvas = document.getElementById('whiteboardCanvas') as HTMLCanvasElement;
      if (canvas && this.ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.redrawCanvas();
      }
    }, 250);
  }

  resizeSelectedText(factor: number) {
    const idx = this.selectedTextIndex();
    if (idx !== null && idx >= 0 && idx < this.texts.length) {
      this.saveUndoState();
      this.texts[idx].size = Math.max(10, Math.min(72, this.texts[idx].size + factor));
      this.redrawCanvas();
    }
  }

  deleteSelectedText() {
    const idx = this.selectedTextIndex();
    if (idx !== null && idx >= 0 && idx < this.texts.length) {
      this.saveUndoState();
      this.texts.splice(idx, 1);
      this.selectedTextIndex.set(null);
      this.redrawCanvas();
    }
  }

  clearCanvas() {
    this.saveUndoState();
    this.strokes = [];
    this.texts = [];
    this.selectedTextIndex.set(null);
    this.redrawCanvas();
  }

  onBgFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.resetInactivityTimer();
    this.tutorService.uploadNotesBackground(file).subscribe({
      next: (res) => {
        this.saveUndoState();
        const baseUrl = this.tutorService.apiBaseUrl.replace('/api', '');
        
        if (res.is_pdf && res.pages) {
          // It's a PDF! Insert all pages vertically
          let currentY = 50;
          if (this.images.length > 0) {
            const maxYImg = this.images.reduce((prev, current) => (prev.y + prev.h > current.y + current.h) ? prev : current);
            currentY = maxYImg.y + maxYImg.h + 50;
          }
          
          res.pages.forEach((pageUrl: string) => {
            const fullPageUrl = baseUrl + pageUrl;
            this.images.push({
              url: fullPageUrl,
              x: 50,
              y: currentY,
              w: 550,
              h: 770
            });
            currentY += 820;
          });
          
          if (res.pages.length > 0) {
            this.uploadedBgUrl.set(baseUrl + res.pages[0]);
          }
        } else {
          // Single image! Insert it
          let currentY = 50;
          if (this.images.length > 0) {
            const maxYImg = this.images.reduce((prev, current) => (prev.y + prev.h > current.y + current.h) ? prev : current);
            currentY = maxYImg.y + maxYImg.h + 30;
          }
          
          const fullUrl = baseUrl + (res.url || res.background_url);
          this.images.push({
            url: fullUrl,
            x: 50,
            y: currentY,
            w: 400,
            h: 300
          });
          
          this.uploadedBgUrl.set(fullUrl);
        }
        
        this.redrawCanvas();
        event.target.value = '';
        this.showTutorBubble('subida_pizarra', { filename: file.name });
      },
      error: () => {
        this.notesSaveError.set('Error al subir el archivo');
        setTimeout(() => this.notesSaveError.set(''), 3000);
      }
    });
  }

  removeBg() {
    this.saveUndoState();
    this.images = [];
    this.uploadedBgUrl.set(null);
    this.selectedImageIndex.set(null);
    this.redrawCanvas();
  }

  resizeSelectedImage(factor: number) {
    const idx = this.selectedImageIndex();
    if (idx !== null && idx >= 0 && idx < this.images.length) {
      this.saveUndoState();
      const img = this.images[idx];
      const ratio = img.h / img.w;
      img.w = Math.max(50, img.w + factor);
      img.h = img.w * ratio;
      this.redrawCanvas();
    }
  }

  deleteSelectedImage() {
    const idx = this.selectedImageIndex();
    if (idx !== null && idx >= 0 && idx < this.images.length) {
      this.saveUndoState();
      this.images.splice(idx, 1);
      this.selectedImageIndex.set(null);
      this.redrawCanvas();
    }
  }

  saveNotesAndCanvas() {
    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (!student || !course) return;

    this.notesSaving.set(true);
    this.notesSaveSuccess.set('');
    this.notesSaveError.set('');

    // Serialize whiteboard state as JSON version 3.0
    const whiteboardState = {
      version: "3.0",
      bgX: this.bgX,
      bgY: this.bgY,
      bgW: this.bgW,
      bgH: this.bgH,
      panX: this.panX,
      panY: this.panY,
      zoom: this.zoom,
      texts: this.texts,
      strokes: this.strokes,
      images: this.images
    };
    const canvasData = JSON.stringify(whiteboardState);

    const firstImgUrl = this.images.length > 0 ? this.images[0].url : null;
    this.uploadedBgUrl.set(firstImgUrl);

    if (this.selectedSheet()) {
      const sheetName = this.selectedSheet()!;
      this.tutorService.saveSheetNotes(
        student.id_alumno,
        course.id_curso,
        sheetName,
        this.notesText(),
        canvasData,
        firstImgUrl
      ).subscribe({
        next: () => {
          this.notesSaving.set(false);
          this.notesSaveSuccess.set('¡Apuntes guardados con éxito!');
          setTimeout(() => this.notesSaveSuccess.set(''), 3000);
        },
        error: () => {
          this.notesSaving.set(false);
          this.notesSaveError.set('Error al guardar tus apuntes en base de datos.');
          setTimeout(() => this.notesSaveError.set(''), 3000);
        }
      });
    } else {
      this.tutorService.saveWeekNotes(
        student.id_alumno,
        course.id_curso,
        this.selectedWeek(),
        this.notesText(),
        canvasData,
        firstImgUrl
      ).subscribe({
        next: () => {
          this.notesSaving.set(false);
          this.notesSaveSuccess.set('¡Apuntes guardados con éxito!');
          setTimeout(() => this.notesSaveSuccess.set(''), 3000);
        },
        error: () => {
          this.notesSaving.set(false);
          this.notesSaveError.set('Error al guardar tus apuntes en base de datos.');
          setTimeout(() => this.notesSaveError.set(''), 3000);
        }
      });
    }
  }

  sendChatMessage() {
    const msg = this.chatMessage().trim();
    if (!msg || this.chatLoading()) return;

    const student = this.tutorService.student();
    const course = this.tutorService.activeCourse();
    if (!student || !course) return;

    // Clear active options from all previous messages to prevent duplicate clicks
    this.chatHistory.update(history => history.map(m =>
      m.options && m.options.length > 0 ? { ...m, options: [] } : m
    ));

    const historyPayload = [...this.chatHistory()];
    this.chatHistory.update(h => [...h, { sender: 'user', text: msg }]);
    this.chatMessage.set('');
    this.chatLoading.set(true);

    this.scrollChatToBottom();

    this.tutorService.sendTimelineChatMessage(
      student.id_alumno,
      course.id_curso,
      this.selectedWeek(),
      msg,
      historyPayload,
      this.selectedSheet()
    ).subscribe({
      next: (res) => {
        this.chatLoading.set(false);
        this.chatHistory.update(h => [...h, {
          sender: 'ia',
          text: res.respuesta,
          books: res.libros_recomendados || [],
          options: res.options || []
        }]);
        this.scrollChatToBottom();
      },
      error: () => {
        this.chatLoading.set(false);
        this.chatHistory.update(h => [...h, {
          sender: 'ia',
          text: 'Disculpa, ha ocurrido un error al conectar con tu Tutor IA. Por favor, intenta de nuevo.'
        }]);
        this.scrollChatToBottom();
      }
    });
  }

  scrollChatToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chatMessagesContainer');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      const floatingContainer = document.getElementById('chatMessagesContainerFloating');
      if (floatingContainer) {
        floatingContainer.scrollTop = floatingContainer.scrollHeight;
      }
    }, 100);
  }

  getSelectedWeekTheme(): string {
    const wk = this.weeks().find(w => w.semana_numero === this.selectedWeek());
    return wk ? wk.tema_central : `Tema de la Semana ${this.selectedWeek()}`;
  }

  getSelectedWeekReadings(): string {
    const wk = this.weeks().find(w => w.semana_numero === this.selectedWeek());
    return wk ? wk.lecturas_obligatorias || 'Revisar material complementario' : 'Revisar material complementario';
  }



  // --- MODULE 2: FOCUS BANNER & NOTEBOOK ---
  loadBanner(courseId: string) {
    this.tutorService.getFocusBanner(courseId).subscribe(res => {
      this.bannerText.set(res.banner_texto);
      this.bannerTopic.set(res.tema);
      this.bannerReadings.set(res.lecturas);
    });
  }

  uploadNotes() {
    const course = this.tutorService.activeCourse();
    if (!course || !this.notesText()) return;

    this.notesUploadSuccess.set('');
    this.notesUploadError.set('');

    this.tutorService.uploadNotes(
      course.id_curso,
      this.notesWeek(),
      this.notesText(),
      this.notesReadings()
    ).subscribe({
      next: (res) => {
        this.notesUploadSuccess.set('¡Apuntes indexados y vectorizados en el sílabo con éxito!');
        this.notesText.set('');
        this.notesReadings.set('');
        if (this.notesWeek() === this.tutorService.currentWeek()) {
          this.loadBanner(course.id_curso);
        }
      },
      error: (err) => {
        this.notesUploadError.set('Error al indexar apuntes en la base de datos.');
      }
    });
  }

  searchNotes() {
    const course = this.tutorService.activeCourse();
    if (!course || !this.notesSearchQuery()) return;

    this.tutorService.searchNotes(course.id_curso, this.notesSearchQuery()).subscribe(res => {
      this.notesSearchResults.set(res.resultados);
    });
  }

  // --- MODULE 3: QUIZ EVALUATOR ---
  loadWeaknesses(courseId: string) {
    const user = this.authService.currentUser();
    if (!user) return;
    this.tutorService.getWeaknesses(user.profile_id, courseId).subscribe(res => {
      this.weaknesses.set(res);
    });
  }

  startQuiz() {
    const course = this.tutorService.activeCourse();
    const user = this.authService.currentUser();
    if (!course || !user) return;

    this.quizLoading.set(true);
    this.quizError.set('');
    this.activeQuiz.set(null);
    this.currentQuestionIndex.set(0);
    this.selectedOptionIndex.set(null);
    this.quizSubmitted.set(false);
    this.score.set(0);

    this.tutorService.generateQuiz(user.profile_id, course.id_curso).subscribe({
      next: (res) => {
        this.activeQuiz.set(res.preguntas);
        this.quizLoading.set(false);
        this.showTutorBubble('autoevaluacion_iniciada', { course_id: course.id_curso });
      },
      error: (err) => {
        this.quizError.set(err.error?.error || 'No hay suficientes apuntes en el sílabo para generar un quiz.');
        this.quizLoading.set(false);
      }
    });
  }

  selectOption(idx: number) {
    if (this.quizSubmitted()) return;
    this.selectedOptionIndex.set(idx);
  }

  submitAnswer() {
    const quiz = this.activeQuiz();
    const currentIdx = this.currentQuestionIndex();
    const selectedIdx = this.selectedOptionIndex();
    const course = this.tutorService.activeCourse();
    const user = this.authService.currentUser();

    if (!quiz || selectedIdx === null || !course || !user) return;

    this.quizSubmitted.set(true);
    const question = quiz[currentIdx];
    
    if (selectedIdx === question.correct_index) {
      this.score.update(s => s + 1);
    } else {
      const failedConcept = question.question.includes('¿') 
        ? question.question.split('¿')[1]?.split('?')[0] || question.question 
        : question.question;
      
      this.tutorService.logQuizFailure(user.profile_id, course.id_curso, failedConcept.substring(0, 100)).subscribe(() => {
        this.loadWeaknesses(course.id_curso);
      });
    }
  }

  nextQuestion() {
    const list = this.activeQuiz();
    const nextIdx = this.currentQuestionIndex() + 1;
    this.currentQuestionIndex.set(nextIdx);
    this.selectedOptionIndex.set(null);
    this.quizSubmitted.set(false);

    if (list && nextIdx >= list.length) {
      const finalScore = this.score();
      this.showTutorBubble('autoevaluacion_completada', {
        score: finalScore,
        total: list.length,
        nota: Math.round((finalScore / list.length) * 20)
      });
    }
  }

  toggleKohaSedeDropdown(event: Event) {
    event.stopPropagation();
    this.isKohaSedeDropdownOpen.update(v => !v);
  }

  selectKohaSede(code: string) {
    this.kohaSearchSede.set(code);
    this.isKohaSedeDropdownOpen.set(false);
  }

  getSelectedKohaSedeName(): string {
    const code = this.kohaSearchSede();
    const found = this.kohaSedes.find(opt => opt.code === code);
    return found ? found.name : 'Todas las bibliotecas';
  }

  // --- MODULE 4: RESOURCES & KOHA ---
  searchKoha(e?: any) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    this.kohaSearchLoading.set(true);
    this.kohaSearchError.set('');
    
    const queryStr = this.kohaSearchQuery();
    if (queryStr && queryStr.trim()) {
      this.showTutorBubble('busqueda_libro', { query: queryStr.trim(), branch: this.kohaSearchSede() });
    }
    
    this.tutorService.getKohaBooks(this.kohaSearchQuery(), this.kohaSearchSede()).subscribe({
      next: (res: any) => {
        if (res && res.resultados) {
          this.kohaBooks.set(res.resultados);
        } else if (Array.isArray(res)) {
          this.kohaBooks.set(res);
        } else {
          this.kohaBooks.set([]);
        }
        this.kohaSearchLoading.set(false);
      },
      error: (err) => {
        console.error("Error connecting to Koha:", err);
        const errMsg = err.error?.error || 'El catálogo de la biblioteca Koha UNFV no se encuentra disponible temporalmente.';
        this.kohaSearchError.set(errMsg);
        this.kohaBooks.set([]);
        this.kohaSearchLoading.set(false);
      }
    });
  }

  loadTutors(courseId: string) {
    this.tutorService.getTutors(courseId).subscribe(res => {
      this.tutors.set(res);
    });
  }

  openBookingModal(tutor: any) {
    this.selectedTutor.set(tutor);
    this.selectedSlot.set(null);
    this.bookingSuccess.set('');
  }

  selectSlot(slot: any) {
    this.selectedSlot.set(slot);
  }

  bookTutoringSlot() {
    const tutor = this.selectedTutor();
    const slot = this.selectedSlot();
    const user = this.authService.currentUser();
    if (!tutor || !slot || !user) return;

    this.tutorService.bookTutor(user.profile_id, tutor.id_profesor, slot.dia, slot.hora).subscribe(res => {
      this.bookingSuccess.set(res.message);
      this.selectedTutor.set(null);
      this.selectedSlot.set(null);
    });
  }

  // --- MODULE 5: WELLBEING & OBU ---
  checkStressSentiment() {
    if (!this.wellbeingQuery()) return;
    this.tutorService.checkStress(this.wellbeingQuery()).subscribe(res => {
      this.wellbeingFeedback.set(res);
      this.wellbeingQuery.set('');
    });
  }

  // --- SOLICITUDES DE TUTORÍA HANDLERS ---
  loadStudentTutoringRequests() {
    const student = this.tutorService.student();
    if (!student) return;
    this.tutorService.getStudentTutoringRequests(student.id_alumno).subscribe({
      next: (res) => {
        this.studentTutoringRequests.set(res.mis_solicitudes || []);
        this.studentGroupTutorings.set(res.tutorias_grupales || []);
        this.studentUniones.set(res.mis_uniones || []);
        this.isStudentSancionado.set(res.sancionado || false);
      }
    });
  }

  onReqFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.reqFile.set(file);
      this.reqFileName.set(file.name);
    }
  }

  submitTutoringRequest() {
    this.reqSuccess.set('');
    this.reqError.set('');
    const student = this.tutorService.student();
    if (!student) return;
    
    if (!this.reqCourseId()) {
      this.reqError.set('Debe seleccionar un curso.');
      return;
    }
    
    if (this.reqStudentCount() <= 0) {
      this.reqError.set('La cantidad de estudiantes debe ser mayor a 0.');
      return;
    }
    
    if (!this.reqFile()) {
      this.reqError.set('Debe subir el archivo Word de la solicitud con las firmas.');
      return;
    }
    
    if (!this.reqAcceptNotice()) {
      this.reqError.set('Debe aceptar el aviso regulatorio y de sanciones.');
      return;
    }
    
    const formData = new FormData();
    formData.append('id_alumno', student.id_alumno);
    formData.append('id_curso', this.reqCourseId());
    formData.append('cantidad_estudiantes', this.reqStudentCount().toString());
    formData.append('file', this.reqFile()!);
    
    this.tutorService.createTutoringRequest(formData).subscribe({
      next: (res) => {
        this.reqSuccess.set('¡Solicitud de tutoría enviada con éxito al administrador OTPS de tu facultad!');
        const oldCourseId = this.reqCourseId();
        const oldStudentCount = this.reqStudentCount();
        this.reqFile.set(null);
        this.reqFileName.set('');
        this.reqCourseId.set('');
        this.reqStudentCount.set(2);
        this.reqAcceptNotice.set(false);
        this.loadStudentTutoringRequests();
        this.showTutorBubble('agendar_tutoria', { id_curso: oldCourseId, cantidad_estudiantes: oldStudentCount });
      },
      error: (err) => {
        this.reqError.set(err.error?.error || 'Error al enviar la solicitud.');
      }
    });
  }

  joinTutoringSession(idSolicitud: number) {
    this.joinSuccess.set('');
    this.joinError.set('');
    const student = this.tutorService.student();
    if (!student) return;
    
    if (!this.joinAcceptNotice()) {
      this.joinError.set('Debe marcar la casilla para aceptar el aviso y reglamento antes de unirse.');
      return;
    }
    
    this.tutorService.joinTutoringSession(idSolicitud, student.id_alumno).subscribe({
      next: (res) => {
        this.joinSuccess.set('¡Te has unido exitosamente a la tutoría grupal!');
        this.joinAcceptNotice.set(false);
        this.loadStudentTutoringRequests();
        this.showTutorBubble('agendar_tutoria', { id_solicitud: idSolicitud, unido: true });
      },
      error: (err) => {
        this.joinError.set(err.error?.error || 'Error al unirse a la tutoría.');
      }
    });
  }

  cancelTutoringRequest(idSolicitud: number) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud de tutoría grupal?')) return;
    
    this.reqSuccess.set('');
    this.reqError.set('');
    const student = this.tutorService.student();
    if (!student) return;
    
    this.tutorService.cancelTutoringRequest(idSolicitud, student.id_alumno).subscribe({
      next: (res) => {
        this.reqSuccess.set('La tutoría grupal ha sido cancelada exitosamente.');
        this.loadStudentTutoringRequests();
        this.showTutorBubble('cancelar_tutoria', { id_solicitud: idSolicitud });
      },
      error: (err) => {
        this.reqError.set(err.error?.error || 'Error al cancelar la tutoría.');
      }
    });
  }

  completeRequest(idSolicitud: number) {
    this.completarStudentSuccess.set('');
    this.completarStudentError.set('');
    this.tutorService.completeTutoringSession(idSolicitud).subscribe({
      next: (res) => {
        this.completarStudentSuccess.set(res.message);
        this.loadStudentTutoringRequests();
        setTimeout(() => this.completarStudentSuccess.set(''), 3000);
      },
      error: (err) => {
        this.completarStudentError.set(err.error?.error || 'Error al completar la tutoría.');
      }
    });
  }

  openReportStudentModal(session: any) {
    this.reporteAlumnoModal.set(session);
    this.reportStudentTipo.set('');
    this.reportStudentDescripcion.set('');
    this.reportStudentSuccess.set('');
    this.reportStudentError.set('');
  }

  submitStudentReport(id?: number, tipo?: string, descripcion?: string) {
    const session = this.reporteAlumnoModal();
    const idSolicitud = id || (session ? session.id_solicitud : null);
    const reportTipo = tipo || this.reportStudentTipo();
    const reportDesc = descripcion || this.reportStudentDescripcion();
    if (!idSolicitud || !reportTipo) return;
    
    this.reportStudentSuccess.set('');
    this.reportStudentError.set('');
    this.tutorService.reportTutoringIncident(
      idSolicitud,
      'alumno',
      reportTipo,
      reportDesc
    ).subscribe({
      next: (res) => {
        this.reportStudentSuccess.set('Reporte enviado con éxito.');
        setTimeout(() => this.reporteAlumnoModal.set(null), 2000);
      },
      error: (err) => {
        this.reportStudentError.set(err.error?.error || 'Error al enviar el reporte.');
      }
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
    this.updateProfile();
  }

  updateProfile() {
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

    const curUser = this.authService.currentUser();
    if (Object.keys(payload).length === 0) {
      this.profileError.set('No se han modificado campos.');
      return;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.profileSuccess.set('¡Perfil actualizado con éxito!');
        this.profileNewPassword.set('');
        this.profileConfirmPassword.set('');
        this.profilePhotoBase64.set('');
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

  onStudentSyllabusPDFChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.studentSyllabusPDFFile.set(file);
      this.studentSyllabusPDFFileName.set(file.name);
    }
  }

  ingestStudentSyllabus() {
    const course = this.tutorService.activeCourse();
    if (!course) return;

    this.studentSyllabusSuccess.set('');
    this.studentSyllabusError.set('');
    this.studentSyllabusLoading.set(true);

    if (this.studentSyllabusInputMode() === 'text') {
      const text = this.studentSyllabusText();
      if (!text) {
        this.studentSyllabusLoading.set(false);
        return;
      }
      this.tutorService.ingestSilabo(course.id_curso, text, 'Estudiante_Texto').subscribe({
        next: (res) => {
          this.studentSyllabusSuccess.set(res.message);
          this.studentSyllabusText.set('');
          this.studentSyllabusLoading.set(false);
          this.showSyllabusUploadForm.set(false);
          this.loadBanner(course.id_curso);
        },
        error: (err) => {
          this.studentSyllabusError.set(err.error?.error || 'Error al cargar el sílabo.');
          this.studentSyllabusLoading.set(false);
        }
      });
    } else {
      const file = this.studentSyllabusPDFFile();
      if (!file) {
        this.studentSyllabusLoading.set(false);
        return;
      }
      this.tutorService.ingestSilaboPDF(course.id_curso, file, 'Estudiante_PDF').subscribe({
        next: (res) => {
          this.studentSyllabusSuccess.set(res.message);
          this.studentSyllabusPDFFile.set(null);
          this.studentSyllabusPDFFileName.set('');
          this.studentSyllabusLoading.set(false);
          this.showSyllabusUploadForm.set(false);
          this.loadBanner(course.id_curso);
        },
        error: (err) => {
          this.studentSyllabusError.set(err.error?.error || 'Error al cargar el archivo PDF del sílabo.');
          this.studentSyllabusLoading.set(false);
        }
      });
    }
  }

  addCourseToEnrollment(courseId: string) {
    const student = this.tutorService.student();
    if (!student) return;

    const currentEnrollment = this.tutorService.activeNotebooks().map(c => c.id_curso) || [];
    if (!currentEnrollment.includes(courseId)) {
      const updatedEnrollment = [...currentEnrollment, courseId];
      this.tutorService.updateStudentEnrollment(student.id_alumno, updatedEnrollment).subscribe({
        next: () => {
          this.showAddCourseModal.set(false);
        }
      });
    }
  }

  removeCourseFromEnrollment(courseId: string) {
    const student = this.tutorService.student();
    if (!student) return;

    const currentEnrollment = this.tutorService.activeNotebooks().map(c => c.id_curso) || [];
    const updatedEnrollment = currentEnrollment.filter(id => id !== courseId);
    this.tutorService.updateStudentEnrollment(student.id_alumno, updatedEnrollment).subscribe();
  }
}
