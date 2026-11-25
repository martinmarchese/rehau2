import React, { useState, useRef, useEffect } from 'react';
import {
  INITIAL_OPPORTUNITIES,
  STAGES,
  Opportunity,
  StageId,
  Department,
  FollowUpAction
} from './data/workflowData';
import { PartBlueprintSvg } from './components/PartBlueprintSvg';
import {
  ArrowRight,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Award,
  Building2,
  Calendar,
  DollarSign,
  Check,
  AlertCircle,
  ChevronRight,
  Printer,
  BarChart3
} from 'lucide-react';

export function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [selectedOppId, setSelectedOppId] = useState<string>(INITIAL_OPPORTUNITIES[0].id);
  const [activeStageFilter, setActiveStageFilter] = useState<StageId | 'ALL'>('ALL');
  const [activeDeptFilter, setActiveDeptFilter] = useState<Department | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMainView, setActiveMainView] = useState<'circuito' | 'pipeline' | 'kpis'>('circuito');
  const [activeWorkspaceStage, setActiveWorkspaceStage] = useState<StageId>(INITIAL_OPPORTUNITIES[0].currentStage);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRenta, setCopiedRenta] = useState<boolean>(false);

  // Native <dialog> refs following modern-web-guidance `dialog` rule
  const newOppDialogRef = useRef<HTMLDialogElement>(null);
  const quotePreviewDialogRef = useRef<HTMLDialogElement>(null);

  // New Action form state
  const [newActionText, setNewActionText] = useState('');
  const [newActionType, setNewActionType] = useState<FollowUpAction['actionType']>('Seguimiento');

  // New Opportunity form state
  const [newOppForm, setNewOppForm] = useState({
    title: '',
    clientName: '',
    clientLogoText: '',
    productCategory: 'Automotive Exterior Profiles',
    partImageSvgType: 'automotive-bumper' as Opportunity['partImageSvgType'],
    salesOwner: 'Martín K. (SALES Department)',
    engineeringOwner: 'Ing. Lucas Fernández',
    summaryInfo: '',
    expectedAnnualVolume: '80000',
    contractYears: '4',
    expectedSalesAmountUsd: '960000',
    estimatedInvestmentUsd: '110000'
  });

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) || opportunities[0];

  useEffect(() => {
    if (selectedOpp) {
      setActiveWorkspaceStage(selectedOpp.currentStage);
    }
  }, [selectedOppId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  // Filtered opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesStage = activeStageFilter === 'ALL' || opp.currentStage === activeStageFilter;
    const currentStageDef = STAGES.find((s) => s.id === opp.currentStage);
    const matchesDept = activeDeptFilter === 'ALL' || currentStageDef?.owner === activeDeptFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      opp.title.toLowerCase().includes(q) ||
      opp.clientName.toLowerCase().includes(q) ||
      opp.code.toLowerCase().includes(q) ||
      opp.productCategory.toLowerCase().includes(q);
    return matchesStage && matchesDept && matchesSearch;
  });

  // Financial RENTA auto-calculations from CIRCA + Sales Input
  const calculateRentaMetrics = (opp: Opportunity) => {
    const transferPrice = opp.circa.productionUnitCostUsd;
    const totalCapex = opp.circa.toolingMatrixCostUsd + opp.circa.machineryInvestmentUsd;
    const sellingPrice = opp.renta.targetSellingPriceUnitUsd;
    const annualQty = opp.renta.annualQuantityUnits;
    const years = opp.contractYears;

    const unitMarginUsd = sellingPrice - transferPrice;
    const grossMarginPercent = sellingPrice > 0 ? (unitMarginUsd / sellingPrice) * 100 : 0;
    const annualRevenueUsd = sellingPrice * annualQty;
    const lifetimeRevenueUsd = annualRevenueUsd * years;
    const annualGrossProfitUsd = unitMarginUsd * annualQty;
    const lifetimeNetContributionUsd = annualGrossProfitUsd * years - totalCapex;
    const roiPercent = totalCapex > 0 ? (lifetimeNetContributionUsd / totalCapex) * 100 : 0;
    const paybackMonths = annualGrossProfitUsd > 0 ? (totalCapex / annualGrossProfitUsd) * 12 : 0;

    return {
      transferPrice,
      totalCapex,
      sellingPrice,
      annualQty,
      unitMarginUsd,
      grossMarginPercent,
      annualRevenueUsd,
      lifetimeRevenueUsd,
      annualGrossProfitUsd,
      lifetimeNetContributionUsd,
      roiPercent,
      paybackMonths
    };
  };

  const rentaMetrics = calculateRentaMetrics(selectedOpp);

  // Update opportunity helper
  const updateSelectedOpp = (updater: (opp: Opportunity) => Opportunity) => {
    setOpportunities((prev) => prev.map((o) => (o.id === selectedOpp.id ? updater(o) : o)));
  };

  // Advance or change current stage of opportunity
  const handleAdvanceStage = (targetStage: StageId) => {
    const targetDef = STAGES.find((s) => s.id === targetStage);
    updateSelectedOpp((opp) => ({
      ...opp,
      currentStage: targetStage,
      actions: [
        {
          id: `act-${Date.now()}`,
          date: '2026-11-25',
          author: targetDef?.owner === 'Ingeniería' ? opp.engineeringOwner : opp.salesOwner,
          department: targetDef?.owner || 'SALES Department',
          stageId: targetStage,
          actionType: 'Aprobación',
          description: `Proyecto avanzado a Etapa ${targetStage}: ${targetDef?.name} (${targetDef?.owner}).`,
          completed: true
        },
        ...opp.actions
      ]
    }));
    setActiveWorkspaceStage(targetStage);
    showToast(`Proyecto ${selectedOpp.code} actualizado a Etapa ${targetStage}: ${targetDef?.name}`);
  };

  // Trigger 15-day Push Email reminder simulation
  const handleSend15DayPushMail = () => {
    updateSelectedOpp((opp) => ({
      ...opp,
      lastPushMailDate: '2026-11-25',
      nextPushMailDaysLeft: 15,
      actions: [
        {
          id: `push-${Date.now()}`,
          date: '2026-11-25',
          author: 'Bot Obligatoriedad 15d',
          department: 'SALES Department',
          stageId: opp.currentStage,
          actionType: 'Push 15 Días',
          description: `Mail Push Quincenal disparado a ${opp.salesOwner} y ${opp.engineeringOwner} solicitando actualización obligatoria de input.`,
          completed: true
        },
        ...opp.actions
      ]
    }));
    showToast(`Mail Push de 15 días enviado para ${selectedOpp.code} (${selectedOpp.clientName})`);
  };

  // Simulate SAP CIRCA Sync
  const handleSapSync = () => {
    const newSapCode = `SAP-CIRCA-${Math.floor(409600 + Math.random() * 900)}`;
    updateSelectedOpp((opp) => ({
      ...opp,
      circa: {
        ...opp.circa,
        sapSynced: true,
        sapCircaCode: opp.circa.sapCircaCode || newSapCode
      },
      actions: [
        {
          id: `sap-${Date.now()}`,
          date: '2026-11-25',
          author: opp.engineeringOwner,
          department: 'Ingeniería',
          stageId: 3,
          actionType: 'SAP Sync',
          description: `Datos de costeo CIRCA sincronizados desde SAP CO-PC (${opp.circa.sapCircaCode}). Transfer Price: USD ${opp.circa.productionUnitCostUsd.toFixed(2)}/u.`,
          completed: true
        },
        ...opp.actions
      ]
    }));
    showToast(`Sincronización SAP CIRCA completada (${selectedOpp.circa.sapCircaCode})`);
  };

  // Copy RENTA table to clipboard (Formato: Archivo RENTA actual - Copiar/pegar)
  const handleCopyRentaForExcel = () => {
    const tsv = [
      ['REHAU RENTA FILE - AUTO-GENERATED FROM CIRCA', selectedOpp.code],
      ['Cliente', selectedOpp.clientName],
      ['Proyecto', selectedOpp.title],
      ['SAP CIRCA Ref', selectedOpp.circa.sapCircaCode],
      ['Transfer Price (Costo Producción CIRCA USD/u)', rentaMetrics.transferPrice.toFixed(2)],
      ['Inversión Matriz (USD)', selectedOpp.circa.toolingMatrixCostUsd.toString()],
      ['Inversión Maquinaria (USD)', selectedOpp.circa.machineryInvestmentUsd.toString()],
      ['Inversión Total CAPEX (USD)', rentaMetrics.totalCapex.toString()],
      ['Precio Venta Target (USD/u)', rentaMetrics.sellingPrice.toFixed(2)],
      ['Volumen Anual (Unidades)', rentaMetrics.annualQty.toString()],
      ['Plazo Contrato (Años)', selectedOpp.contractYears.toString()],
      ['Venta Anual Esperada (USD)', rentaMetrics.annualRevenueUsd.toFixed(2)],
      ['Margen Bruto (%)', `${rentaMetrics.grossMarginPercent.toFixed(1)}%`],
      ['ROI Proyecto (%)', `${rentaMetrics.roiPercent.toFixed(1)}%`],
      ['Payback (Meses)', rentaMetrics.paybackMonths.toFixed(1)]
    ]
      .map((row) => row.join('\t'))
      .join('\n');

    navigator.clipboard.writeText(tsv);
    setCopiedRenta(true);
    showToast('Tabla RENTA copiada en formato TSV lista para pegar en Excel RENTA actual');
    setTimeout(() => setCopiedRenta(false), 3000);
  };

  // Add follow-up action
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;
    const stageDef = STAGES.find((s) => s.id === activeWorkspaceStage);
    updateSelectedOpp((opp) => ({
      ...opp,
      actions: [
        {
          id: `act-${Date.now()}`,
          date: '2026-11-25',
          author: stageDef?.owner === 'Ingeniería' ? opp.engineeringOwner : opp.salesOwner,
          department: stageDef?.owner || 'SALES Department',
          stageId: activeWorkspaceStage,
          actionType: newActionType,
          description: newActionText.trim(),
          completed: false
        },
        ...opp.actions
      ]
    }));
    setNewActionText('');
    showToast('Acción de seguimiento registrada en el circuito');
  };

  // Toggle action completion
  const toggleActionCompleted = (actionId: string) => {
    updateSelectedOpp((opp) => ({
      ...opp,
      actions: opp.actions.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a))
    }));
  };

  // Create new opportunity (Stage 1 Input)
  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    const vol = Number(newOppForm.expectedAnnualVolume) || 50000;
    const years = Number(newOppForm.contractYears) || 4;
    const salesUsd = Number(newOppForm.expectedSalesAmountUsd) || 750000;
    const invUsd = Number(newOppForm.estimatedInvestmentUsd) || 95000;
    const unitSellingPrice = vol > 0 ? Number((salesUsd / vol).toFixed(2)) : 12.5;
    const unitTransferCost = Number((unitSellingPrice * 0.68).toFixed(2));

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      code: `OPP-2026-0${opportunities.length + 21}`,
      title: newOppForm.title || 'Nuevo Desarrollo Perfil Técnico REHAU',
      productCategory: newOppForm.productCategory,
      partImageSvgType: newOppForm.partImageSvgType,
      clientName: newOppForm.clientName || 'Cliente Industrial SA',
      clientLogoText:
        newOppForm.clientLogoText.toUpperCase() ||
        (newOppForm.clientName ? newOppForm.clientName.slice(0, 3).toUpperCase() : 'CLI'),
      clientColor: '#00A887',
      salesOwner: newOppForm.salesOwner,
      engineeringOwner: newOppForm.engineeringOwner,
      currentStage: 1,
      createdAt: '2026-11-25',
      lastPushMailDate: '2026-11-25',
      nextPushMailDaysLeft: 15,
      quarter: 'Q4 2026',
      summaryInfo:
        newOppForm.summaryInfo ||
        'Requerimiento técnico ingresado por SALES Department con plano preliminar, volúmenes estimados y objetivo de inversión.',
      expectedAnnualVolume: vol,
      contractYears: years,
      expectedSalesAmountUsd: salesUsd,
      estimatedInvestmentUsd: invUsd,
      preCirca: {
        viabilityStatus: 'Pendiente',
        superficialEvaluation: 'Pendiente de evaluación preliminar por Ingeniería.',
        technicalNotes: 'A definir línea de extrusión/inyección y compuesto.',
        materialFamily: 'RAU-Polímero Técnico (A definir)',
        sapPreProjectRef: `SAP-PRE-${Math.floor(88900 + Math.random() * 500)}`,
        responseDays: 1,
        targetResponseDays: 3
      },
      circa: {
        sapCircaCode: `SAP-CIRCA-${Math.floor(409700 + Math.random() * 500)}`,
        sapSynced: false,
        productionUnitCostUsd: unitTransferCost,
        toolingMatrixCostUsd: Math.round(invUsd * 0.65),
        machineryInvestmentUsd: Math.round(invUsd * 0.35),
        cycleTimeSeconds: 20,
        cavityCount: 1,
        scrapRatePercent: 2.5,
        lineCapacityUnitsPerHour: 250,
        plantLocation: 'Planta Industrial REHAU Pilar (BA)',
        responseDays: 0,
        targetResponseDays: 5
      },
      renta: {
        targetSellingPriceUnitUsd: unitSellingPrice,
        annualQuantityUnits: vol,
        amortizationType: 'En Precio de Pieza',
        discountRateWaccPercent: 11.5,
        responseDaysPostStage3: 0,
        targetResponseDays: 2
      },
      cotizacion: {
        quoteNumber: `COT-REHAU-2026-10${opportunities.length + 1}`,
        drawingCode: 'DRW-REHAU-NEW-001',
        moldSteelQuality: 'Acero Bohler M310 / Stavax ESR templado',
        guaranteedShots: '500.000 ciclos garantizados',
        leadTimeToolingWeeks: '12 semanas',
        incoterm: 'DAP Planta Cliente',
        paymentTerms: '45 días fecha factura',
        validityDays: 30,
        processDataSummary: 'Extrusión / Co-extrusión con control dimensional láser.',
        responseDaysPostStage4: 0,
        targetResponseDays: 2
      },
      customerDecision: {
        status: 'En Evaluación Cliente',
        clientFeedback: 'Proyecto en etapa inicial del flujo CIRCA + RENTA.'
      },
      controlling: {
        evaluationStatus: 'Pendiente Win',
        commissionRatePercent: 1.8,
        approvedBonusUsd: Math.round(salesUsd * 0.018),
        financeDeliverableRef: 'FIN-CTRL-PEND',
        hrPayrollPeriod: 'Q1 2027',
        controllingAuditor: 'Cra. Valeria Sosa',
        notes: 'Aguardando avance del circuito.'
      },
      actions: [
        {
          id: `act-init-${Date.now()}`,
          date: '2026-11-25',
          author: newOppForm.salesOwner,
          department: 'SALES Department',
          stageId: 1,
          actionType: 'Seguimiento',
          description: 'Alta de oportunidad comercial en Etapa 1 con foto/CAD, logo de cliente, venta esperada e inversión.',
          completed: true
        }
      ]
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    setSelectedOppId(newOpp.id);
    setActiveWorkspaceStage(1);
    newOppDialogRef.current?.close();
    showToast(`Nueva oportunidad ${newOpp.code} creada e ingresada en Etapa 1`);
  };

  // Global KPI summaries
  const totalPipelineSalesUsd = opportunities.reduce((acc, o) => acc + o.expectedSalesAmountUsd, 0);
  const totalInvestmentUsd = opportunities.reduce(
    (acc, o) => acc + (o.circa.toolingMatrixCostUsd + o.circa.machineryInvestmentUsd),
    0
  );
  const avgTimeToMarketDays = (
    opportunities.reduce(
      (acc, o) =>
        acc +
        o.preCirca.responseDays +
        o.circa.responseDays +
        o.renta.responseDaysPostStage3 +
        o.cotizacion.responseDaysPostStage4,
      0
    ) / opportunities.length
  ).toFixed(1);
  const wonCount = opportunities.filter((o) => o.customerDecision.status === 'YES (Ganada)').length;

  const getBadgeStyleForAccent = (accent: 'magenta' | 'teal' | 'anthracite', active: boolean) => {
    if (accent === 'magenta') {
      return active
        ? 'bg-[#E20074] text-white border-[#E20074] shadow-sm'
        : 'bg-[#E20074]/8 text-[#E20074] border-[#E20074]/25 hover:bg-[#E20074]/15';
    }
    if (accent === 'teal') {
      return active
        ? 'bg-[#00A887] text-white border-[#00A887] shadow-sm'
        : 'bg-[#00A887]/10 text-[#00856B] border-[#00A887]/30 hover:bg-[#00A887]/18';
    }
    return active
      ? 'bg-[#3B3D3F] text-white border-[#3B3D3F] shadow-sm'
      : 'bg-slate-100 text-[#3B3D3F] border-slate-300 hover:bg-slate-200/70';
  };

  // Stage ordering for the top visual U-flow diagram (1 -> 2 -> 3 on top row, 7 <- 6 <- 5 <- 4 on bottom row, just like the Excel!)
  const topRowStages = STAGES.filter((s) => s.id <= 3);
  const bottomRowStages = [...STAGES.filter((s) => s.id >= 4)].reverse(); // 7, 6, 5, 4

  const activeStageDef = STAGES.find((s) => s.id === activeWorkspaceStage) || STAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Subtle Top REHAU Brand Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#00A887] via-[#3B3D3F] to-[#E20074]" />

      {/* Corporate Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <img
              src="/rehau-logo-cropped.png"
              alt="REHAU Logo"
              className="h-10 sm:h-11 w-auto object-contain select-none"
            />
            <div className="hidden md:block h-8 w-px bg-slate-200" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00A887] bg-[#00A887]/10 px-2.5 py-0.5 rounded-full">
                  CIRCA + RENTA
                </span>
                <span className="text-xs font-medium text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">SAP & Sales CRM Circuit</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#3B3D3F] tracking-tight">
                Gestión de Oportunidades, Ingeniería CIRCA & Rentabilidad
              </h1>
            </div>
          </div>

          {/* Primary Navigation Switcher */}
          <nav aria-label="Vistas principales del CRM" className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveMainView('circuito')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainView === 'circuito'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-[#E20074]" />
              <span>Circuito 1–7</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainView('pipeline')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainView === 'pipeline'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00A887]" />
              <span>Matriz & RENTA</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainView('kpis')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainView === 'kpis'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#3B3D3F]" />
              <span>KPIs & Win/Loss</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSend15DayPushMail}
              title="Disparar recordatorio obligatorio cada 15 días"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-[#00A887] hover:text-[#00856B] transition-all shadow-2xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#00A887]" />
              <span>Push 15 Días</span>
              <span className="px-1.5 py-0.2 bg-[#00A887]/15 text-[#00856B] rounded-md font-bold">
                {selectedOpp.nextPushMailDaysLeft}d
              </span>
            </button>

            <button
              type="button"
              onClick={() => newOppDialogRef.current?.showModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#E20074] hover:bg-[#c80066] active:scale-[0.99] transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Oportunidad</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-md bg-[#3B3D3F] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[#4EB99F] shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Executive Summary Ribbon */}
        <section aria-label="Resumen de indicadores clave" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                KPI Ventas (Q4 2026)
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">{opportunities.length} / 4</span>
                <span className="text-xs font-semibold text-[#E20074] bg-[#E20074]/10 px-2 py-0.5 rounded-full">
                  Oportunidades / Q
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pipeline Anual: <strong className="text-slate-700">USD {(totalPipelineSalesUsd / 1e6).toFixed(2)}M</strong>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#E20074]/10 flex items-center justify-center text-[#E20074]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                KPI Time to Market
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">{avgTimeToMarketDays} días</span>
                <span className="text-xs font-semibold text-[#00856B] bg-[#00A887]/12 px-2 py-0.5 rounded-full">
                  Meta ≤ 12 días
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pre-Circa + CIRCA (SAP) + RENTA + Cotización
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#00A887]/12 flex items-center justify-center text-[#00856B]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                CAPEX & SAP CIRCA
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  USD {(totalInvestmentUsd / 1000).toFixed(0)}k
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Matriz + Maq.
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                100% proyectos vinculados con SAP CO-PC
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-[#3B3D3F]">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Obligatoriedad Push 15d
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">Activo</span>
                <span className="text-xs font-semibold text-[#00856B] bg-[#00A887]/12 px-2 py-0.5 rounded-full">
                  {wonCount} WIN Auditado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Último push: {selectedOpp.lastPushMailDate} • Próx: {selectedOpp.nextPushMailDaysLeft} días
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#E20074]/10 flex items-center justify-center text-[#E20074]">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Interactive Process Map (Mirrors the exact U-shaped 1->2->3 / 7<-6<-5<-4 flow from Flujo IA.xlsx) */}
        <section
          aria-label="Mapa interactivo del flujo CIRCA + RENTA"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E20074]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B3D3F]">
                  Flujo del Proceso CIRCA + RENTA (Circuito Oficial 1 → 7)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hacé clic en cualquier etapa del circuito para inspeccionar o cargar datos de{' '}
                <strong className="text-slate-800">{selectedOpp.code} — {selectedOpp.clientName}</strong>
              </p>
            </div>

            {/* Department Legend */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E20074]/10 text-[#E20074] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E20074]" />
                SALES Department (1, 4, 5)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00A887]/12 text-[#00856B] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00A887]" />
                Ingeniería + SAP (2, 3)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[#3B3D3F] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#3B3D3F]" />
                Customers & Controlling (6, 7)
              </span>
            </div>
          </div>

          {/* Row 1: Stages 1 -> 2 -> 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative">
            {topRowStages.map((stage, idx) => {
              const isCurrentOppStage = selectedOpp.currentStage === stage.id;
              const isCompletedStage = selectedOpp.currentStage > stage.id;
              const isSelectedWorkspace = activeWorkspaceStage === stage.id;

              return (
                <div key={stage.id} className="relative flex items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceStage(stage.id);
                      setActiveMainView('circuito');
                    }}
                    className={`w-full text-left rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelectedWorkspace
                        ? stage.accentColor === 'magenta'
                          ? 'border-[#E20074] bg-[#E20074]/[0.03] ring-2 ring-[#E20074]/20'
                          : 'border-[#00A887] bg-[#00A887]/[0.04] ring-2 ring-[#00A887]/20'
                        : 'border-slate-200/90 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getBadgeStyleForAccent(
                            stage.accentColor,
                            isCurrentOppStage
                          )}`}
                        >
                          {stage.id}. {stage.name.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {stage.sapIntegration && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                              SAP
                            </span>
                          )}
                          {isCompletedStage ? (
                            <CheckCircle2 className="w-4 h-4 text-[#00A887]" />
                          ) : isCurrentOppStage ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E20074]">
                              <span className="w-2 h-2 rounded-full bg-[#E20074] animate-ping" />
                              Actual
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-700 mt-2">
                        Quienes: <span className="font-semibold text-slate-900">{stage.owner}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{stage.inputDescription}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500 truncate">{stage.kpiLabel}</span>
                      {idx < 2 && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden md:block" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Turnaround connector from Stage 3 (top right) down to Stage 4 (bottom right) */}
          <div className="hidden md:flex justify-end pr-16 my-1.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#00856B] bg-[#00A887]/10 px-3 py-1 rounded-full border border-[#00A887]/25">
              <span>SAP CIRCA Output → Alimenta archivo RENTA automático (Etapa 4)</span>
              <span>↓</span>
            </div>
          </div>

          {/* Row 2: Stages 7 <- 6 <- 5 <- 4 (Mirrors Excel layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3 md:mt-0">
            {bottomRowStages.map((stage) => {
              const isCurrentOppStage = selectedOpp.currentStage === stage.id;
              const isCompletedStage = selectedOpp.currentStage > stage.id;
              const isSelectedWorkspace = activeWorkspaceStage === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setActiveWorkspaceStage(stage.id);
                    setActiveMainView('circuito');
                  }}
                  className={`w-full text-left rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelectedWorkspace
                      ? stage.accentColor === 'magenta'
                        ? 'border-[#E20074] bg-[#E20074]/[0.03] ring-2 ring-[#E20074]/20'
                        : 'border-[#3B3D3F] bg-slate-50 ring-2 ring-slate-400/30'
                      : 'border-slate-200/90 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getBadgeStyleForAccent(
                          stage.accentColor,
                          isCurrentOppStage
                        )}`}
                      >
                        {stage.id}. {stage.name.toUpperCase()}
                      </span>
                      {isCompletedStage ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00A887]" />
                      ) : isCurrentOppStage ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E20074]">
                          <span className="w-2 h-2 rounded-full bg-[#E20074] animate-ping" />
                          Actual
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs font-bold text-slate-700 mt-2">
                      Quienes: <span className="font-semibold text-slate-900">{stage.owner}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{stage.inputDescription}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden lg:block" />
                    <span className="font-semibold text-slate-500 truncate">{stage.kpiLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* VIEW 1: CIRCUITO 1-7 WORKSPACE */}
        {activeMainView === 'circuito' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Opportunities List (Col 4) */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#3B3D3F] uppercase tracking-wider">
                    Oportunidades Activas ({filteredOpportunities.length})
                  </h3>
                  <span className="text-xs font-semibold text-[#00856B] bg-[#00A887]/10 px-2.5 py-0.5 rounded-full">
                    Input Constante
                  </span>
                </div>

                {/* Search & Filters wrapped in <search> per Modern Web Guidance `forms` */}
                <search className="space-y-2.5 mb-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      id="opp-search"
                      name="opp-search"
                      aria-label="Buscar oportunidad por cliente, código o producto"
                      placeholder="Buscar cliente, código o perfil..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#E20074] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Filtrar por etapa"
                      value={activeStageFilter}
                      onChange={(e) =>
                        setActiveStageFilter(e.target.value === 'ALL' ? 'ALL' : (Number(e.target.value) as StageId))
                      }
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                    >
                      <option value="ALL">Todas las Etapas (1–7)</option>
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          Etapa {s.id}: {s.name}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Filtrar por departamento"
                      value={activeDeptFilter}
                      onChange={(e) => setActiveDeptFilter(e.target.value as Department | 'ALL')}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
                    >
                      <option value="ALL">Todos los Deptos.</option>
                      <option value="SALES Department">SALES Department</option>
                      <option value="Ingeniería">Ingeniería</option>
                      <option value="Customers">Customers</option>
                      <option value="Controlling">Controlling</option>
                    </select>
                  </div>
                </search>

                {/* Opportunity Cards (Formato es clave: Foto, logo cliente, info ppal, montos esperados de venta, inversion necesaria) */}
                <div className="space-y-3">
                  {filteredOpportunities.map((opp) => {
                    const isSelected = opp.id === selectedOpp.id;
                    const stageObj = STAGES.find((s) => s.id === opp.currentStage)!;
                    const oppRenta = calculateRentaMetrics(opp);

                    return (
                      <div
                        key={opp.id}
                        onClick={() => setSelectedOppId(opp.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedOppId(opp.id);
                          }
                        }}
                        className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#E20074] bg-white shadow-md ring-2 ring-[#E20074]/15'
                            : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Top row: Client Logo Badge + Stage Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-2xs"
                              style={{ backgroundColor: opp.clientColor }}
                            >
                              {opp.clientLogoText}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-400">{opp.code}</span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  {opp.quarter}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 truncate">{opp.clientName}</p>
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${getBadgeStyleForAccent(
                              stageObj.accentColor,
                              isSelected
                            )}`}
                          >
                            {opp.currentStage}. {stageObj.name}
                          </span>
                        </div>

                        {/* Visual CAD / Part Photo Preview (Formato es clave: Foto) */}
                        <PartBlueprintSvg type={opp.partImageSvgType} className="w-full h-24 mb-2.5" />

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
                          {opp.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{opp.summaryInfo}</p>

                        {/* Key Financial Metrics Grid (Montos esperados de venta, inversión necesaria, ROI) */}
                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200/70 text-center">
                          <div className="bg-slate-50 rounded-lg p-1.5">
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                              Venta Anual
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              ${(opp.expectedSalesAmountUsd / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5">
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                              Inversión
                            </span>
                            <span className="text-xs font-extrabold text-[#00856B]">
                              ${(oppRenta.totalCapex / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5">
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                              ROI RENTA
                            </span>
                            <span className="text-xs font-extrabold text-[#E20074]">
                              {oppRenta.roiPercent.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right Workspace: Selected Opportunity & Active Stage Deep-Dive (Col 8) */}
            <section className="lg:col-span-8 space-y-5">
              {/* Opportunity Master Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-xs"
                      style={{ backgroundColor: selectedOpp.clientColor }}
                    >
                      {selectedOpp.clientLogoText}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#E20074] bg-[#E20074]/10 px-2.5 py-0.5 rounded-md">
                          {selectedOpp.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {selectedOpp.productCategory}
                        </span>
                        <span className="text-xs font-semibold text-[#00856B] bg-[#00A887]/10 px-2.5 py-0.5 rounded-md">
                          Etapa Actual: {selectedOpp.currentStage} ({STAGES[selectedOpp.currentStage - 1].name})
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                        {selectedOpp.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cliente: <strong className="text-slate-800">{selectedOpp.clientName}</strong> • Ventas:{' '}
                        <strong className="text-slate-700">{selectedOpp.salesOwner}</strong> • Ingeniería:{' '}
                        <strong className="text-slate-700">{selectedOpp.engineeringOwner}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Advance Stage Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedOpp.currentStage > 1 && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStage((selectedOpp.currentStage - 1) as StageId)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        ← Etapa Anterior
                      </button>
                    )}
                    {selectedOpp.currentStage < 7 && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStage((selectedOpp.currentStage + 1) as StageId)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00A887] hover:bg-[#008f73] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Avanzar a Etapa {selectedOpp.currentStage + 1}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stage Selector Tabs inside Workspace */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1">
                  {STAGES.map((stage) => {
                    const active = activeWorkspaceStage === stage.id;
                    const isCurrent = selectedOpp.currentStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setActiveWorkspaceStage(stage.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                          active
                            ? stage.accentColor === 'magenta'
                              ? 'bg-[#E20074] text-white border-[#E20074] shadow-xs'
                              : stage.accentColor === 'teal'
                              ? 'bg-[#00A887] text-white border-[#00A887] shadow-xs'
                              : 'bg-[#3B3D3F] text-white border-[#3B3D3F] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>
                          {stage.id}. {stage.name}
                        </span>
                        {isCurrent && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              active ? 'bg-white' : 'bg-[#E20074]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Stage Detail Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
                {/* Stage Banner Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md border ${getBadgeStyleForAccent(
                          activeStageDef.accentColor,
                          true
                        )}`}
                      >
                        PROCESO {activeStageDef.id}: {activeStageDef.name.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Responsable: {activeStageDef.owner}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5">{activeStageDef.inputDescription}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>Formato requerido:</strong> {activeStageDef.formatDescription}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="inline-block text-[11px] font-bold text-[#00856B] bg-[#00A887]/12 px-3 py-1 rounded-lg border border-[#00A887]/25">
                      {activeStageDef.kpiLabel}
                    </span>
                  </div>
                </div>

                {/* STAGE 1 CONTENT: OPORTUNIDADES (SALES) */}
                {activeWorkspaceStage === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#E20074]">
                          Formato Clave: Pieza / CAD & Cliente
                        </h4>
                        <PartBlueprintSvg type={selectedOpp.partImageSvgType} className="w-full h-36" />
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500">Logo / Identidad Cliente:</span>
                          <span className="font-bold text-slate-800">
                            {selectedOpp.clientName} ({selectedOpp.clientLogoText})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Categoría REHAU:</span>
                          <span className="font-semibold text-slate-800">{selectedOpp.productCategory}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#E20074]">
                          Info Principal, Montos Esperados e Inversión
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                          {selectedOpp.summaryInfo}
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[11px] text-slate-500 block">Monto Esperado Venta</span>
                            <span className="text-base font-extrabold text-slate-900">
                              USD {selectedOpp.expectedSalesAmountUsd.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">por año</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[11px] text-slate-500 block">Inversión Necesaria Est.</span>
                            <span className="text-base font-extrabold text-[#00856B]">
                              USD {selectedOpp.estimatedInvestmentUsd.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Matriz + herramental</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[11px] text-slate-500 block">Volumen Anual</span>
                            <span className="text-sm font-bold text-slate-800">
                              {selectedOpp.expectedAnnualVolume.toLocaleString()} u/año
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                            <span className="text-[11px] text-slate-500 block">Horizonte Proyecto</span>
                            <span className="text-sm font-bold text-slate-800">
                              {selectedOpp.contractYears} años
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Obligatoriedad Push 15 days box */}
                    <div className="p-4 rounded-xl bg-[#E20074]/[0.04] border border-[#E20074]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-[#E20074] shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">
                            Obligatoriedad: +Mails Push de Input cada 15 días
                          </h5>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Último envío: <strong>{selectedOpp.lastPushMailDate}</strong> • Próximo push automático en{' '}
                            <strong className="text-[#E20074]">{selectedOpp.nextPushMailDaysLeft} días</strong>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSend15DayPushMail}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#E20074] hover:bg-[#c80066] transition-all shrink-0 cursor-pointer"
                      >
                        Enviar Push Mail Ahora
                      </button>
                    </div>
                  </div>
                )}

                {/* STAGE 2 CONTENT: PRE-CIRCA (INGENIERÍA) */}
                {activeWorkspaceStage === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#00A887]/[0.05] border border-[#00A887]/25">
                        <span className="text-[11px] font-bold uppercase text-[#00856B]">
                          Estado de Viabilidad
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            aria-label="Cambiar estado de viabilidad Pre-Circa"
                            value={selectedOpp.preCirca.viabilityStatus}
                            onChange={(e) =>
                              updateSelectedOpp((o) => ({
                                ...o,
                                preCirca: {
                                  ...o.preCirca,
                                  viabilityStatus: e.target.value as Opportunity['preCirca']['viabilityStatus']
                                }
                              }))
                            }
                            className="w-full text-xs font-bold bg-white border border-[#00A887]/40 rounded-lg px-3 py-2 text-slate-900"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Viable">Viable</option>
                            <option value="Viable con Observaciones">Viable con Observaciones</option>
                            <option value="No Viable">No Viable</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold uppercase text-slate-400">
                          Referencia Preliminar SAP
                        </span>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">
                          {selectedOpp.preCirca.sapPreProjectRef}
                        </p>
                        <span className="text-[11px] text-slate-500">Polímero: {selectedOpp.preCirca.materialFamily}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold uppercase text-slate-400">
                          KPI Time to Market (Etapa 2)
                        </span>
                        <p className="text-sm font-extrabold text-[#00856B] mt-1">
                          Respondido en {selectedOpp.preCirca.responseDays} días
                        </p>
                        <span className="text-[11px] text-slate-500">
                          Meta parámetro evaluación: ≤ {selectedOpp.preCirca.targetResponseDays} días
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                        <label
                          htmlFor="precirca-eval"
                          className="block text-xs font-bold text-slate-700 uppercase"
                        >
                          Evaluación Superficial del Proyecto (Ingeniería)
                        </label>
                        <textarea
                          id="precirca-eval"
                          rows={3}
                          value={selectedOpp.preCirca.superficialEvaluation}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              preCirca: { ...o.preCirca, superficialEvaluation: e.target.value }
                            }))
                          }
                          className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:border-[#00A887] focus:outline-none"
                        />
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                        <label
                          htmlFor="precirca-notes"
                          className="block text-xs font-bold text-slate-700 uppercase"
                        >
                          Notas de Factibilidad & Homologación Compuesto
                        </label>
                        <textarea
                          id="precirca-notes"
                          rows={3}
                          value={selectedOpp.preCirca.technicalNotes}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              preCirca: { ...o.preCirca, technicalNotes: e.target.value }
                            }))
                          }
                          className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:border-[#00A887] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 3 CONTENT: CIRCA (INGENIERÍA + SAP) */}
                {activeWorkspaceStage === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-[#4EB99F]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#4EB99F]">
                              Conexión SAP CIRCA (CO-PC)
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 font-mono">
                              {selectedOpp.circa.sapCircaCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Ingeniería realiza el análisis en SAP e introduce los resultados aquí para alimentar RENTA automáticamente.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSapSync}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00A887] hover:bg-[#008f73] text-white flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sincronizar desde SAP</span>
                      </button>
                    </div>

                    {/* Editable CIRCA Engineering Costing Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <label
                          htmlFor="circa-unit-cost"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Costo Producción Unitario (Transfer Price USD)
                        </label>
                        <input
                          id="circa-unit-cost"
                          type="number"
                          step="0.05"
                          value={selectedOpp.circa.productionUnitCostUsd}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              circa: {
                                ...o.circa,
                                productionUnitCostUsd: Number(e.target.value) || 0
                              }
                            }))
                          }
                          className="mt-2 w-full text-base font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Pasa automáticamente a Proceso 4 (RENTA)
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <label
                          htmlFor="circa-tooling"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Inversión Matriz / Hilera (USD)
                        </label>
                        <input
                          id="circa-tooling"
                          type="number"
                          step="1000"
                          value={selectedOpp.circa.toolingMatrixCostUsd}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              circa: {
                                ...o.circa,
                                toolingMatrixCostUsd: Number(e.target.value) || 0
                              }
                            }))
                          }
                          className="mt-2 w-full text-base font-extrabold text-[#00856B] bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          CAPEX Matricería específica
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <label
                          htmlFor="circa-machinery"
                          className="block text-xs font-bold text-slate-700"
                        >
                          Inversión Maquinaria & Periféricos (USD)
                        </label>
                        <input
                          id="circa-machinery"
                          type="number"
                          step="1000"
                          value={selectedOpp.circa.machineryInvestmentUsd}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              circa: {
                                ...o.circa,
                                machineryInvestmentUsd: Number(e.target.value) || 0
                              }
                            }))
                          }
                          className="mt-2 w-full text-base font-extrabold text-[#00856B] bg-white border border-slate-300 rounded-xl px-3 py-2"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Calibradores, corte, periféricos
                        </span>
                      </div>
                    </div>

                    {/* General Production Parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Tiempo de Ciclo</span>
                        <span className="text-sm font-bold text-slate-900">
                          {selectedOpp.circa.cycleTimeSeconds} seg
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Cavidades / Salidas</span>
                        <span className="text-sm font-bold text-slate-900">
                          {selectedOpp.circa.cavityCount} cav.
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Scrap Técnico Est.</span>
                        <span className="text-sm font-bold text-slate-900">
                          {selectedOpp.circa.scrapRatePercent}%
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">KPI Time-to-Market</span>
                        <span className="text-sm font-bold text-[#00856B]">
                          {selectedOpp.circa.responseDays}d / ≤{selectedOpp.circa.targetResponseDays}d
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 4 CONTENT: RENTA (SALES DEPARTMENT - AUTO GENERATED FROM CIRCA) */}
                {activeWorkspaceStage === 4 && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#E20074]/[0.04] border border-[#E20074]/25">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#E20074]">
                          Archivo RENTA Generado Automáticamente (CIRCA + Input Ventas)
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Modificá el Precio de Venta o Cantidad anual para recalcular ROI, Payback y Margen en tiempo real.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRentaForExcel}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#E20074] border border-[#E20074]/40 hover:bg-[#E20074] hover:text-white transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        {copiedRenta ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedRenta ? 'Copiado para Excel' : 'Copiar / Pegar formato RENTA actual'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Auto-imported from CIRCA (Read-only provenance) */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-[#00856B]">
                            1. Datos Heredados de CIRCA (Proceso 3)
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {selectedOpp.circa.sapCircaCode}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                            <span className="text-slate-600">Transfer Price (Costo Producción CIRCA):</span>
                            <strong className="text-slate-900">
                              USD {rentaMetrics.transferPrice.toFixed(2)} / u
                            </strong>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                            <span className="text-slate-600">Inversión Matriz / Herramental:</span>
                            <strong className="text-slate-900">
                              USD {selectedOpp.circa.toolingMatrixCostUsd.toLocaleString()}
                            </strong>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                            <span className="text-slate-600">Inversión Maquinaria / Periféricos:</span>
                            <strong className="text-slate-900">
                              USD {selectedOpp.circa.machineryInvestmentUsd.toLocaleString()}
                            </strong>
                          </div>
                          <div className="flex justify-between py-1.5 font-bold text-slate-900">
                            <span>Inversión Total Requerida (CAPEX):</span>
                            <span className="text-[#00856B]">
                              USD {rentaMetrics.totalCapex.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sales Commercial Input */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                        <span className="text-xs font-bold uppercase text-[#E20074] block">
                          2. Input Comercial (SALES Department)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="renta-price"
                              className="block text-[11px] font-bold text-slate-700"
                            >
                              Precio de Venta Unitario (USD)
                            </label>
                            <input
                              id="renta-price"
                              type="number"
                              step="0.10"
                              value={selectedOpp.renta.targetSellingPriceUnitUsd}
                              onChange={(e) =>
                                updateSelectedOpp((o) => ({
                                  ...o,
                                  renta: {
                                    ...o.renta,
                                    targetSellingPriceUnitUsd: Number(e.target.value) || 0
                                  }
                                }))
                              }
                              className="mt-1 w-full text-sm font-extrabold text-[#E20074] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="renta-qty"
                              className="block text-[11px] font-bold text-slate-700"
                            >
                              Cantidad Anual (Unidades)
                            </label>
                            <input
                              id="renta-qty"
                              type="number"
                              step="1000"
                              value={selectedOpp.renta.annualQuantityUnits}
                              onChange={(e) =>
                                updateSelectedOpp((o) => ({
                                  ...o,
                                  renta: {
                                    ...o.renta,
                                    annualQuantityUnits: Number(e.target.value) || 0
                                  }
                                }))
                              }
                              className="mt-1 w-full text-sm font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="renta-amort"
                            className="block text-[11px] font-bold text-slate-700"
                          >
                            Esquema de Amortización de Inversión
                          </label>
                          <select
                            id="renta-amort"
                            value={selectedOpp.renta.amortizationType}
                            onChange={(e) =>
                              updateSelectedOpp((o) => ({
                                ...o,
                                renta: {
                                  ...o.renta,
                                  amortizationType: e.target.value as Opportunity['renta']['amortizationType']
                                }
                              }))
                            }
                            className="mt-1 w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                          >
                            <option value="En Precio de Pieza">Amortizado en Precio de Pieza</option>
                            <option value="Pago Directo Cliente (Upfront)">
                              Pago Directo Cliente (100% Upfront)
                            </option>
                            <option value="Mixto 50/50">Esquema Mixto 50% Anticipo / 50% en Pieza</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* RENTA Resulting Financial Indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          ROI del Proyecto
                        </span>
                        <span className="text-xl font-extrabold text-[#4EB99F]">
                          {rentaMetrics.roiPercent.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-300 block mt-0.5">
                          En {selectedOpp.contractYears} años de contrato
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          Margen Bruto s/Venta
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                          {rentaMetrics.grossMarginPercent.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          USD {rentaMetrics.unitMarginUsd.toFixed(2)} / unidad
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          Facturación Anual RENTA
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                          USD {(rentaMetrics.annualRevenueUsd / 1000).toFixed(1)}k
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Total {selectedOpp.contractYears}a: USD {(rentaMetrics.lifetimeRevenueUsd / 1e6).toFixed(2)}M
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                          Recupero CAPEX (Payback)
                        </span>
                        <span className="text-xl font-extrabold text-[#E20074]">
                          {rentaMetrics.paybackMonths.toFixed(1)} meses
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Time-to-Market: {selectedOpp.renta.responseDaysPostStage3}d (≤2d)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 5 CONTENT: COTIZACIÓN (NUEVO FORMATO MODERNO Y ELEGANTE PARA CLIENTES) */}
                {activeWorkspaceStage === 5 && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-xs font-extrabold uppercase text-[#E20074]">
                          Nuevo Formato Moderno y Elegante para Presentación a Clientes
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Incluye precios RENTA, plano CAD, calidad de molde/matriz, golpes garantizados y datos de proceso.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quotePreviewDialogRef.current?.showModal()}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E20074] hover:bg-[#c80066] shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Abrir Vista Previa de Cotización Cliente</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                        <h5 className="font-bold text-slate-900 uppercase tracking-wider">
                          Especificaciones de Matriz & Proceso Incluidas
                        </h5>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">N° Cotización Oficial:</span>
                          <strong className="text-slate-900">{selectedOpp.cotizacion.quoteNumber}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Plano / Dibujo Técnico:</span>
                          <strong className="font-mono text-slate-900">{selectedOpp.cotizacion.drawingCode}</strong>
                        </div>
                        <div className="py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 block">Calidad de Molde / Matriz:</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedOpp.cotizacion.moldSteelQuality}
                          </strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Vida Útil Garantizada:</span>
                          <strong className="text-[#00856B]">{selectedOpp.cotizacion.guaranteedShots}</strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Lead Time Herramental:</span>
                          <strong className="text-slate-900">{selectedOpp.cotizacion.leadTimeToolingWeeks}</strong>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                        <h5 className="font-bold text-slate-900 uppercase tracking-wider">
                          Condiciones Comerciales & Proceso Técnico
                        </h5>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Precio Unitario Cotizado:</span>
                          <strong className="text-sm text-[#E20074]">
                            USD {rentaMetrics.sellingPrice.toFixed(2)} / u
                          </strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Inversión Herramental:</span>
                          <strong className="text-slate-900">
                            USD {selectedOpp.circa.toolingMatrixCostUsd.toLocaleString()} ({selectedOpp.renta.amortizationType})
                          </strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Incoterm & Entrega:</span>
                          <strong className="text-slate-900">{selectedOpp.cotizacion.incoterm}</strong>
                        </div>
                        <div className="py-1.5">
                          <span className="text-slate-500 block">Datos de Proceso Productivo:</span>
                          <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">
                            {selectedOpp.cotizacion.processDataSummary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 6 CONTENT: YES / NO (CUSTOMERS) */}
                {activeWorkspaceStage === 6 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                          Decisión del Cliente (YES / NO)
                        </span>
                        <select
                          aria-label="Estado de decisión del cliente"
                          value={selectedOpp.customerDecision.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as Opportunity['customerDecision']['status'];
                            updateSelectedOpp((o) => ({
                              ...o,
                              customerDecision: {
                                ...o.customerDecision,
                                status: newStatus,
                                decisionDate: '2026-11-25'
                              }
                            }));
                            showToast(`Estado cliente actualizado a: ${newStatus}`);
                          }}
                          className="mt-2 w-full text-xs font-extrabold bg-white border border-slate-300 rounded-xl px-3 py-2.5"
                        >
                          <option value="En Evaluación Cliente">En Evaluación Cliente</option>
                          <option value="YES (Ganada)">YES — Propuesta Aceptada (WIN)</option>
                          <option value="NO (Perdida)">NO — Propuesta Rechazada (LOSS)</option>
                        </select>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 md:col-span-2">
                        <span className="text-[11px] font-bold uppercase text-slate-500 block">
                          Feedback del Cliente & Benchmark Competitivo
                        </span>
                        <p className="text-xs text-slate-800 font-medium mt-1.5">
                          {selectedOpp.customerDecision.clientFeedback}
                        </p>
                        {selectedOpp.customerDecision.competitorBenchmark && (
                          <p className="text-xs text-slate-500 mt-1">
                            <strong>Benchmark:</strong> {selectedOpp.customerDecision.competitorBenchmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 7 CONTENT: HR / FIN (CONTROLLING) */}
                {activeWorkspaceStage === 7 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#00A887]/[0.06] border border-[#00A887]/30">
                        <span className="text-[11px] font-bold uppercase text-[#00856B] block">
                          Estado Controlling / Comisiones
                        </span>
                        <select
                          aria-label="Estado de liquidación Controlling"
                          value={selectedOpp.controlling.evaluationStatus}
                          onChange={(e) =>
                            updateSelectedOpp((o) => ({
                              ...o,
                              controlling: {
                                ...o.controlling,
                                evaluationStatus: e.target.value as Opportunity['controlling']['evaluationStatus']
                              }
                            }))
                          }
                          className="mt-2 w-full text-xs font-bold bg-white border border-[#00A887]/40 rounded-xl px-3 py-2"
                        >
                          <option value="Pendiente Win">Pendiente Win</option>
                          <option value="En Revisión Controlling">En Revisión Controlling</option>
                          <option value="Comisión Aprobada">Comisión Aprobada</option>
                          <option value="Liquidado HR/FIN">Liquidado HR / Finanzas</option>
                        </select>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Comisión Ventas ({selectedOpp.controlling.commissionRatePercent}%)
                        </span>
                        <p className="text-lg font-extrabold text-[#E20074] mt-1">
                          USD {selectedOpp.controlling.approvedBonusUsd.toLocaleString()}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          Período HR: {selectedOpp.controlling.hrPayrollPeriod}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          Entregable a Finanzas / HR
                        </span>
                        <p className="text-sm font-extrabold font-mono text-slate-900 mt-1">
                          {selectedOpp.controlling.financeDeliverableRef}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          Auditor: {selectedOpp.controlling.controllingAuditor}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>Dictamen Controlling:</strong> {selectedOpp.controlling.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Plus: Detallar acciones relacionadas a cada seguimiento de proyecto */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#3B3D3F] uppercase tracking-wider">
                      Plus: Bitácora de Acciones & Seguimiento por Proyecto
                    </h3>
                    <p className="text-xs text-slate-500">
                      Trazabilidad de seguimientos comerciales, Push Mails cada 15 días y sincronizaciones SAP CIRCA
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedOpp.actions.length} acciones registradas
                  </span>
                </div>

                {/* Add Action Form */}
                <form onSubmit={handleAddAction} className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    aria-label="Tipo de acción de seguimiento"
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as FollowUpAction['actionType'])}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700"
                  >
                    <option value="Seguimiento">Seguimiento</option>
                    <option value="Push 15 Días">Push 15 Días</option>
                    <option value="SAP Sync">SAP Sync</option>
                    <option value="Cliente">Reunión Cliente</option>
                    <option value="Aprobación">Aprobación</option>
                  </select>
                  <input
                    type="text"
                    name="actionDescription"
                    aria-label="Descripción de la nueva acción de seguimiento"
                    placeholder={`Agregar acción para Etapa ${activeWorkspaceStage} (${activeStageDef.name})...`}
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    required
                    className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#E20074] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#3B3D3F] hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                  >
                    + Registrar Acción
                  </button>
                </form>

                {/* Actions List */}
                <div className="divide-y divide-slate-100">
                  {selectedOpp.actions.map((act) => (
                    <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`chk-${act.id}`}
                          checked={act.completed}
                          onChange={() => toggleActionCompleted(act.id)}
                          className="mt-1 w-4 h-4 accent-[#00A887] rounded cursor-pointer"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor={`chk-${act.id}`}
                              className={`text-xs font-bold cursor-pointer ${
                                act.completed ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                            >
                              {act.description}
                            </label>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{act.author}</span>
                            <span>•</span>
                            <span>{act.department}</span>
                            <span>•</span>
                            <span className="px-2 py-0.2 rounded bg-slate-100 font-semibold text-slate-700">
                              Etapa {act.stageId}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded font-bold ${
                                act.actionType === 'Push 15 Días'
                                  ? 'bg-[#E20074]/10 text-[#E20074]'
                                  : act.actionType === 'SAP Sync'
                                  ? 'bg-[#00A887]/12 text-[#00856B]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {act.actionType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">{act.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: MATRIZ COMPLETA & RENTA TABLE (Responsive Table following modern-web-guidance `responsive-table`) */}
        {activeMainView === 'pipeline' && (
          <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#3B3D3F]">
                  Matriz Consolidada CIRCA (SAP) → RENTA → Cotización
                </h2>
                <p className="text-xs text-slate-500">
                  Comparativa integral de Transfer Price, CAPEX requerido, Precio de Venta, ROI y estado en el circuito
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyRentaForExcel}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#00856B] bg-[#00A887]/10 hover:bg-[#00A887]/20 transition-all flex items-center gap-2 self-start cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar RENTA Seleccionado ({selectedOpp.code})</span>
              </button>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-labelledby="circa-renta-table-caption"
              className="table-wrapper rounded-xl border border-slate-200"
            >
              <table className="w-full text-left text-xs">
                <caption id="circa-renta-table-caption" className="sr-only">
                  Tabla consolidada de oportunidades REHAU CIRCA y RENTA
                </caption>
                <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4 border-b border-slate-200">Proyecto / Cliente</th>
                    <th className="py-3 px-4 border-b border-slate-200">Etapa Actual</th>
                    <th className="py-3 px-4 border-b border-slate-200">SAP CIRCA Ref</th>
                    <th className="py-3 px-4 border-b border-slate-200">Transfer Price</th>
                    <th className="py-3 px-4 border-b border-slate-200">CAPEX (Matriz+Maq)</th>
                    <th className="py-3 px-4 border-b border-slate-200">Precio Venta</th>
                    <th className="py-3 px-4 border-b border-slate-200">Venta Anual</th>
                    <th className="py-3 px-4 border-b border-slate-200">ROI / Margen</th>
                    <th className="py-3 px-4 border-b border-slate-200">Time to Market</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {opportunities.map((opp) => {
                    const m = calculateRentaMetrics(opp);
                    const st = STAGES.find((s) => s.id === opp.currentStage)!;
                    const ttm =
                      opp.preCirca.responseDays +
                      opp.circa.responseDays +
                      opp.renta.responseDaysPostStage3 +
                      opp.cotizacion.responseDaysPostStage4;

                    return (
                      <tr
                        key={opp.id}
                        onClick={() => {
                          setSelectedOppId(opp.id);
                          setActiveMainView('circuito');
                        }}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                      >
                        <th className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-lg text-white font-extrabold text-[11px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: opp.clientColor }}
                            >
                              {opp.clientLogoText}
                            </span>
                            <div>
                              <span className="block text-xs font-bold text-slate-900">{opp.clientName}</span>
                              <span className="block text-[11px] font-medium text-slate-500">
                                {opp.code} • {opp.title}
                              </span>
                            </div>
                          </div>
                        </th>
                        <td data-label="Etapa Actual" className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getBadgeStyleForAccent(
                              st.accentColor,
                              false
                            )}`}
                          >
                            {opp.currentStage}. {st.name}
                          </span>
                        </td>
                        <td data-label="SAP CIRCA" className="py-3.5 px-4 font-mono text-slate-700">
                          {opp.circa.sapCircaCode}
                        </td>
                        <td data-label="Transfer Price" className="py-3.5 px-4 font-bold text-slate-800">
                          USD {m.transferPrice.toFixed(2)}
                        </td>
                        <td data-label="CAPEX" className="py-3.5 px-4 font-bold text-[#00856B]">
                          USD {m.totalCapex.toLocaleString()}
                        </td>
                        <td data-label="Precio Venta" className="py-3.5 px-4 font-extrabold text-[#E20074]">
                          USD {m.sellingPrice.toFixed(2)}
                        </td>
                        <td data-label="Venta Anual" className="py-3.5 px-4 font-bold text-slate-900">
                          USD {m.annualRevenueUsd.toLocaleString()}
                        </td>
                        <td data-label="ROI / Margen" className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900">{m.roiPercent.toFixed(0)}% ROI</span>
                          <span className="block text-[11px] text-slate-500">
                            {m.grossMarginPercent.toFixed(1)}% MB
                          </span>
                        </td>
                        <td data-label="Time to Market" className="py-3.5 px-4">
                          <span className="font-bold text-[#00856B]">{ttm} días acum.</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* VIEW 3: KPIS & WIN/LOSS REPORT */}
        {activeMainView === 'kpis' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#3B3D3F]">
                  KPIs de Time to Market por Etapa (Parámetro Evaluación Desempeño)
                </h3>
                <Clock className="w-5 h-5 text-[#00A887]" />
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'Etapa 2: Pre-Circa (Ingeniería)',
                    current: '2.3 días prom.',
                    target: 'Meta ≤ 3.0 días',
                    pct: 76,
                    color: 'bg-[#00A887]'
                  },
                  {
                    label: 'Etapa 3: Costeo CIRCA en SAP (Ingeniería)',
                    current: '3.7 días prom.',
                    target: 'Meta ≤ 5.0 días',
                    pct: 74,
                    color: 'bg-[#00A887]'
                  },
                  {
                    label: 'Etapa 4: Archivo RENTA post Proceso 3 (SALES)',
                    current: '1.0 día prom.',
                    target: 'Meta ≤ 2.0 días',
                    pct: 50,
                    color: 'bg-[#E20074]'
                  },
                  {
                    label: 'Etapa 5: Cotización Cliente post Proceso 4 (SALES)',
                    current: '1.3 días prom.',
                    target: 'Meta ≤ 2.0 días',
                    pct: 65,
                    color: 'bg-[#E20074]'
                  }
                ].map((item) => (
                  <div key={item.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <span>{item.label}</span>
                      <span>
                        {item.current} <span className="text-slate-400 font-normal">({item.target})</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#3B3D3F]">
                  Etapa 6 & 7: Reporte Win / Loss & Entregables Controlling
                </h3>
                <Award className="w-5 h-5 text-[#E20074]" />
              </div>

              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{opp.clientName}</span>
                        <span className="text-[11px] font-mono text-slate-400">{opp.code}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opp.customerDecision.clientFeedback}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                          opp.customerDecision.status === 'YES (Ganada)'
                            ? 'bg-[#00A887]/15 text-[#00856B]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opp.customerDecision.status}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        Comisión: USD {opp.controlling.approvedBonusUsd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* DIALOG 1: Nueva Oportunidad (Etapa 1 Input) - Native <dialog> following modern-web-guidance `dialog` & `forms` */}
      <dialog
        ref={newOppDialogRef}
        aria-labelledby="new-opp-dialog-title"
        className="m-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E20074]">
              Etapa 1: Oportunidades (SALES Department)
            </span>
            <h1 id="new-opp-dialog-title" className="text-base font-extrabold text-slate-900">
              Cargar Nueva Oportunidad al Circuito CIRCA + RENTA
            </h1>
          </div>
          <button
            type="button"
            onClick={() => newOppDialogRef.current?.close()}
            aria-label="Cerrar ventana"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateOpportunity} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="opp-client" className="block font-bold text-slate-700 mb-1">
                Nombre del Cliente <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-client"
                name="clientName"
                type="text"
                required
                autoFocus
                placeholder="Ej. Toyota Argentina / Mercedes-Benz"
                value={newOppForm.clientName}
                onChange={(e) => setNewOppForm({ ...newOppForm, clientName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E20074] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="opp-logo-text" className="block font-bold text-slate-700 mb-1">
                Sigla / Logo Cliente <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-logo-text"
                name="clientLogoText"
                type="text"
                required
                maxLength={4}
                placeholder="Ej. TOY"
                value={newOppForm.clientLogoText}
                onChange={(e) => setNewOppForm({ ...newOppForm, clientLogoText: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase focus:border-[#E20074] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-title" className="block font-bold text-slate-700 mb-1">
              Nombre del Proyecto / Pieza a Desarrollar <span aria-hidden="true">*</span>
            </label>
            <input
              id="opp-title"
              name="title"
              type="text"
              required
              placeholder="Ej. Conducto Aire RAU-PP Talco — Plataforma SUV"
              value={newOppForm.title}
              onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#E20074] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="opp-blueprint" className="block font-bold text-slate-700 mb-1">
                Tipo de Geometría / Foto CAD
              </label>
              <select
                id="opp-blueprint"
                name="partImageSvgType"
                value={newOppForm.partImageSvgType}
                onChange={(e) =>
                  setNewOppForm({
                    ...newOppForm,
                    partImageSvgType: e.target.value as Opportunity['partImageSvgType']
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              >
                <option value="automotive-bumper">Perfil Automotriz Co-Extruido</option>
                <option value="fridge-gasket">Burlete Magnético Refrigeración</option>
                <option value="window-profile">Perfilería Ventana / Fachada RAU-FIPRO</option>
                <option value="industrial-hose">Tubo / Manguera Técnica Industrial</option>
              </select>
            </div>

            <div>
              <label htmlFor="opp-volume" className="block font-bold text-slate-700 mb-1">
                Volumen Anual Estimado (Unidades) <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-volume"
                name="expectedAnnualVolume"
                type="number"
                required
                value={newOppForm.expectedAnnualVolume}
                onChange={(e) => setNewOppForm({ ...newOppForm, expectedAnnualVolume: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="opp-sales-usd" className="block font-bold text-slate-700 mb-1">
                Monto Esperado de Venta Anual (USD) <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-sales-usd"
                name="expectedSalesAmountUsd"
                type="number"
                required
                value={newOppForm.expectedSalesAmountUsd}
                onChange={(e) => setNewOppForm({ ...newOppForm, expectedSalesAmountUsd: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="opp-inv-usd" className="block font-bold text-slate-700 mb-1">
                Inversión Necesaria Estimada (USD) <span aria-hidden="true">*</span>
              </label>
              <input
                id="opp-inv-usd"
                name="estimatedInvestmentUsd"
                type="number"
                required
                value={newOppForm.estimatedInvestmentUsd}
                onChange={(e) => setNewOppForm({ ...newOppForm, estimatedInvestmentUsd: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-[#00856B]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-summary" className="block font-bold text-slate-700 mb-1">
              Información Principal / Especificación Técnica <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="opp-summary"
              name="summaryInfo"
              rows={2}
              required
              placeholder="Describí requerimientos de material, planta cliente, SOP y detalles de matricería..."
              value={newOppForm.summaryInfo}
              onChange={(e) => setNewOppForm({ ...newOppForm, summaryInfo: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => newOppDialogRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E20074] hover:bg-[#c80066] cursor-pointer"
            >
              Crear Oportunidad e Iniciar Push 15d
            </button>
          </div>
        </form>
      </dialog>

      {/* DIALOG 2: Vista Previa de Cotización Moderna para Clientes (Etapa 5) */}
      <dialog
        ref={quotePreviewDialogRef}
        aria-labelledby="quote-preview-title"
        className="m-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        <div className="h-2 w-full bg-gradient-to-r from-[#00A887] via-[#3B3D3F] to-[#E20074]" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <img src="/rehau-logo-cropped.png" alt="REHAU" className="h-10 w-auto object-contain" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#E20074]">
                  Propuesta Técnico-Comercial Oficial
                </span>
                <h1 id="quote-preview-title" className="text-lg font-extrabold text-[#3B3D3F]">
                  {selectedOpp.cotizacion.quoteNumber} — {selectedOpp.clientName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => quotePreviewDialogRef.current?.close()}
                aria-label="Cerrar vista previa de cotización"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Drawing & Part Blueprint + Executive Quote Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <PartBlueprintSvg type={selectedOpp.partImageSvgType} className="w-full h-36" />
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plano de Referencia:</span>
                  <strong className="font-mono">{selectedOpp.cotizacion.drawingCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Familia Material:</span>
                  <strong>{selectedOpp.preCirca.materialFamily}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Planta Productiva:</span>
                  <strong>{selectedOpp.circa.plantLocation}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4EB99F]">
                  Oferta Económica (Integrada con RENTA)
                </span>
                <h3 className="text-base font-bold mt-1">{selectedOpp.title}</h3>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Precio Unitario de Pieza:</span>
                  <strong className="text-base text-[#4EB99F]">
                    USD {rentaMetrics.sellingPrice.toFixed(2)} / unidad
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volumen Anual Cotizado:</span>
                  <strong>{rentaMetrics.annualQty.toLocaleString()} unidades / año</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inversión Matriz / Herramental:</span>
                  <strong>USD {selectedOpp.circa.toolingMatrixCostUsd.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modalidad Herramental:</span>
                  <strong>{selectedOpp.renta.amortizationType}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Mold quality & process details required by Stage 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-[#00856B] block">
                Calidad de Molde / Matriz & Garantía
              </span>
              <p className="font-semibold text-slate-900 mt-1">{selectedOpp.cotizacion.moldSteelQuality}</p>
              <p className="text-slate-500 mt-1">
                Vida útil: {selectedOpp.cotizacion.guaranteedShots} • Plazo: {selectedOpp.cotizacion.leadTimeToolingWeeks}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-[#E20074] block">
                Datos de Proceso & Condiciones de Entrega
              </span>
              <p className="font-semibold text-slate-900 mt-1">{selectedOpp.cotizacion.processDataSummary}</p>
              <p className="text-slate-500 mt-1">
                {selectedOpp.cotizacion.incoterm} • Pago: {selectedOpp.cotizacion.paymentTerms}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
            <span>Validez de la oferta: {selectedOpp.cotizacion.validityDays} días corridos</span>
            <button
              type="button"
              onClick={() => {
                quotePreviewDialogRef.current?.close();
                showToast(`Cotización ${selectedOpp.cotizacion.quoteNumber} marcada como enviada al cliente`);
              }}
              className="px-4 py-2 rounded-xl font-bold text-white bg-[#E20074] hover:bg-[#c80066] cursor-pointer"
            >
              Confirmar Envío a {selectedOpp.clientName}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default App;

