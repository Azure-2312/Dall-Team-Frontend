import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  apiBaseUrl = 'https://dall-team-backend.onrender.com/api';

  // Signals for application state
  student = signal<any>(null);
  currentWeek = signal<number>(11); // Defaults to week 11 (June 19, 2026)
  activeCourse = signal<any>(null);
  activeNotebooks = signal<any[]>([]);
  isLagging = signal<boolean>(false);
  fullMalla = signal<any[]>([]);
  
  // Wellbeing signals
  stressLevel = signal<string>('bajo');
  obuActive = signal<boolean>(false);
  withdrawalWarning = signal<string>('');
  obuInfo = signal<any>(null);

  // Enrollment signals
  totalCredits = signal<number>(0);
  excedeCreditos = signal<boolean>(false);
  cicloOptions = signal<any[]>([]);

  constructor(private http: HttpClient) {
    this.getWeekInfo().subscribe();
    this.loadObuInfo().subscribe();
  }

  // Módulo 1: Ruta Académica Inteligente
  loadStudent(idAlumno: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/academic/student/${idAlumno}`).pipe(
      tap(res => {
        this.student.set(res.alumno);
        this.activeNotebooks.set(res.dashboard_restructurado.cursos_activos);
        this.isLagging.set(res.dashboard_restructurado.es_atrasado);
        this.fullMalla.set(res.malla_completa);
        this.totalCredits.set(res.dashboard_restructurado.total_credits || 0);
        this.excedeCreditos.set(res.dashboard_restructurado.excede_credits || false);
        this.cicloOptions.set(res.dashboard_restructurado.opciones_ciclo || []);
        
        // Default active course if not set
        if (res.dashboard_restructurado.cursos_activos.length > 0) {
          this.activeCourse.set(res.dashboard_restructurado.cursos_activos[0]);
        } else {
          this.activeCourse.set(null);
        }
      })
    );
  }

  updateHistory(idAlumno: string, records: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/academic/student/${idAlumno}/history`, { records }).pipe(
      tap(() => this.loadStudent(idAlumno).subscribe())
    );
  }

  updateStudentEnrollment(idAlumno: string, enrolledCourseIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/academic/student/${idAlumno}/exclusions`, {
      enrolled_course_ids: enrolledCourseIds
    }).pipe(
      tap(() => this.loadStudent(idAlumno).subscribe())
    );
  }

  // Módulo 2: Sincronización Temporal (Sílabo & Notebook)
  getWeekInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/timeline/week`).pipe(
      tap(res => {
        this.currentWeek.set(res.semana_actual);
      })
    );
  }

  getFocusBanner(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/timeline/focus-banner/${courseId}`);
  }

  uploadNotes(courseId: string, week: number, notesText: string, readings?: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/timeline/notes/upload`, {
      id_curso: courseId,
      semana_numero: week,
      texto_apuntes: notesText,
      lecturas_obligatorias: readings || ''
    });
  }

  searchNotes(courseId: string, query: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/timeline/notes/search`, {
      params: { id_curso: courseId, query }
    });
  }

  // --- MÉTODOS DEL ESPACIO DE TRABAJO TRÍPTICO ---
  getCourseWeeks(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/timeline/course-timeline/${courseId}`);
  }

  getWeekNotes(studentId: string, courseId: string, week: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/${week}`);
  }

  saveWeekNotes(studentId: string, courseId: string, week: number, notesText: string, canvasData: string | null, backgroundUrl: string | null): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/${week}`, {
      texto_notas: notesText,
      canvas_data: canvasData,
      background_url: backgroundUrl
    });
  }

  uploadNotesBackground(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiBaseUrl}/timeline/notes/upload-bg`, formData);
  }

  getCourseSheets(studentId: string, courseId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/sheets`);
  }

  getSheetNotes(studentId: string, courseId: string, nombreHoja: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/sheet/${encodeURIComponent(nombreHoja)}`);
  }

  saveSheetNotes(studentId: string, courseId: string, nombreHoja: string, notesText: string, canvasData: string | null, backgroundUrl: string | null): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/sheet/${encodeURIComponent(nombreHoja)}`, {
      texto_notas: notesText,
      canvas_data: canvasData,
      background_url: backgroundUrl
    });
  }

  deleteSheet(studentId: string, courseId: string, nombreHoja: string): Observable<any> {
    return this.http.delete<any>(`${this.apiBaseUrl}/timeline/notes/${studentId}/${courseId}/sheet/${encodeURIComponent(nombreHoja)}`);
  }

  sendTimelineChatMessage(studentId: string, courseId: string, week: number, message: string, history: any[], nombreHoja?: string | null): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/timeline/chat`, {
      id_alumno: studentId,
      id_curso: courseId,
      semana: week,
      mensaje: message,
      historial: history,
      nombre_hoja: nombreHoja || null
    });
  }


  // Módulo 3: Evaluador Retroactivo & Repetición Espaciada
  generateQuiz(idAlumno: string, courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/evaluator/quiz/generate/${idAlumno}/${courseId}`);
  }

  logQuizFailure(idAlumno: string, courseId: string, failedTopic: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/evaluator/quiz/fail`, {
      id_alumno: idAlumno,
      id_curso: courseId,
      tema_fallado: failedTopic
    });
  }

  getWeaknesses(idAlumno: string, courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/evaluator/quiz/weaknesses/${idAlumno}/${courseId}`);
  }

  // Módulo 4: Geolocalización de Recursos & Agendamiento
  getKohaBooks(query: string, sede?: string): Observable<any> {
    const params: any = { query };
    if (sede) {
      params.sede = sede;
    }
    return this.http.get<any>(`${this.apiBaseUrl}/resources/koha/search`, { params });
  }

  getTutors(courseId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/resources/tutors/${courseId}`);
  }

  bookTutor(idAlumno: string, idProfesor: number, dia: string, hora: string): Observable<any> {
    // In the new schema, default to a Virtual/Presencial modality
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutor/book`, {
      id_alumno: idAlumno,
      id_profesor: idProfesor,
      dia,
      hora,
      id_curso: this.activeCourse()?.id_curso || 'INF02',
      modalidad: 'Presencial'
    });
  }

  // Módulo 5: Filtro Empático & OBU
  loadObuInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/wellbeing/obu/info`).pipe(
      tap(res => this.obuInfo.set(res))
    );
  }

  checkStress(message: string): Observable<any> {
    const studentData = this.student();
    return this.http.post<any>(`${this.apiBaseUrl}/wellbeing/check-stress`, {
      mensaje: message,
      correo_institucional: studentData?.correo || '',
      nombre_estudiante: studentData?.nombre || 'Estudiante'
    }).pipe(
      tap(res => {
        this.stressLevel.set(res.nivel_estres);
        if (res.nivel_estres === 'alto') {
          this.obuActive.set(true);
        }
      })
    );
  }

  requestWithdrawal(): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/wellbeing/withdrawal/verify`, {}).pipe(
      tap({
        next: (res) => {
          this.withdrawalWarning.set('');
        },
        error: (err) => {
          if (err.error && err.error.motivo) {
            this.withdrawalWarning.set(err.error.motivo);
            this.obuActive.set(true);
          }
        }
      })
    );
  }

  resetWellbeing(): void {
    this.stressLevel.set('bajo');
    this.obuActive.set(false);
    this.withdrawalWarning.set('');
  }

  // --- ADMINISTRATOR ENDPOINTS ---
  getAdminMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/admin/metrics`);
  }



  ingestMalla(cursos: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/ingesta/malla`, { cursos });
  }

  addMallaCourse(course: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/malla`, course);
  }


  updateMallaCourse(idCurso: string, course: any): Observable<any> {
    return this.http.put<any>(`${this.apiBaseUrl}/admin/malla/${idCurso}`, course);
  }

  ingestSilabo(idCurso: string, text: string, origen: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/ingesta/silabo`, {
      id_curso: idCurso,
      texto_silabo: text,
      origen: origen
    });
  }

  ingestSilaboPDF(idCurso: string, file: File, origen: string): Observable<any> {
    const formData = new FormData();
    formData.append('id_curso', idCurso);
    formData.append('file', file);
    formData.append('origen', origen);
    return this.http.post<any>(`${this.apiBaseUrl}/admin/ingesta/silabo`, formData);
  }

  getAdminAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/admin/auditoria`);
  }

  // --- DOCENTE ENDPOINTS ---
  getDocenteAppointments(idDocente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/resources/appointments/docente/${idDocente}`);
  }

  updateAppointmentStatus(idCita: number, status: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/appointments/${idCita}/status`, { estado: status });
  }

  updateAvailability(idDocente: number, slots: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutor/availability`, {
      id_docente: idDocente,
      bloques_disponibles: slots
    });
  }

  createAdmin(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/create-admin`, payload);
  }

  createDocente(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/create-docente`, payload);
  }

  ingestMallaIA(escuela: string, mallaTexto: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/malla-ia`, { escuela, malla_texto: mallaTexto });
  }

  ingestMallaIAPDF(escuela: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('escuela', escuela);
    formData.append('file', file);
    return this.http.post<any>(`${this.apiBaseUrl}/admin/malla-ia`, formData);
  }

  getMallaByEscuela(escuela: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/admin/malla/${escuela}`);
  }

  listUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/admin/users`);
  }

  toggleUserStatus(idUsuario: number, activo: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiBaseUrl}/admin/users/${idUsuario}/status`, { activo });
  }

  deleteUser(idUsuario: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBaseUrl}/admin/users/${idUsuario}`);
  }

  updateUser(idUsuario: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiBaseUrl}/admin/users/${idUsuario}`, payload);
  }

  // --- NEW TUTORING WORKFLOW API METHODS ---
  createTutoringRequest(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests`, formData);
  }

  getStudentTutoringRequests(idAlumno: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/resources/tutoring-requests`, {
      params: { id_alumno: idAlumno }
    });
  }

  joinTutoringSession(idSolicitud: number, idAlumno: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests/${idSolicitud}/join`, {
      id_alumno: idAlumno
    });
  }

  getDocenteTutoringSessions(idDocente: number): Observable<any> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/resources/docente/tutoring-sessions`, {
      params: { id_docente: idDocente.toString() }
    });
  }

  requestCancellationDocente(idSolicitud: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/docente/tutoring-sessions/${idSolicitud}/request-cancellation`, formData);
  }

  getAdminTutoringRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/admin/tutoring-requests`);
  }

  approveTutoringRequest(idSolicitud: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/tutoring-requests/${idSolicitud}/approve`, payload);
  }

  rejectTutoringRequest(idSolicitud: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/tutoring-requests/${idSolicitud}/reject`, {
      motivo_rechazo: reason
    });
  }

  resolveCancellation(idSolicitud: number, decision: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/tutoring-requests/${idSolicitud}/resolve-cancellation`, {
      decision
    });
  }

  toggleStudentSanction(idUsuario: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/admin/users/${idUsuario}/toggle-sanction`, {});
  }

  getActivityLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/admin/actividad`);
  }

  cancelTutoringRequest(idSolicitud: number, idAlumno: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests/${idSolicitud}/cancel`, {
      id_alumno: idAlumno
    });
  }

  confirmTutoringSession(idSolicitud: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests/${idSolicitud}/confirm-docente`, {});
  }

  completeTutoringSession(idSolicitud: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests/${idSolicitud}/complete`, {});
  }

  reportTutoringIncident(idSolicitud: number, reportado_por: string, tipo_reporte: string, descripcion: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/resources/tutoring-requests/${idSolicitud}/report`, {
      reportado_por,
      tipo_reporte,
      descripcion
    });
  }

  trackEvent(idAlumno: string, tipoEvento: string, metadata: any = {}): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/events/track`, {
      id_alumno: idAlumno,
      tipo_evento: tipoEvento,
      metadata: metadata
    });
  }

  getTutorQuickMessage(idAlumno: string, tipoEvento: string, idCurso: string, semana: number, metadata: any = {}): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/events/tutor/quick-message`, {
      id_alumno: idAlumno,
      tipo_evento: tipoEvento,
      id_curso: idCurso,
      semana: semana,
      metadata: metadata
    });
  }

  // --- NEW FEATURES FOR 6 CORE MODULES ---
  // 1. Copiloto de Trayectos
  generateCopilotScript(idAlumno: string, idCurso: string, tiempo: number, modalidad: string, rango: string = 'todas'): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/copilot/generate-script`, {
      id_alumno: idAlumno,
      id_curso: idCurso,
      tiempo_trayecto: tiempo,
      modalidad,
      rango
    });
  }

  verifyCopilotAnswer(idAlumno: string, idCurso: string, pregunta: string, alumnoAns: string, correctAns: string, concepto: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/copilot/verify-answer`, {
      id_alumno: idAlumno,
      id_curso: idCurso,
      pregunta_texto: pregunta,
      respuesta_alumno: alumnoAns,
      respuesta_correcta: correctAns,
      concepto_evaluado: concepto
    });
  }

  // 2. Micro-Rutas Adaptativas
  generateStudyRoute(idAlumno: string, idCurso: string, fechaLimite: string, dificultad: number, disponibilidad: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/study-routes/plan`, {
      id_alumno: idAlumno,
      id_curso: idCurso,
      fecha_limite: fechaLimite,
      nivel_dificultad: dificultad,
      disponibilidad_horas: disponibilidad
    });
  }

  getStudyRouteDashboard(idAlumno: string, idCurso: string): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/study-routes/dashboard/${idAlumno}/${idCurso}`);
  }

  toggleStudyRouteTask(idTarea: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/study-routes/tasks/${idTarea}/toggle`, {});
  }

  recalculateStudyRoute(idExamen: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/study-routes/recalculate`, { id_examen: idExamen });
  }

  // 3. Evaluador submit & explain
  submitQuizAnswer(idAlumno: string, idCurso: string, esCorrecto: boolean, tiempoRespuesta: number, sesionDuracionMinutos: number, clicksRepetitivos: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/evaluator/submit-answer`, {
      id_alumno: idAlumno,
      id_curso: idCurso,
      es_correcto: esCorrecto,
      tiempo_respuesta_segundos: tiempoRespuesta,
      sesion_duracion_minutos: sesionDuracionMinutos,
      clicks_repetitivos: clicksRepetitivos
    });
  }

  getQuizAnswerExplanation(pregunta: string, correcta: string, alumno: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/evaluator/explain`, {
      pregunta_texto: pregunta,
      respuesta_correcta: correcta,
      respuesta_alumno: alumno
    });
  }

  // 4. Banco de Preguntas Comunitario
  uploadCrowdsourcedQuestion(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/crowdsourcing/upload`, formData);
  }

  getPublishedQuestions(idCurso: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/crowdsourcing/questions/${idCurso}`);
  }

  getPendingQuestions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/crowdsourcing/questions/pending`);
  }

  moderateQuestion(idPregunta: number, action: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/crowdsourcing/questions/${idPregunta}/moderate`, { action });
  }

  // 5. Células de Estudio
  triggerMatchmaking(): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/cells/matchmaking/trigger`, {});
  }

  getStudyCellInvitations(idAlumno: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/cells/invitations/${idAlumno}`);
  }

  acceptCellInvitation(idRegistro: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/cells/invitations/${idRegistro}/accept`, {});
  }

  rejectCellInvitation(idRegistro: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/cells/invitations/${idRegistro}/reject`, {});
  }

  getActiveStudyCells(idAlumno: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/cells/active/${idAlumno}`);
  }

  // 6. Consola de Sentimiento Docente
  getDocenteSentimentDashboard(idDocente: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/docente/dashboard/${idDocente}`);
  }

  shareReinforcementResource(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/docente/share-resource`, formData);
  }
}
