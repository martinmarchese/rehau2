export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Department = 'SALES Department' | 'Ingeniería' | 'Customers' | 'Controlling';

export interface StageDefinition {
  id: StageId;
  code: string;
  name: string;
  owner: Department;
  accentColor: 'magenta' | 'teal' | 'anthracite';
  inputDescription: string;
  formatDescription: string;
  kpiLabel: string;
  kpiTargetDays?: number;
  sapIntegration?: boolean;
  specialNotes: string[];
}

export interface FollowUpAction {
  id: string;
  date: string;
  author: string;
  department: Department;
  stageId: StageId;
  actionType: 'Seguimiento' | 'Push 15 Días' | 'SAP Sync' | 'Aprobación' | 'Cliente';
  description: string;
  completed: boolean;
}

export interface Opportunity {
  id: string;
  code: string;
  title: string;
  productCategory: string;
  partImageSvgType: 'automotive-bumper' | 'window-profile' | 'fridge-gasket' | 'industrial-hose';
  clientName: string;
  clientLogoText: string;
  clientColor: string;
  salesOwner: string;
  engineeringOwner: string;
  currentStage: StageId;
  createdAt: string;
  lastPushMailDate: string;
  nextPushMailDaysLeft: number;
  quarter: 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026';

  // Stage 1: Oportunidades (SALES)
  summaryInfo: string;
  expectedAnnualVolume: number; // units/meters per year
  contractYears: number;
  expectedSalesAmountUsd: number; // total expected annual or project revenue
  estimatedInvestmentUsd: number; // initial estimate

  // Stage 2: Pre-Circa (Ingeniería)
  preCirca: {
    viabilityStatus: 'Pendiente' | 'Viable' | 'Viable con Observaciones' | 'No Viable';
    superficialEvaluation: string;
    technicalNotes: string;
    materialFamily: string;
    sapPreProjectRef: string;
    responseDays: number;
    targetResponseDays: number;
    completedAt?: string;
  };

  // Stage 3: CIRCA (Ingeniería + SAP)
  circa: {
    sapCircaCode: string;
    sapSynced: boolean;
    productionUnitCostUsd: number; // Transfer Price base per unit
    toolingMatrixCostUsd: number; // Matriz
    machineryInvestmentUsd: number; // Maquinaria / periféricos
    cycleTimeSeconds: number;
    cavityCount: number;
    scrapRatePercent: number;
    lineCapacityUnitsPerHour: number;
    plantLocation: string;
    responseDays: number;
    targetResponseDays: number;
    completedAt?: string;
  };

  // Stage 4: RENTA (SALES Department - Auto-generated from CIRCA + Sales Input)
  renta: {
    targetSellingPriceUnitUsd: number;
    annualQuantityUnits: number;
    amortizationType: 'En Precio de Pieza' | 'Pago Directo Cliente (Upfront)' | 'Mixto 50/50';
    discountRateWaccPercent: number;
    responseDaysPostStage3: number;
    targetResponseDays: number;
    completedAt?: string;
  };

  // Stage 5: COTIZACIÓN (SALES Department - Formato moderno a cliente)
  cotizacion: {
    quoteNumber: string;
    drawingCode: string;
    moldSteelQuality: string;
    guaranteedShots: string;
    leadTimeToolingWeeks: string;
    incoterm: string;
    paymentTerms: string;
    validityDays: number;
    processDataSummary: string;
    responseDaysPostStage4: number;
    targetResponseDays: number;
    sentToClientAt?: string;
  };

  // Stage 6: YES / NO (Customers)
  customerDecision: {
    status: 'En Evaluación Cliente' | 'YES (Ganada)' | 'NO (Perdida)';
    decisionDate?: string;
    clientFeedback: string;
    competitorBenchmark?: string;
    winLossReason?: string;
  };

  // Stage 7: HR / FIN (Controlling)
  controlling: {
    evaluationStatus: 'Pendiente Win' | 'En Revisión Controlling' | 'Comisión Aprobada' | 'Liquidado HR/FIN';
    commissionRatePercent: number;
    approvedBonusUsd: number;
    financeDeliverableRef: string;
    hrPayrollPeriod: string;
    controllingAuditor: string;
    notes: string;
  };

