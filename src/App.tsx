import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  SummaryIcon,
  Users,
  X,
} from "lucide-react";

import { api } from "./api";
import eduleadMark from "./assets/edulead-mark.png";
import type { Advisor, Lead, Program, Summary } from "./types";

const emptySummary: Summary = {
  total: 0,
  new: 0,
  interested: 0,
  pending_advisor: 0,
  contacted: 0,
  enrolled: 0,
  pending_follow_ups: 0,
};

const statusInfo: Record<string, { label: string; className: string }> = {
  new: { label: "Nuevo", className: "status-new" },
  interested: { label: "Interesado", className: "status-interested" },
  pending_advisor: { label: "Espera asesor", className: "status-pending" },
  contacted: { label: "Contactado", className: "status-contacted" },
  enrolled: { label: "Inscrito", className: "status-enrolled" },
  lost: { label: "No convertido", className: "status-lost" },
};

const formatRelative = (date: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short" }).format(
    new Date(date),
  );
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const createDemoId = () => `demo-${crypto.randomUUID().slice(0, 8)}`;

function StatusBadge({ status }: { status: string }) {
  const info = statusInfo[status] || statusInfo.new;
  return <span className={`status-badge ${info.className}`}>{info.label}</span>;
}

function App() {
  const [view, setView] = useState<"dashboard" | "chat">("dashboard");
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [summaryData, leadsData, programsData, advisorsData] = await Promise.all([
        api.summary(),
        api.leads(),
        api.programs(),
        api.advisors(),
      ]);
      setSummary(summaryData);
      setLeads(leadsData);
      setPrograms(programsData);
      setAdvisors(advisorsData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo conectar con la API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      setSelectedLead(await api.lead(lead.id));
    } catch {
      // La información resumida continúa disponible si falla el detalle.
    }
  };

  const updateLead = async (data: Partial<Lead>) => {
    if (!selectedLead) return;
    const updated = await api.updateLead(selectedLead.id, data);
    setSelectedLead((current) => (current ? { ...current, ...updated } : updated));
    await loadData();
  };

  const filteredLeads = useMemo(() => {
    const term = search.toLocaleLowerCase();
    return leads.filter(
      (lead) =>
        lead.name.toLocaleLowerCase().includes(term) ||
        lead.phone.includes(term) ||
        lead.program?.name.toLocaleLowerCase().includes(term),
    );
  }, [leads, search]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><img src={eduleadMark} alt="" /></span>
          <span><strong>EduLead</strong></span>
        </div>

        <nav className="nav-list" aria-label="Navegación principal">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
            <LayoutDashboard size={19} /> Panel general
          </button>
          <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}>
            <Bot size={19} /> Demo WhatsApp
          </button>
          <button disabled><Users size={19} /> Prospectos</button>
          <button disabled><BookOpen size={19} /> Programas</button>
          <button disabled><BarChart3 size={19} /> Reportes</button>
        </nav>

        <div className="sidebar-foot">
          <button><Settings size={18} /> Configuración</button>
          <div className="profile-mini">
            <span className="avatar avatar-dark">AD</span>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">CENTRO DE OPERACIONES</p>
            <h1>{view === "dashboard" ? "Panel comercial" : "Captación por WhatsApp"}</h1>
          </div>
          <div className="topbar-actions">
            <span className="live-pill"> + Entorno demo</span>
            <button className="icon-button" aria-label="Notificaciones"><Bell size={19} /></button>
            <button className="primary-button" onClick={() => setView(view === "chat" ? "dashboard" : "chat")}>
              {view === "chat" ? <LayoutDashboard size={17} /> : <Sparkles size={17} />}
              {view === "chat" ? "Ver panel" : "Abrir demo"}
            </button>
          </div>
        </header>

        {error && <div className="error-banner">{error}<button onClick={loadData}>Reintentar</button></div>}
        {view === "dashboard" ? (
          <Dashboard
            summary={summary}
            leads={filteredLeads}
            search={search}
            loading={loading}
            onSearch={setSearch}
            onLead={openLead}
            onRefresh={loadData}
          />
        ) : (
          <ChatSimulator programs={programs} onActivity={loadData} />
        )}
      </main>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          advisors={advisors}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
        />
      )}
    </div>
  );
}

type DashboardProps = {
  summary: Summary;
  leads: Lead[];
  search: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onLead: (lead: Lead) => void;
  onRefresh: () => void;
};

