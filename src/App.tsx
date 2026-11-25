import React, { useState, useRef } from 'react';
import {
  INITIAL_OPPORTUNITIES,
  Opportunity,
  StageId,
  Department,
  FollowUpAction
} from './data/workflowData';
import { KANBAN_STAGES } from './data/kanbanStages';
import { PartBlueprintSvg } from './components/PartBlueprintSvg';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Printer,
  Check,
  X
} from 'lucide-react';

export function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [activeDeptFilter, setActiveDeptFilter] = useState<Department | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTab, setActiveModalTab] = useState<StageId>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedRenta, setCopiedRenta] = useState<boolean>(false);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<StageId | null>(null);

  // Native <dialog> refs
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const newOppDialogRef = useRef<HTMLDialogElement>(null);
  const quotePreviewDialogRef = useRef<HTMLDialogElement>(null);

  // New Action form state
  const [newActionText, setNewActionText] = useState('');

  // New Opportunity form state
  const [newOppForm, setNewOppForm] = useState({
    title: '',
    clientName: '',
    clientLogoText: '',
    productCategory: 'Automotive Exterior',
    partImageSvgType: 'automotive-bumper' as Opportunity['partImageSvgType'],
    salesOwner: 'Martín K.',
    engineeringOwner: 'Ing. Lucas Fernández',
    summaryInfo: '',
    expectedAnnualVolume: '80000',
    contractYears: '4',
    expectedSalesAmountUsd: '960000',
    estimatedInvestmentUsd: '110000'
  });

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId) || opportunities[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const openOppModal = (opp: Opportunity) => {
    setSelectedOppId(opp.id);
    setActiveModalTab(opp.currentStage);
    detailDialogRef.current?.showModal();
  };

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
      roiPercent,
      paybackMonths
    };
  };

  const updateOppById = (id: string, updater: (opp: Opportunity) => Opportunity) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? updater(o) : o)));
  };

  const moveOppToStage = (oppId: string, targetStage: StageId) => {
    const stageDef = KANBAN_STAGES.find((s) => s.id === targetStage);
    updateOppById(oppId, (opp) => {
      if (opp.currentStage === targetStage) return opp;
      return {
        ...opp,
        currentStage: targetStage,
        actions: [
          {
            id: `act-${Date.now()}`,
            date: '2026-11-25',
            author: stageDef?.department === 'Ingeniería' ? opp.engineeringOwner : opp.salesOwner,
            department: stageDef?.department || 'SALES Department',
            stageId: targetStage,
            actionType: 'Aprobación',
            description: `Movido a ${targetStage}. ${stageDef?.name}`,
            completed: true
          },
          ...opp.actions
        ]
      };
    });
    setActiveModalTab(targetStage);
    showToast(`Oportunidad movida a ${targetStage}. ${stageDef?.name}`);
  };

  // Filtered opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const stageDef = KANBAN_STAGES.find((s) => s.id === opp.currentStage);
    const matchesDept = activeDeptFilter === 'ALL' || stageDef?.department === activeDeptFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      opp.title.toLowerCase().includes(q) ||
      opp.clientName.toLowerCase().includes(q) ||
      opp.code.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const handleCopyRentaForExcel = (opp: Opportunity) => {
    const m = calculateRentaMetrics(opp);
    const tsv = [
      ['REHAU RENTA', opp.code],
      ['Cliente', opp.clientName],
      ['Proyecto', opp.title],
      ['SAP CIRCA', opp.circa.sapCircaCode],
      ['Transfer Price (USD/u)', m.transferPrice.toFixed(2)],
      ['Inversión Matriz (USD)', opp.circa.toolingMatrixCostUsd.toString()],
      ['Inversión Maquinaria (USD)', opp.circa.machineryInvestmentUsd.toString()],
      ['CAPEX Total (USD)', m.totalCapex.toString()],
      ['Precio Venta (USD/u)', m.sellingPrice.toFixed(2)],
      ['Volumen Anual (u)', m.annualQty.toString()],
      ['Venta Anual (USD)', m.annualRevenueUsd.toFixed(2)],
      ['Margen Bruto (%)', `${m.grossMarginPercent.toFixed(1)}%`],
      ['ROI (%)', `${m.roiPercent.toFixed(1)}%`]
    ]
      .map((row) => row.join('\t'))
      .join('\n');

    navigator.clipboard.writeText(tsv);
    setCopiedRenta(true);
    showToast('Datos RENTA copiados para pegar en Excel');
    setTimeout(() => setCopiedRenta(false), 2500);
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim() || !selectedOpp) return;
    const stageDef = KANBAN_STAGES.find((s) => s.id === selectedOpp.currentStage);
    updateOppById(selectedOpp.id, (opp) => ({
      ...opp,
      actions: [
        {
          id: `act-${Date.now()}`,
          date: '2026-11-25',
          author: stageDef?.department === 'Ingeniería' ? opp.engineeringOwner : opp.salesOwner,
          department: stageDef?.department || 'SALES Department',
          stageId: opp.currentStage,
          actionType: 'Seguimiento',
          description: newActionText.trim(),
          completed: false
        },
        ...opp.actions
      ]
    }));
    setNewActionText('');
  };

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
      code: `OPP-2026-0${opportunities.length + 18}`,
      title: newOppForm.title || 'Nuevo Desarrollo REHAU',
      productCategory: newOppForm.productCategory,
      partImageSvgType: newOppForm.partImageSvgType,
      clientName: newOppForm.clientName || 'Cliente Industrial',
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
      summaryInfo: newOppForm.summaryInfo || 'Especificación técnica cargada en apertura.',
      expectedAnnualVolume: vol,
      contractYears: years,
      expectedSalesAmountUsd: salesUsd,
      estimatedInvestmentUsd: invUsd,
      preCirca: {
        viabilityStatus: 'Pendiente',
        superficialEvaluation: '',
        technicalNotes: '',
        materialFamily: 'RAU-Polímero Técnico',
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
        plantLocation: 'Planta Pilar (BA)',
        responseDays: 1,
        targetResponseDays: 5
      },
      renta: {
        targetSellingPriceUnitUsd: unitSellingPrice,
        annualQuantityUnits: vol,
        amortizationType: 'En Precio de Pieza',
        discountRateWaccPercent: 11.5,
        responseDaysPostStage3: 1,
        targetResponseDays: 2
      },
      cotizacion: {
        quoteNumber: `COT-REHAU-2026-10${opportunities.length + 1}`,
        drawingCode: 'DRW-REHAU-001',
        moldSteelQuality: 'Acero Bohler M310 / Stavax ESR',
        guaranteedShots: '500.000 ciclos',
        leadTimeToolingWeeks: '12 semanas',
        incoterm: 'DAP Planta Cliente',
        paymentTerms: '45 días FF',
        validityDays: 30,
        processDataSummary: 'Extrusión / Co-extrusión con control láser.',
        responseDaysPostStage4: 1,
        targetResponseDays: 2
      },
      customerDecision: {
        status: 'En Evaluación Cliente',
        clientFeedback: 'En curso.'
      },
      controlling: {
        evaluationStatus: 'Pendiente Win',
        commissionRatePercent: 1.8,
        approvedBonusUsd: Math.round(salesUsd * 0.018),
        financeDeliverableRef: 'FIN-CTRL-PEND',
        hrPayrollPeriod: 'Q1 2027',
        controllingAuditor: 'Cra. Valeria Sosa',
        notes: 'Pendiente cierre.'
      },
      actions: [
        {
          id: `act-init-${Date.now()}`,
          date: '2026-11-25',
          author: newOppForm.salesOwner,
          department: 'SALES Department',
          stageId: 1,
          actionType: 'Seguimiento',
          description: 'Oportunidad creada.',
          completed: true
        }
      ]
    };

    setOpportunities((prev) => [newOpp, ...prev]);
    newOppDialogRef.current?.close();
    showToast(`Oportunidad ${newOpp.code} creada`);
  };

  const totalPipelineUsd = opportunities.reduce((acc, o) => acc + o.expectedSalesAmountUsd, 0);
  const selectedRenta = selectedOpp ? calculateRentaMetrics(selectedOpp) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Subtle REHAU top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#00A887] via-[#3B3D3F] to-[#E20074]" />

      {/* Clean Minimal Corporate Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/rehau-logo-cropped.png"
              alt="REHAU"
              className="h-8 sm:h-9 w-auto object-contain select-none"
            />
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-[#3B3D3F] tracking-tight">
                CRM Pipeline
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-[#00856B] bg-[#00A887]/10 px-2 py-0.5 rounded-md">
                CIRCA + RENTA
              </span>
            </div>
          </div>

          {/* Search, Filter & New Button */}
          <div className="flex items-center gap-2.5">
            <search className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  id="kanban-search"
                  name="kanban-search"
                  aria-label="Buscar proyecto o cliente"
                  placeholder="Buscar cliente o proyecto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#E20074] focus:bg-white transition-all"
                />
              </div>

              <select
                aria-label="Filtrar por área"
                value={activeDeptFilter}
                onChange={(e) => setActiveDeptFilter(e.target.value as Department | 'ALL')}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 focus:outline-none focus:border-[#00A887]"
              >
                <option value="ALL">Todas las áreas</option>
                <option value="SALES Department">Sales</option>
                <option value="Ingeniería">Ingeniería</option>
                <option value="Customers">Customers</option>
                <option value="Controlling">Controlling</option>
              </select>
            </search>

            <div className="hidden lg:flex items-center gap-4 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400">Casos:</span>{' '}
                <strong className="text-slate-800">{opportunities.length}</strong>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400">Pipeline:</span>{' '}
                <strong className="text-slate-800">USD {(totalPipelineUsd / 1e6).toFixed(2)}M</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => newOppDialogRef.current?.showModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#E20074] hover:bg-[#c80066] transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Oportunidad</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#3B3D3F] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-[#4EB99F] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Kanban Board */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5 min-w-[1180px] h-full items-start">
          {KANBAN_STAGES.map((stage) => {
            const stageOpps = filteredOpportunities.filter((o) => o.currentStage === stage.id);
            const isDragOver = dragOverStageId === stage.id;

            const topBarColor =
              stage.accent === 'magenta'
                ? 'bg-[#E20074]'
                : stage.accent === 'teal'
                ? 'bg-[#00A887]'
                : 'bg-[#3B3D3F]';

            const badgeColor =
              stage.accent === 'magenta'
                ? 'text-[#E20074] bg-[#E20074]/10'
                : stage.accent === 'teal'
                ? 'text-[#00856B] bg-[#00A887]/10'
                : 'text-slate-700 bg-slate-200/70';

            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStageId(stage.id);
                }}
                onDragLeave={() => setDragOverStageId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStageId(null);
                  if (draggedOppId) {
                    moveOppToStage(draggedOppId, stage.id);
                    setDraggedOppId(null);
                  }
                }}
                className={`flex flex-col rounded-xl bg-slate-100/80 border transition-all min-h-[calc(100vh-140px)] ${
                  isDragOver
                    ? 'border-[#E20074] bg-[#E20074]/[0.03] ring-2 ring-[#E20074]/15'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Column Header */}
                <div className="bg-white rounded-t-xl border-b border-slate-200/80 overflow-hidden">
                  <div className={`h-1 w-full ${topBarColor}`} />
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">{stage.id}.</span>
                        <h2 className="text-xs font-bold text-slate-800 truncate">{stage.name}</h2>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                        {stage.department}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}
                    >
                      {stageOpps.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="p-2.5 space-y-2.5 flex-1">
                  {stageOpps.map((opp) => {
                    const renta = calculateRentaMetrics(opp);

                    return (
                      <article
                        key={opp.id}
                        draggable
                        onDragStart={() => setDraggedOppId(opp.id)}
                        onDragEnd={() => {
                          setDraggedOppId(null);
                          setDragOverStageId(null);
                        }}
                        onClick={() => openOppModal(opp)}
                        className="group bg-white rounded-xl p-3 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all cursor-pointer select-none space-y-2.5"
                      >
                        {/* Client Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                              style={{ backgroundColor: opp.clientColor }}
                            >
                              {opp.clientLogoText}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {opp.clientName}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                {opp.code}
                              </span>
                            </div>
                          </div>

                          {opp.circa.sapSynced && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              SAP
                            </span>
                          )}
                        </div>

                        {/* Part Visual Preview */}
                        <PartBlueprintSvg type={opp.partImageSvgType} className="w-full h-20" />

                        {/* Title */}
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-[#E20074] transition-colors">
                            {opp.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {opp.summaryInfo}
                          </p>
                        </div>

                        {/* Financial Pills */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                          <div className="bg-slate-50 rounded-lg px-2 py-1">
                            <span className="text-[9px] text-slate-400 uppercase block">Venta/año</span>
                            <strong className="text-slate-800">
                              ${(opp.expectedSalesAmountUsd / 1000).toFixed(0)}k
                            </strong>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-2 py-1">
                            <span className="text-[9px] text-slate-400 uppercase block">CAPEX / ROI</span>
                            <strong className="text-[#00856B]">
                              ${(renta.totalCapex / 1000).toFixed(0)}k
                            </strong>{' '}
                            <span className="text-[#E20074] font-bold">({renta.roiPercent.toFixed(0)}%)</span>
                          </div>
                        </div>

                        {/* Card Footer: Owner, Push 15d & Quick stage arrows */}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            <Mail className="w-3 h-3 text-[#00A887]" />
                            Push {opp.nextPushMailDaysLeft}d
                          </span>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {opp.currentStage > 1 && (
                              <button
                                type="button"
                                title="Mover a etapa anterior"
                                onClick={() =>
                                  moveOppToStage(opp.id, (opp.currentStage - 1) as StageId)
                                }
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {opp.currentStage < 7 && (
                              <button
                                type="button"
                                title="Avanzar a siguiente etapa"
                                onClick={() =>
                                  moveOppToStage(opp.id, (opp.currentStage + 1) as StageId)
                                }
                                className="p-1 rounded hover:bg-[#00A887]/15 text-[#00856B] cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {stageOpps.length === 0 && (
                    <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400">
                      Sin casos en esta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL 1: Detalle de Oportunidad al hacer clic en una tarjeta del Kanban */}
      <dialog
        ref={detailDialogRef}
        aria-labelledby="opp-detail-title"
        className="m-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        {selectedOpp && selectedRenta && (
          <div>
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00A887] via-[#3B3D3F] to-[#E20074]" />

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                  style={{ backgroundColor: selectedOpp.clientColor }}
                >
                  {selectedOpp.clientLogoText}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {selectedOpp.code}
                    </span>
                    <span className="text-xs font-bold text-[#E20074] bg-[#E20074]/10 px-2 py-0.5 rounded">
                      Etapa {selectedOpp.currentStage}:{' '}
                      {KANBAN_STAGES.find((s) => s.id === selectedOpp.currentStage)?.name}
                    </span>
                  </div>
                  <h1 id="opp-detail-title" className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                    {selectedOpp.clientName} — {selectedOpp.title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedOpp.currentStage < 7 && (
                  <button
                    type="button"
                    onClick={() =>
                      moveOppToStage(selectedOpp.id, (selectedOpp.currentStage + 1) as StageId)
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#00A887] hover:bg-[#008f73] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Avanzar Etapa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => detailDialogRef.current?.close()}
                  aria-label="Cerrar detalle"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Stage Tabs inside Modal */}
            <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
              {KANBAN_STAGES.map((st) => {
                const active = activeModalTab === st.id;
                const isCurrent = selectedOpp.currentStage === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveModalTab(st.id)}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'border-[#E20074] text-slate-900 bg-white rounded-t-lg'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>
                      {st.id}. {st.name}
                    </span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#00A887]" />}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto text-xs">
              {/* TAB 1: Oportunidad */}
              {activeModalTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <PartBlueprintSvg type={selectedOpp.partImageSvgType} className="w-full h-36" />
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      {selectedOpp.summaryInfo}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 content-start">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block">Venta Anual Esperada</span>
                      <strong className="text-base text-slate-900">
                        USD {selectedOpp.expectedSalesAmountUsd.toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block">Inversión Estimada</span>
                      <strong className="text-base text-[#00856B]">
                        USD {selectedOpp.estimatedInvestmentUsd.toLocaleString()}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block">Volumen Anual</span>
                      <strong className="text-sm text-slate-800">
                        {selectedOpp.expectedAnnualVolume.toLocaleString()} u/año
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-slate-400 block">Responsable Ventas</span>
                      <strong className="text-sm text-slate-800">{selectedOpp.salesOwner}</strong>
                    </div>
                    <div className="col-span-2 p-3 rounded-xl bg-[#E20074]/[0.04] border border-[#E20074]/20 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Push Mail Quincenal (15 días)
                        </span>
                        <span className="text-slate-500">
                          Último: {selectedOpp.lastPushMailDate} • Próximo en {selectedOpp.nextPushMailDaysLeft}d
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            lastPushMailDate: '2026-11-25',
                            nextPushMailDaysLeft: 15
                          }));
                          showToast('Recordatorio Push 15d enviado');
                        }}
                        className="px-3 py-1.5 rounded-lg font-bold text-white bg-[#E20074] hover:bg-[#c80066] cursor-pointer"
                      >
                        Enviar Push
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Pre-Circa */}
              {activeModalTab === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block">Viabilidad Ingeniería</span>
                      <select
                        aria-label="Viabilidad"
                        value={selectedOpp.preCirca.viabilityStatus}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            preCirca: {
                              ...o.preCirca,
                              viabilityStatus: e.target.value as Opportunity['preCirca']['viabilityStatus']
                            }
                          }))
                        }
                        className="mt-1 w-full font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1.5"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Viable">Viable</option>
                        <option value="Viable con Observaciones">Viable con Observaciones</option>
                        <option value="No Viable">No Viable</option>
                      </select>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block">Ref. SAP Pre-Proyecto</span>
                      <strong className="text-sm font-mono text-slate-900 mt-1 block">
                        {selectedOpp.preCirca.sapPreProjectRef}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block">Time to Market</span>
                      <strong className="text-sm text-[#00856B] mt-1 block">
                        {selectedOpp.preCirca.responseDays} días (Meta ≤ {selectedOpp.preCirca.targetResponseDays}d)
                      </strong>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="modal-precirca-notes" className="font-bold text-slate-700 block mb-1">
                      Evaluación de Viabilidad (Ingeniería)
                    </label>
                    <textarea
                      id="modal-precirca-notes"
                      rows={3}
                      value={selectedOpp.preCirca.superficialEvaluation}
                      onChange={(e) =>
                        updateOppById(selectedOpp.id, (o) => ({
                          ...o,
                          preCirca: { ...o.preCirca, superficialEvaluation: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CIRCA (SAP) */}
              {activeModalTab === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-[#4EB99F]" />
                      <div>
                        <span className="font-bold text-[#4EB99F]">SAP CIRCA: {selectedOpp.circa.sapCircaCode}</span>
                        <span className="block text-[11px] text-slate-300">
                          Planta: {selectedOpp.circa.plantLocation} • Ciclo: {selectedOpp.circa.cycleTimeSeconds}s
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast(`Datos sincronizados con SAP (${selectedOpp.circa.sapCircaCode})`)}
                      className="px-3 py-1.5 rounded-lg font-bold bg-[#00A887] text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync SAP</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200">
                      <label htmlFor="m-tp" className="text-slate-500 block">
                        Costo Producción (Transfer Price USD/u)
                      </label>
                      <input
                        id="m-tp"
                        type="number"
                        step="0.05"
                        value={selectedOpp.circa.productionUnitCostUsd}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            circa: { ...o.circa, productionUnitCostUsd: Number(e.target.value) || 0 }
                          }))
                        }
                        className="mt-1 w-full text-sm font-extrabold border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200">
                      <label htmlFor="m-mat" className="text-slate-500 block">
                        Inversión Matriz (USD)
                      </label>
                      <input
                        id="m-mat"
                        type="number"
                        step="1000"
                        value={selectedOpp.circa.toolingMatrixCostUsd}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            circa: { ...o.circa, toolingMatrixCostUsd: Number(e.target.value) || 0 }
                          }))
                        }
                        className="mt-1 w-full text-sm font-extrabold text-[#00856B] border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200">
                      <label htmlFor="m-maq" className="text-slate-500 block">
                        Inversión Maquinaria (USD)
                      </label>
                      <input
                        id="m-maq"
                        type="number"
                        step="1000"
                        value={selectedOpp.circa.machineryInvestmentUsd}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            circa: { ...o.circa, machineryInvestmentUsd: Number(e.target.value) || 0 }
                          }))
                        }
                        className="mt-1 w-full text-sm font-extrabold text-[#00856B] border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RENTA */}
              {activeModalTab === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800">Cálculo Automático RENTA</span>
                      <span className="block text-slate-500">
                        Toma Transfer Price (USD {selectedRenta.transferPrice.toFixed(2)}) + CAPEX (USD{' '}
                        {selectedRenta.totalCapex.toLocaleString()}) de CIRCA
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyRentaForExcel(selectedOpp)}
                      className="px-3 py-1.5 rounded-lg font-bold text-[#E20074] bg-white border border-[#E20074]/30 hover:bg-[#E20074] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedRenta ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRenta ? 'Copiado' : 'Copiar para Excel RENTA'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200">
                      <label htmlFor="m-sell" className="text-slate-500 block">
                        Precio de Venta Unitario (USD)
                      </label>
                      <input
                        id="m-sell"
                        type="number"
                        step="0.10"
                        value={selectedOpp.renta.targetSellingPriceUnitUsd}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            renta: {
                              ...o.renta,
                              targetSellingPriceUnitUsd: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="mt-1 w-full text-sm font-extrabold text-[#E20074] border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200">
                      <label htmlFor="m-qty" className="text-slate-500 block">
                        Volumen Anual (Unidades)
                      </label>
                      <input
                        id="m-qty"
                        type="number"
                        step="1000"
                        value={selectedOpp.renta.annualQuantityUnits}
                        onChange={(e) =>
                          updateOppById(selectedOpp.id, (o) => ({
                            ...o,
                            renta: {
                              ...o.renta,
                              annualQuantityUnits: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="mt-1 w-full text-sm font-extrabold border border-slate-300 rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] text-slate-400 uppercase block">ROI Proyecto</span>
                      <strong className="text-base text-[#4EB99F]">
                        {selectedRenta.roiPercent.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Margen Bruto</span>
                      <strong className="text-base text-slate-900">
                        {selectedRenta.grossMarginPercent.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Venta Anual</span>
                      <strong className="text-base text-slate-900">
                        ${(selectedRenta.annualRevenueUsd / 1000).toFixed(0)}k
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Payback</span>
                      <strong className="text-base text-[#E20074]">
                        {selectedRenta.paybackMonths.toFixed(1)} m
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Cotización */}
              {activeModalTab === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <strong className="text-slate-900 block">
                        {selectedOpp.cotizacion.quoteNumber} • Plano {selectedOpp.cotizacion.drawingCode}
                      </strong>
                      <span className="text-slate-500">
                        Matriz: {selectedOpp.cotizacion.moldSteelQuality}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => quotePreviewDialogRef.current?.showModal()}
                      className="px-3.5 py-2 rounded-xl font-bold text-white bg-[#E20074] hover:bg-[#c80066] flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Cotización Cliente</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 6: YES / NO */}
              {activeModalTab === 6 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">Respuesta del Cliente</span>
                    <select
                      aria-label="Respuesta del cliente"
                      value={selectedOpp.customerDecision.status}
                      onChange={(e) =>
                        updateOppById(selectedOpp.id, (o) => ({
                          ...o,
                          customerDecision: {
                            ...o.customerDecision,
                            status: e.target.value as Opportunity['customerDecision']['status']
                          }
                        }))
                      }
                      className="w-full font-bold bg-white border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="En Evaluación Cliente">En Evaluación Cliente</option>
                      <option value="YES (Ganada)">YES (Ganada)</option>
                      <option value="NO (Perdida)">NO (Perdida)</option>
                    </select>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">Comentarios / Feedback</span>
                    <p className="font-medium text-slate-800">{selectedOpp.customerDecision.clientFeedback}</p>
                  </div>
                </div>
              )}

              {/* TAB 7: HR / FIN */}
              {activeModalTab === 7 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Estado Controlling</span>
                    <strong className="text-sm text-[#00856B] mt-1 block">
                      {selectedOpp.controlling.evaluationStatus}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Comisión ({selectedOpp.controlling.commissionRatePercent}%)</span>
                    <strong className="text-sm text-[#E20074] mt-1 block">
                      USD {selectedOpp.controlling.approvedBonusUsd.toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block">Legajo HR / Finanzas</span>
                    <strong className="text-sm font-mono text-slate-900 mt-1 block">
                      {selectedOpp.controlling.financeDeliverableRef}
                    </strong>
                  </div>
                </div>
              )}

              {/* Seguimiento / Acciones del Caso */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Acciones y Seguimiento del Proyecto
                </h4>
                <form onSubmit={handleAddAction} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Registrar nueva acción o nota de seguimiento..."
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 focus:bg-white focus:border-[#E20074] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg font-bold text-white bg-[#3B3D3F] hover:bg-slate-800 cursor-pointer"
                  >
                    Agregar
                  </button>
                </form>
                <div className="space-y-1.5">
                  {selectedOpp.actions.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{act.author}:</span>
                        <span className="text-slate-600">{act.description}</span>
                      </div>
                      <span className="font-mono text-slate-400 shrink-0">{act.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>

      {/* MODAL 2: Nueva Oportunidad */}
      <dialog
        ref={newOppDialogRef}
        aria-labelledby="new-opp-dialog-title"
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h1 id="new-opp-dialog-title" className="text-sm font-extrabold text-slate-900">
            Nueva Oportunidad Comercial
          </h1>
          <button
            type="button"
            onClick={() => newOppDialogRef.current?.close()}
            aria-label="Cerrar ventana"
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateOpportunity} className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label htmlFor="opp-client" className="block font-bold text-slate-700 mb-1">
                Cliente *
              </label>
              <input
                id="opp-client"
                type="text"
                required
                autoFocus
                placeholder="Ej. Toyota Argentina"
                value={newOppForm.clientName}
                onChange={(e) => setNewOppForm({ ...newOppForm, clientName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </div>
            <div>
              <label htmlFor="opp-logo-text" className="block font-bold text-slate-700 mb-1">
                Sigla *
              </label>
              <input
                id="opp-logo-text"
                type="text"
                required
                maxLength={4}
                placeholder="TOY"
                value={newOppForm.clientLogoText}
                onChange={(e) => setNewOppForm({ ...newOppForm, clientLogoText: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 uppercase"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-title" className="block font-bold text-slate-700 mb-1">
              Proyecto / Pieza *
            </label>
            <input
              id="opp-title"
              type="text"
              required
              placeholder="Ej. Perfil Co-Extruido RAU-PP"
              value={newOppForm.title}
              onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="opp-sales-usd" className="block font-bold text-slate-700 mb-1">
                Venta Anual Esperada (USD) *
              </label>
              <input
                id="opp-sales-usd"
                type="number"
                required
                value={newOppForm.expectedSalesAmountUsd}
                onChange={(e) => setNewOppForm({ ...newOppForm, expectedSalesAmountUsd: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </div>
            <div>
              <label htmlFor="opp-inv-usd" className="block font-bold text-slate-700 mb-1">
                Inversión Estimada (USD) *
              </label>
              <input
                id="opp-inv-usd"
                type="number"
                required
                value={newOppForm.estimatedInvestmentUsd}
                onChange={(e) => setNewOppForm({ ...newOppForm, estimatedInvestmentUsd: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="opp-summary" className="block font-bold text-slate-700 mb-1">
              Resumen Técnico *
            </label>
            <textarea
              id="opp-summary"
              rows={2}
              required
              value={newOppForm.summaryInfo}
              onChange={(e) => setNewOppForm({ ...newOppForm, summaryInfo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => newOppDialogRef.current?.close()}
              className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-[#E20074] hover:bg-[#c80066] cursor-pointer"
            >
              Crear Caso
            </button>
          </div>
        </form>
      </dialog>

      {/* MODAL 3: Vista Previa de Cotización Cliente */}
      <dialog
        ref={quotePreviewDialogRef}
        aria-labelledby="quote-preview-title"
        className="m-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl"
      >
        {selectedOpp && selectedRenta && (
          <div>
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00A887] via-[#3B3D3F] to-[#E20074]" />
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/rehau-logo-cropped.png" alt="REHAU" className="h-8 w-auto" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#E20074]">
                      Cotización Comercial
                    </span>
                    <h1 id="quote-preview-title" className="text-base font-extrabold text-slate-900">
                      {selectedOpp.cotizacion.quoteNumber} — {selectedOpp.clientName}
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => quotePreviewDialogRef.current?.close()}
                    aria-label="Cerrar"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PartBlueprintSvg type={selectedOpp.partImageSvgType} className="w-full h-32" />
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precio Unitario:</span>
                    <strong className="text-[#4EB99F]">
                      USD {selectedRenta.sellingPrice.toFixed(2)} / u
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volumen Anual:</span>
                    <strong>{selectedRenta.annualQty.toLocaleString()} u/año</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Matriz / Herramental:</span>
                    <strong>USD {selectedOpp.circa.toolingMatrixCostUsd.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plano:</span>
                    <strong className="font-mono">{selectedOpp.cotizacion.drawingCode}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p>
                  <strong>Calidad de Matriz:</strong> {selectedOpp.cotizacion.moldSteelQuality} ({selectedOpp.cotizacion.guaranteedShots})
                </p>
                <p>
                  <strong>Proceso:</strong> {selectedOpp.cotizacion.processDataSummary}
                </p>
                <p>
                  <strong>Entrega y Pago:</strong> {selectedOpp.cotizacion.incoterm} • {selectedOpp.cotizacion.paymentTerms}
                </p>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

export default App;