  actions: FollowUpAction[];
}

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    code: 'ETAPA 1',
    name: 'Oportunidades',
    owner: 'SALES Department',
    accentColor: 'magenta',
    inputDescription: 'Input constante de oportunidades comerciales con foto de pieza, logo cliente, info principal, montos esperados de venta e inversión necesaria.',
    formatDescription: 'Formato clave visual: Foto técnica/pieza, logo cliente, resumen ejecutivo, volumen, venta esperada e inversión.',
    kpiLabel: 'x Oportunidades por Q (Evaluación de desempeño comercial)',
    specialNotes: [
      'Obligatoriedad: +Mails push automáticos de input por cada proyecto cada 15 días.',
      'Plus: Configuración detallada de acciones relacionadas a cada seguimiento de proyecto.'
    ]
  },
  {
    id: 2,
    code: 'ETAPA 2',
    name: 'Pre-Circa',
    owner: 'Ingeniería',
    accentColor: 'teal',
    inputDescription: 'Evaluación superficial del proyecto y análisis rápido de viabilidad técnica y productiva.',
    formatDescription: 'Formato estandarizado diseñado por Ingeniería (Checklist de factibilidad & familia de polímero).',
    kpiLabel: 'Time to Market: Respuesta de análisis en ≤ 3 días hábiles',
    kpiTargetDays: 3,
    sapIntegration: true,
    specialNotes: [
      'SAP: Ingeniería utiliza SAP para los análisis preliminares y regresa a este circuito para introducir los datos/resultados.'
    ]
  },
  {
    id: 3,
    code: 'ETAPA 3',
    name: 'CIRCA',
    owner: 'Ingeniería',
    accentColor: 'teal',
    inputDescription: 'Cálculo de costo de producción + inversión requerida (matriz, maquinaria, etc.) + parámetros generales de producción del proyecto.',
    formatDescription: 'Ficha de Costeo Técnico CIRCA diseñada por Ingeniería.',
    kpiLabel: 'Time to Market: Respuesta de análisis CIRCA en ≤ 5 días hábiles',
    kpiTargetDays: 5,
    sapIntegration: true,
    specialNotes: [
      'SAP: Ingeniería utiliza SAP para el costeo CIRCA y sincroniza Transfer Price, CAPEX de matricería y parámetros de ciclo.'
    ]
  },
  {
    id: 4,
    code: 'ETAPA 4',
    name: 'RENTA',
    owner: 'SALES Department',
    accentColor: 'magenta',
    inputDescription: 'Análisis de inversión: Transfer Price (resultante de CIRCA) + Inversión requerida (CIRCA) + Precio de venta + cantidades + ROI.',
    formatDescription: 'Archivo RENTA generado automáticamente tomando datos de CIRCA + Input Ventas (con opción de Copiar/Pegar al Excel RENTA actual).',
    kpiLabel: 'Time to Market: Análisis RENTA en ≤ 2 días post recepción de Proceso 3',
    kpiTargetDays: 2,
    specialNotes: [
      'RENTA file generado automáticamente por este proceso tomando los datos de CIRCA + Input de ventas.'
    ]
  },
  {
    id: 5,
    code: 'ETAPA 5',
    name: 'COTIZACIÓN',
    owner: 'SALES Department',
    accentColor: 'magenta',
    inputDescription: 'Propuesta técnico-comercial formal integrando precios RENTA, plano técnico, calidad de molde/matriz y parámetros de proceso.',
    formatDescription: 'Nuevo formato moderno y elegante para presentación a clientes (incluye precios, dibujo, calidad de molde/matriz, datos de proceso).',
    kpiLabel: 'Time to Market: Cotización en ≤ 2 días post recepción de Proceso 4',
    kpiTargetDays: 2,
    specialNotes: [
      'Presentación ejecutiva lista para exportar o enviar al cliente con identidad corporativa REHAU.'
    ]
  },
  {
    id: 6,
    code: 'ETAPA 6',
    name: 'YES / NO',
    owner: 'Customers',
    accentColor: 'anthracite',
    inputDescription: 'Aceptación o rechazo de la propuesta comercial por parte del cliente final.',
    formatDescription: 'Registro de decisión de cliente + motivos competitivos y generación de reporte Win/Loss.',
    kpiLabel: 'KPI: Reporte ejecutivo de Win / Loss Ratio & conversión de pipeline',
    specialNotes: [
      'Trazabilidad completa de causas de adjudicación (Win) o pérdida (Loss) para mejora continua.'
    ]
  },
  {
    id: 7,
    code: 'ETAPA 7',
    name: 'HR / FIN',
    owner: 'Controlling',
    accentColor: 'anthracite',
    inputDescription: 'Pase de proyecto ganado (Win) a evaluación financiera y liquidación de comisiones de ventas.',
    formatDescription: 'Entregable auditado a Finanzas / HR para liberación de pagos y comisiones.',
    kpiLabel: 'Conformidad Controlling & liquidación de incentivos comerciales',
    specialNotes: [
      'Cierre del circuito: Verifica margen RENTA real vs. objetivo y genera entregable para HR / Finanzas.'
    ]
  }
];

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-vw-amarok',
    code: 'OPP-2026-014',
    title: 'Perfil Sellado Co-Extruido EPDM + PP — Proyecto Pickup NextGen',
    productCategory: 'Automotive Exterior Profiles',
    partImageSvgType: 'automotive-bumper',
    clientName: 'Volkswagen Argentina',
    clientLogoText: 'VW',
    clientColor: '#001E50',
    salesOwner: 'Martín K. (Key Account Automotive)',
    engineeringOwner: 'Ing. Lucas Fernández',
    currentStage: 5,
    createdAt: '2026-10-14',
    lastPushMailDate: '2026-11-22',
    nextPushMailDaysLeft: 12,
    quarter: 'Q4 2026',
    summaryInfo: 'Desarrollo y provisión local de burlete co-extruido de alta estanqueidad con labio floculado y punteras inyectadas para cabina doble en Planta Pacheco.',
    expectedAnnualVolume: 95000,
    contractYears: 5,
    expectedSalesAmountUsd: 1377500,
    estimatedInvestmentUsd: 168000,
    preCirca: {
      viabilityStatus: 'Viable',
      superficialEvaluation: 'Factible en línea de co-extrusión L4 (Planta Pilar). Requiere cabezal tri-capa nuevo y dispositivo de corte láser en línea.',
      technicalNotes: 'Compuesto RAU-EPDM 70 Shore A homologado bajo norma VW TL 52641. Capacidad disponible en turno 2.',
      materialFamily: 'RAU-EPDM 247 + RAU-PP 118 (Co-extrusión)',
      sapPreProjectRef: 'SAP-PRE-88412',
      responseDays: 2,
      targetResponseDays: 3,
      completedAt: '2026-10-16'
    },
    circa: {
      sapCircaCode: 'SAP-CIRCA-409182',
      sapSynced: true,
      productionUnitCostUsd: 9.85,
      toolingMatrixCostUsd: 98000,
      machineryInvestmentUsd: 70000,
      cycleTimeSeconds: 18,
      cavityCount: 2,
      scrapRatePercent: 2.8,
      lineCapacityUnitsPerHour: 380,
      plantLocation: 'Planta Industrial REHAU Pilar (BA)',
      responseDays: 4,
      targetResponseDays: 5,
      completedAt: '2026-10-20'
    },
    renta: {
      targetSellingPriceUnitUsd: 14.50,
      annualQuantityUnits: 95000,
      amortizationType: 'En Precio de Pieza',
      discountRateWaccPercent: 11.5,
      responseDaysPostStage3: 1,
      targetResponseDays: 2,
      completedAt: '2026-10-21'
    },
    cotizacion: {
      quoteNumber: 'COT-REHAU-2026-089',
      drawingCode: 'DRW-VW-2H6-837-431-REV04',
      moldSteelQuality: 'Acero Bohler M310 ISOPLAST templado al vacío (52 HRC) con recubrimiento PVD TiN',
      guaranteedShots: '500.000 ciclos / 1.500.000 metros lineales garantizados',
      leadTimeToolingWeeks: '14 semanas (T0 muestras EMPB) + 4 semanas PPAP Nivel 3',
      incoterm: 'DAP Planta Gral. Pacheco (Buenos Aires)',
      paymentTerms: '60 días fecha factura / Herramental amortizado en pieza',
      validityDays: 30,
      processDataSummary: 'Co-extrusión continua 18 m/min con vulcanizado IR + aplicación automática de flock electrostático y control dimensional por visión láser.',
      responseDaysPostStage4: 2,
      targetResponseDays: 2,
      sentToClientAt: '2026-10-23'
    },
    customerDecision: {
      status: 'En Evaluación Cliente',
      clientFeedback: 'Compras Regionales VW aprobó la etapa técnica. Revisión final de mesa de compras programada para cierre de mes.',
      competitorBenchmark: 'Hutchinson / Cooper Standard (+7% más caros en herramental)'
    },
    controlling: {
      evaluationStatus: 'Pendiente Win',
      commissionRatePercent: 1.8,
      approvedBonusUsd: 24795,
      financeDeliverableRef: 'FIN-CTRL-2026-PEND',
      hrPayrollPeriod: 'Diciembre 2026',
      controllingAuditor: 'Cra. Valeria Sosa',
      notes: 'ROI proyectado supera holgadamente el umbral corporativo REHAU (28%). Listo para activar apenas ingrese OC de cliente.'
    },
    actions: [
      {
        id: 'act-1',
        date: '2026-10-14',
        author: 'Martín K.',
        department: 'SALES Department',
        stageId: 1,
        actionType: 'Seguimiento',
        description: 'Carga inicial de RFQ Volkswagen con planos 2D/3D STEP y volúmenes anuales SOP 2027.',
        completed: true
      },
      {
        id: 'act-2',
        date: '2026-10-20',
        author: 'Ing. Lucas Fernández',
        department: 'Ingeniería',
        stageId: 3,
        actionType: 'SAP Sync',
        description: 'Costeo CIRCA finalizado en SAP CO-PC (#SAP-CIRCA-409182). Transfer Price fijado en USD 9.85/u.',
        completed: true
      },
      {
        id: 'act-3',
        date: '2026-11-07',
        author: 'Sistema Push 15d',
        department: 'SALES Department',
        stageId: 5,
        actionType: 'Push 15 Días',
        description: 'Mail Push Quincenal enviado y respondido: Cliente confirmó recepción de muestras físicas de perfil.',
        completed: true
      },
      {
        id: 'act-4',
        date: '2026-11-26',
        author: 'Martín K.',
        department: 'SALES Department',
        stageId: 5,
        actionType: 'Cliente',
        description: 'Reunión presencial con Buyer de Polímeros en VW Pacheco para cierre de nominación.',
        completed: false
      }
    ]
  },
  {
    id: 'opp-whirlpool-gasket',
    code: 'OPP-2026-009',
    title: 'Burlete Magnético Antibacterial RAU-PVC — Línea Heladeras No-Frost Export',
    productCategory: 'Industrial & Appliance Sealing',
    partImageSvgType: 'fridge-gasket',
    clientName: 'Whirlpool Latinoamérica',
    clientLogoText: 'WHR',
    clientColor: '#D97706',
    salesOwner: 'Sofía M. (Industrial Solutions)',
    engineeringOwner: 'Ing. Mariano Pereyra',
    currentStage: 7,
    createdAt: '2026-09-18',
    lastPushMailDate: '2026-11-18',
    nextPushMailDaysLeft: 8,
    quarter: 'Q4 2026',
    summaryInfo: 'Provisión integral de burletes magnéticos soldados por termofusión en 4 esquinas para nueva plataforma de refrigeradores de alta eficiencia energética.',
    expectedAnnualVolume: 140000,
    contractYears: 4,
    expectedSalesAmountUsd: 1218000,
    estimatedInvestmentUsd: 92000,
    preCirca: {
      viabilityStatus: 'Viable',
      superficialEvaluation: '100% compatible con celda de soldadura automática de esquinas y extrusora Battenfeld existente.',
      technicalNotes: 'Fórmula RAU-PVC libre de ftalatos con aditivo antimicrobiano validado por laboratorio Whirlpool.',
      materialFamily: 'RAU-PVC 1408 + Banda Magnética Ferrita Anisotrópica',
      sapPreProjectRef: 'SAP-PRE-87904',
      responseDays: 2,
      targetResponseDays: 3,
      completedAt: '2026-09-20'
    },
    circa: {
      sapCircaCode: 'SAP-CIRCA-408510',
      sapSynced: true,
      productionUnitCostUsd: 5.90,
      toolingMatrixCostUsd: 54000,
      machineryInvestmentUsd: 38000,
      cycleTimeSeconds: 24,
      cavityCount: 1,
      scrapRatePercent: 1.9,
      lineCapacityUnitsPerHour: 240,
      plantLocation: 'Planta Industrial REHAU Pilar (BA)',
      responseDays: 3,
      targetResponseDays: 5,
      completedAt: '2026-09-23'
    },
    renta: {
      targetSellingPriceUnitUsd: 8.70,
      annualQuantityUnits: 140000,
      amortizationType: 'Mixto 50/50',
      discountRateWaccPercent: 11.0,
      responseDaysPostStage3: 1,
      targetResponseDays: 2,
      completedAt: '2026-09-24'
    },
    cotizacion: {
      quoteNumber: 'COT-REHAU-2026-071',
      drawingCode: 'DRW-WHR-W11598402-B',
      moldSteelQuality: 'Hilera de extrusión en Acero Inoxidable Stavax ESR pulido espejo + mordazas de soldadura CNC',
      guaranteedShots: '600.000 marcos soldados',
      leadTimeToolingWeeks: '9 semanas para muestras funcionales',
      incoterm: 'FCA Planta Pilar / Entregas Kanban semanales',
      paymentTerms: '45 días FF / 50% herramental anticipado con OC',
      validityDays: 45,
      processDataSummary: 'Extrusión de perfil multicámara + inserción automática de imán + corte a 45° y termofusión de precisión sin rebaba visible.',
      responseDaysPostStage4: 1,
      targetResponseDays: 2,
      sentToClientAt: '2026-09-25'
    },
    customerDecision: {
      status: 'YES (Ganada)',
      decisionDate: '2026-10-29',
      clientFeedback: 'Orden de Compra #4500918231 emitida. Cliente destacó velocidad de respuesta Time-to-Market (7 días totales desde RFQ a Cotización) y formato técnico claro.',
      competitorBenchmark: 'Proveedor importado Brasil (plazo de entrega 6 semanas mayor)',
      winLossReason: 'Mejor Time-to-Market, calidad de matriz Stavax y propuesta técnico-comercial superior.'
    },
    controlling: {
      evaluationStatus: 'Comisión Aprobada',
      commissionRatePercent: 2.0,
      approvedBonusUsd: 24360,
      financeDeliverableRef: 'FIN-HR-2026-0419',
      hrPayrollPeriod: 'Noviembre 2026',
      controllingAuditor: 'Cra. Valeria Sosa',
      notes: 'Proyecto WIN auditado por Controlling. Margen bruto 32.2% y Payback < 4 meses verificados contra SAP CIRCA. Entregable generado para HR / Finanzas.'
    },
    actions: [
      {
        id: 'act-w1',
        date: '2026-09-23',
        author: 'Ing. Mariano Pereyra',
        department: 'Ingeniería',
        stageId: 3,
        actionType: 'SAP Sync',
        description: 'Sincronización SAP CIRCA completada en 3 días hábiles (2 días por debajo del KPI objetivo).',
        completed: true
      },
      {
        id: 'act-w2',
        date: '2026-10-29',
        author: 'Sofía M.',
        department: 'Customers',
        stageId: 6,
        actionType: 'Aprobación',
        description: 'Cliente adjudicó el proyecto (WIN). OC #4500918231 adjunta al expediente.',
        completed: true
      },
      {
        id: 'act-w3',
        date: '2026-11-05',
        author: 'Cra. Valeria Sosa',
        department: 'Controlling',
        stageId: 7,
        actionType: 'Aprobación',
        description: 'Liquidación de comisión comercial aprobada y enviada a HR / Finanzas (#FIN-HR-2026-0419).',
        completed: true
      }
    ]
  },
  {
    id: 'opp-syngenta-geno',
    code: 'OPP-2026-019',
    title: 'Perfilería PVC RAU-FIPRO con Fibra de Vidrio — Complejo Corporativo Sustentable',
    productCategory: 'Window Solutions & Facades',
    partImageSvgType: 'window-profile',
    clientName: 'Constructora Sudamericana / Torre Catalinas',
    clientLogoText: 'CSA',
    clientColor: '#00A887',
    salesOwner: 'Diego R. (Window Solutions B2B)',
    engineeringOwner: 'Ing. Lucas Fernández',
    currentStage: 3,
    createdAt: '2026-11-12',
    lastPushMailDate: '2026-11-12',
    nextPushMailDaysLeft: 2,
    quarter: 'Q4 2026',
    summaryInfo: 'Desarrollo de matriz local para perfil acople de fachada acústica certificada LEED Platinum con refuerzo integrado RAU-FIPRO.',
    expectedAnnualVolume: 62000,
    contractYears: 3,
    expectedSalesAmountUsd: 899000,
    estimatedInvestmentUsd: 115000,
    preCirca: {
      viabilityStatus: 'Viable con Observaciones',
      superficialEvaluation: 'Viable técnicamente. Requiere calibrador de vacío refrigerado de 6 metros y foliado exterior gris antracita.',
      technicalNotes: 'Verificar disponibilidad de compuesto RAU-FIPRO en planta para lote piloto en enero.',
      materialFamily: 'RAU-FIPRO (PVC reforzado con fibra de vidrio)',
      sapPreProjectRef: 'SAP-PRE-88690',
      responseDays: 3,
      targetResponseDays: 3,
      completedAt: '2026-11-15'
    },
    circa: {
      sapCircaCode: 'SAP-CIRCA-409501',
      sapSynced: true,
      productionUnitCostUsd: 9.40,
      toolingMatrixCostUsd: 78000,
      machineryInvestmentUsd: 37000,
      cycleTimeSeconds: 30,
      cavityCount: 1,
      scrapRatePercent: 3.2,
      lineCapacityUnitsPerHour: 165,
      plantLocation: 'Planta Industrial REHAU Pilar (BA)',
      responseDays: 4,
      targetResponseDays: 5
    },
    renta: {
      targetSellingPriceUnitUsd: 14.50,
      annualQuantityUnits: 62000,
      amortizationType: 'En Precio de Pieza',
      discountRateWaccPercent: 12.0,
      responseDaysPostStage3: 1,
      targetResponseDays: 2
    },
    cotizacion: {
      quoteNumber: 'COT-REHAU-2026-095',
      drawingCode: 'DRW-WIN-GENEO-76-AR',
      moldSteelQuality: 'Acero Inoxidable 1.2316 nitrurado para alta resistencia a fibra de vidrio',
      guaranteedShots: '800.000 metros lineales',
      leadTimeToolingWeeks: '12 semanas',
      incoterm: 'DAP Obra Retiro CABA',
      paymentTerms: '30/60 días FF',
      validityDays: 30,
      processDataSummary: 'Co-extrusión con núcleo de fibra de vidrio + foliado en línea Skai Antracita.',
      responseDaysPostStage4: 1,
      targetResponseDays: 2
    },
    customerDecision: {
      status: 'En Evaluación Cliente',
      clientFeedback: 'Aguardando cierre de costeo CIRCA e ingeniería para presentar propuesta formal.'
    },
    controlling: {
      evaluationStatus: 'Pendiente Win',
      commissionRatePercent: 1.5,
      approvedBonusUsd: 13485,
      financeDeliverableRef: 'FIN-CTRL-PEND',
      hrPayrollPeriod: 'Q1 2027',
      controllingAuditor: 'Cra. Valeria Sosa',
      notes: 'En etapa técnica CIRCA.'
    },
    actions: [
      {
        id: 'act-c1',
        date: '2026-11-15',
        author: 'Ing. Lucas Fernández',
        department: 'Ingeniería',
        stageId: 2,
        actionType: 'Aprobación',
        description: 'Pre-Circa aprobado con observación sobre calibrador de vacío de 6m.',
        completed: true
      },
      {
        id: 'act-c2',
        date: '2026-11-27',
        author: 'Diego R.',
        department: 'SALES Department',
        stageId: 3,
        actionType: 'Push 15 Días',
        description: 'Próximo Push Mail automático de los 15 días programado: actualizar feedback de estudio de arquitectura.',
        completed: false
      }
    ]
  }
];