function Dashboard({ summary, leads, search, loading, onSearch, onLead, onRefresh }: DashboardProps) {
  const cards = [
    { label: "Prospectos totales", value: summary.total, note: "Base comercial", icon: Users, tone: "mint" },
    { label: "Nuevos", value: summary.new, note: "Requieren revisión", icon: SummaryIcon, tone: "blue" },
    { label: "Esperan asesor", value: summary.pending_advisor, note: "Prioridad alta", icon: Clock3, tone: "amber" },
    { label: "Inscritos", value: summary.enrolled, note: "Conversiones", icon: CheckCircle2, tone: "violet" },
  ];

  const conversion = summary.total ? Math.round((summary.enrolled / summary.total) * 100) : 0;

  return (
    <div className="dashboard-content">
      <section className="stat-grid">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}><Icon size={20} /></span>
            <div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>
          </article>
        ))}
      </section>

      <section className="insight-row">
        <article className="insight-card main-insight">
          <div>
            <span className="section-label">RESUMEN</span>
            <h2>Flujo desde la interaccion</h2>
            <p>Visualiza cómo avanzan los interesados durante el proceso comercial.</p>
          </div>
          <div className="funnel">
            {[
              ["Nuevos", summary.new],
              ["Interesados", summary.interested],
              ["Contactados", summary.contacted],
              ["Inscritos", summary.enrolled],
            ].map(([label, value], index) => (
              <div className="funnel-step" key={label}>
                <span>{label}</span><strong>{value}</strong>
                {index < 3 && <ChevronRight size={17} />}
              </div>
            ))}
          </div>
        </article>
        <article className="conversion-card">
          <span className="section-label">CAPTACIÓN</span>
          <div className="conversion-value">{conversion}<small>%</small></div>
          <div className="progress"><i style={{ width: `${Math.max(conversion, 3)}%` }} /></div>
          <p>Prospectos/Clientes que llegaron a inscripción</p>
        </article>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div><span className="section-label">ACTIVIDAD RECIENTE</span><h2>Prospectos</h2></div>
          <div className="table-actions">
            <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar prospecto..." /></label>
            <button className="icon-button" onClick={onRefresh} aria-label="Actualizar"><RefreshCw size={18} /></button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Prospecto</th><th>Programa</th><th>Origen</th><th>Estado</th><th>Último contacto</th><th /></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-cell">Cargando información...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">Aún no hay prospectos para mostrar.</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} onClick={() => onLead(lead)}>
                  <td><div className="person-cell"><span className="avatar">{initials(lead.name)}</span><span><strong>{lead.name}</strong><small>{lead.phone}</small></span></div></td>
                  <td>{lead.program?.name || <span className="muted">Sin definir</span>}</td>
                  <td><span className="source"><MessageCircle size={14} /> {lead.source === "simulator" ? "Demo" : lead.source}</span></td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>{formatRelative(lead.last_interaction_at)}</td>
                  <td><ArrowRight size={17} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ChatSimulator({ programs, onActivity }: { programs: Program[]; onActivity: () => void }) {
  const [phone, setPhone] = useState(createDemoId);
  const name = "Ana Rojas";
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hola, soy el asistente académico de EduLead. Inicia el recorrido para ver cómo una consulta se convierte en un prospecto." },
  ]);

  const quickActions = [
    { label: "Iniciar recorrido", value: "hola" },
    { label: "Elegir programa 1", value: "1" },
    { label: "Solicitar asesor", value: "asesor" },
  ];

  const resetDemo = () => {
    setPhone(createDemoId());
    setMessage("");
    setConversation([
      { from: "bot", text: "Nueva simulación lista. Pulsa “Iniciar recorrido” para comenzar con un prospecto ficticio." },
    ]);
  };

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setConversation((current) => [...current, { from: "user", text: clean }]);
    setMessage("");
    setSending(true);
    try {
      const result = await api.simulate({ phone, name, message: clean });
      setConversation((current) => [...current, { from: "bot", text: result.reply }]);
      await onActivity();
    } catch (cause) {
      setConversation((current) => [
        ...current,
        { from: "bot", text: cause instanceof Error ? cause.message : "No se pudo enviar el mensaje." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(message);
  };

  return (
    <div className="simulator-layout">
      <section className="phone-card">
        <div className="phone-header">
          <span className="bot-avatar"><Bot size={22} /></span>
          <span><strong>Asistente académico</strong><small><i /> En línea</small></span>
          <MoreHorizontal size={20} />
        </div>
        <div className="messages">
          {conversation.map((item, index) => (
            <div className={`message ${item.from}`} key={`${item.from}-${index}`}>
              {item.text.split("\n").map((line, lineIndex) => <span key={lineIndex}>{line || <br />}</span>)}
              <small>{new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</small>
            </div>
          ))}
          {sending && <div className="typing"><i /><i /><i /></div>}
        </div>
        <div className="quick-actions">
          {quickActions.map(({ label, value }) => (
            <button key={value} disabled={sending} onClick={() => void sendMessage(value)}>{label}</button>
          ))}
        </div>
        <form className="composer" onSubmit={submit}>
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escribe un mensaje..." />
          <button disabled={sending || !message.trim()}><Send size={18} /></button>
        </form>
      </section>

      <aside className="simulator-guide">
        <div className="guide-header">
          <div>
            <span className="section-label">RECORRIDO</span>
            <h2>Prueba el flujo</h2>
          </div>
          <button className="reset-demo" type="button" onClick={resetDemo} disabled={sending}>
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>
        <p>Este ejemplo simula el canal de WhatsApp.</p>
        <div className="sandbox-note">
          <ShieldCheck size={18} />
          <p><strong>Sandbox seguro</strong> Usa datos de ejemplo. Cada reinicio genera un teléfono de prueba nuevo.</p>
        </div>
        <div className="demo-fields">
          <label>Nombre ficticio<input value={name} readOnly /></label>
          <label>ID de prueba<input value={phone} readOnly /></label>
        </div>
        <div className="guide-steps">
          {[
            ["01", "Inicia la conversación", "Pulsa “Iniciar recorrido” para consultar la API."],
            ["02", "Explora un programa", `La respuesta utiliza ${programs.length} programas cargados en PostgreSQL.`],
            ["03", "Solicita atención humana", "El CRM actualizará el estado y activará el seguimiento."],
          ].map(([number, title, copy]) => (
            <div className="guide-step" key={number}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function LeadDrawer({ lead, advisors, onClose, onUpdate }: { lead: Lead; advisors: Advisor[]; onClose: () => void; onUpdate: (data: Partial<Lead>) => void }) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="lead-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header"><span className="section-label">FICHA DEL PROSPECTO</span><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
        <div className="lead-identity"><span className="avatar avatar-large">{initials(lead.name)}</span><div><h2>{lead.name}</h2><p>{lead.phone} · {lead.source}</p></div></div>
        <StatusBadge status={lead.status} />

        <div className="drawer-section">
          <h3>Gestión comercial</h3>
          <label>Estado<select value={lead.status} onChange={(event) => void onUpdate({ status: event.target.value })}>{Object.entries(statusInfo).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select></label>
          <label>Asesor<select value={lead.advisor_id || ""} onChange={(event) => void onUpdate({ advisor_id: event.target.value ? Number(event.target.value) : null })}><option value="">Sin asignar</option>{advisors.map((advisor) => <option value={advisor.id} key={advisor.id}>{advisor.name}</option>)}</select></label>
        </div>

        <div className="drawer-section program-summary"><h3>Programa de interés</h3>{lead.program ? <><strong>{lead.program.name}</strong><p>{lead.program.modality} · Bs {Number(lead.program.price).toLocaleString("es-BO")}</p></> : <p className="muted">Todavía no seleccionó un programa.</p>}</div>

        <div className="drawer-section follow-up-list">
          <h3>Seguimientos automáticos</h3>
          {lead.follow_ups?.length ? lead.follow_ups.map((followUp) => (
            <div className="follow-up-item" key={followUp.id}>
              <span><Clock3 size={15} /></span>
              <div>
                <strong>{followUp.status === "pending" ? "Seguimiento pendiente" : followUp.status}</strong>
                <p>{followUp.notes || "Sin observaciones"}</p>
                <small>{new Date(followUp.scheduled_at).toLocaleString("es-BO")}</small>
              </div>
            </div>
          )) : <p className="muted">n8n todavía no creó tareas para este prospecto.</p>}
        </div>

        <div className="drawer-section timeline"><h3>Historial de conversación</h3>{lead.messages?.length ? lead.messages.map((message) => <div className="timeline-item" key={message.id}><span className={message.direction}><MessageCircle size={14} /></span><div><strong>{message.direction === "incoming" ? "Prospecto" : "Asistente"}</strong><p>{message.content}</p><small>{new Date(message.created_at).toLocaleString("es-BO")}</small></div></div>) : <p className="muted">No hay mensajes registrados.</p>}</div>
      </aside>
    </div>
  );
}

export default App;
