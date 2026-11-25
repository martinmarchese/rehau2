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
    title: 'Perfil Sellado Co-Extruido EPDM + PP',
    productCategory: 'Automotive Exterior',
    partImageSvgType: 'automotive-bumper',
    clientName: 'Volkswagen Argentina',
    clientLogoText: 'VW',
    clientColor: '#001E50',
    salesOwner: 'Martín K.',
    engineeringOwner: 'Ing. Lucas Fernández',
    currentStage: 4,
    createdAt: '2026-10-14',
    lastPushMailDate: '2026-11-22',
    nextPushMailDaysLeft: 12,
    quarter: 'Q4 2026',
    summaryInfo: 'Burlete co-extruido con labio floculado para cabina doble en Planta Pacheco.',
    expectedAnnualVolume: 95000,
    contractYears: 5,
    expectedSalesAmountUsd: 1377500,
    estimatedInvestmentUsd: 168000,
    preCirca: {
      viabilityStatus: 'Viable',
      superficialEvaluation: 'Factible en línea L4 (Planta Pilar). Requiere cabezal tri-capa nuevo.',
      technicalNotes: 'Compuesto RAU-EPDM 70 Shore A bajo norma VW TL 52641.',
      materialFamily: 'RAU-EPDM 247 + RAU-PP 118',
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
      plantLocation: 'Planta Pilar (BA)',
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
      drawingCode: 'DRW-VW-2H6-837-431',
      moldSteelQuality: 'Acero Bohler M310 ISOPLAST (52 HRC) con recubrimiento TiN',
      guaranteedShots: '500.000 ciclos',
      leadTimeToolingWeeks: '14 semanas',
      incoterm: 'DAP Planta Pacheco',
      paymentTerms: '60 días FF',
      validityDays: 30,
      processDataSummary: 'Co-extrusión continua 18 m/min + flock electrostático y visión láser.',
      responseDaysPostStage4: 2,
      targetResponseDays: 2,
      sentToClientAt: '2026-10-23'
    },
    customerDecision: {
      status: 'En Evaluación Cliente',
      clientFeedback: 'Etapa técnica aprobada. En revisión final de compras regionales.',
      competitorBenchmark: 'Hutchinson (+7% en herramental)'
    },
    controlling: {
      evaluationStatus: 'Pendiente Win',
      commissionRatePercent: 1.8,
      approvedBonusUsd: 24795,
      financeDeliverableRef: 'FIN-CTRL-2026-PEND',
      hrPayrollPeriod: 'Diciembre 2026',
      controllingAuditor: 'Cra. Valeria Sosa',
      notes: 'Pendiente cierre comercial.'
    },
    actions: [
      {
        id: 'act-1',
        date: '2026-10-14',
        author: 'Martín K.',
        department: 'SALES Department',
        stageId: 1,
        actionType: 'Seguimiento',
        description: 'Carga de RFQ con planos 3D y volúmenes anuales.',
        completed: true
      },
      {
        id: 'act-2',
        date: '2026-10-20',
        author: 'Ing. Lucas Fernández',
        department: 'Ingeniería',
        stageId: 3,
        actionType: 'SAP Sync',
        description: 'Costeo CIRCA cargado desde SAP (#SAP-CIRCA-409182). Transfer Price: USD 9.85/u.',
        completed: true
      },
      {
        id: 'act-4',
        date: '2026-11-26',
        author: 'Martín K.',
        department: 'SALES Department',
        stageId: 4,
        actionType: 'Cliente',
        description: 'Validar precio final RENTA para emitir cotización formal.',
        completed: false
      }
    ]
  },
  {
    id: 'opp-whirlpool-gasket',
    code: 'OPP-2026-009',
    title: 'Burlete Magnético RAU-PVC No-Frost',
    productCategory: 'Appliance Sealing',
    partImageSvgType: 'fridge-gasket',
    clientName: 'Whirlpool',
    clientLogoText: 'WHR',
    clientColor: '#D97706',
    salesOwner: 'Sofía M.',
    engineeringOwner: 'Ing. Mariano Pereyra',
    currentStage: 6,
    createdAt: '2026-09-18',
    lastPushMailDate: '2026-11-18',
    nextPushMailDaysLeft: 8,
    quarter: 'Q4 2026',
    summaryInfo: 'Burletes magnéticos soldados por termofusión para nueva línea de refrigeradores.',
    expectedAnnualVolume: 140000,
    contractYears: 4,
    expectedSalesAmountUsd: 1218000,
    estimatedInvestmentUsd: 92000,
    preCirca: {
      viabilityStatus: 'Viable',
      superficialEvaluation: 'Compatible con celda de soldadura automática y extrusora Battenfeld.',
      technicalNotes: 'Fórmula RAU-PVC antibacterial validada.',
      materialFamily: 'RAU-PVC 1408 + Ferrita',
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
      plantLocation: 'Planta Pilar (BA)',
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
      drawingCode: 'DRW-WHR-W11598402',
      moldSteelQuality: 'Acero Inoxidable Stavax ESR pulido espejo',
      guaranteedShots: '600.000 marcos',
      leadTimeToolingWeeks: '9 semanas',
      incoterm: 'FCA Planta Pilar',
      paymentTerms: '45 días FF',
      validityDays: 45,
      processDataSummary: 'Extrusión multicámara + inserción de imán y termofusión a 45°.',
      responseDaysPostStage4: 1,
      targetResponseDays: 2,
      sentToClientAt: '2026-09-25'
    },
    customerDecision: {
      status: 'YES (Ganada)',
      decisionDate: '2026-10-29',
      clientFeedback: 'OC #4500918231 emitida. Adjudicado por Time-to-Market (7 días) y calidad de matriz.',
      competitorBenchmark: 'Proveedor Brasil (+6 semanas plazo)',
      winLossReason: 'Mejor Time-to-Market y propuesta técnica.'
    },
    controlling: {
      evaluationStatus: 'Comisión Aprobada',
      commissionRatePercent: 2.0,
      approvedBonusUsd: 24360,
      financeDeliverableRef: 'FIN-HR-2026-0419',
      hrPayrollPeriod: 'Noviembre 2026',
      controllingAuditor: 'Cra. Valeria Sosa',
      notes: 'Margen 32.2% verificado contra SAP CIRCA. Listo para liquidación HR / Finanzas.'
    },
    actions: [
      {
        id: 'act-w1',
        date: '2026-09-23',
        author: 'Ing. Mariano Pereyra',
        department: 'Ingeniería',
        stageId: 3,
        actionType: 'SAP Sync',
        description: 'Sincronización SAP CIRCA completada (#SAP-CIRCA-408510).',
        completed: true
      },
      {
        id: 'act-w2',
        date: '2026-10-29',
        author: 'Sofía M.',
        department: 'Customers',
        stageId: 6,
        actionType: 'Aprobación',
        description: 'Cliente adjudicó el proyecto (WIN). OC #4500918231 adjunta.',
        completed: true
      }
    ]
  }
];

