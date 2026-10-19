"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, ClipboardList, Factory, Boxes, Users, History, Smartphone, Plus,
  Search, Bell, ChevronRight, ArrowUpRight, Truck, AlertTriangle, CircleCheck,
  Download, QrCode, CalendarDays, Hammer, Ruler, Paintbrush, ShieldCheck,
  Package, CircleHelp, RefreshCw, BookOpen, CloudOff, ArrowLeft, Cloud, Monitor,
} from "lucide-react";
import {
  activeStage, addDays, availableQuantity, isLate, progress, reservedQuantity,
  stageIndex, STAGES, TEAM, todayInAcre, type Order, type View,
} from "@/lib/production";
import { useProduction } from "@/hooks/use-production";
import { Avatar, Connection, Empty, Modal, OrderRoute, ProgressBar, QRModal, StatusBadge, formatDate, formatDateTime, qty } from "./production-ui";
import TaskPanel from "./task-panel";
import NewOrder from "./new-order";
import TeamPanel from "./team-panel";
import StageAssignment from "./stage-assignment";
import ProductDetailsEditor from "./product-details-editor";
import {actorFor,isManagement,type Account} from "@/lib/access";
import FurnitureArt from "./furniture-art";
import {trackingHref} from "@/lib/tracking";

const NAV = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "production", label: "Produção", icon: Factory },
  { id: "materials", label: "Materiais", icon: Boxes },
  { id: "team", label: "Equipe", icon: Users },
  { id: "history", label: "Histórico", icon: History },
] as const;
const STAGE_ICONS = [ClipboardList, Ruler, Hammer, Hammer, Paintbrush, ShieldCheck, Package, Truck];
const TITLES: Record<View, { title: string; description: string }> = {
  dashboard: { title: "Visão geral da produção", description: "Pedidos, pessoas e materiais. Tudo no mesmo fluxo." },
  orders: { title: "Cada pedido tem uma história", description: "Acompanhe o móvel desde o planejamento até a entrega." },
  production: { title: "O fluxo da sua marcenaria", description: "Veja o que está acontecendo e o que vem a seguir." },
  materials: { title: "O material certo, na hora certa", description: "Confira os saldos, as reservas e os recebimentos." },
  team: { title: "Uma equipe, um único fluxo", description: "Acessos individuais, funções e atividades da equipe." },
  history: { title: "Tudo registrado, etapa por etapa", description: "Quem fez, quando fez e o que foi confirmado." },
  worker: { title: "Minhas atividades", description: "Confira o pedido. Execute. Registre sua etapa." },
};
function orderStateText(o: Order) { const a = activeStage(o); return a ? STAGES.find(s => s.id === a.stageId)?.name || "" : "Entregue"; }

export default function ProductionApp({account,onLogout,onSwitchWorkspace}:{account:Account;onLogout:()=>void;onSwitchWorkspace:()=>void}) {
  const data = useProduction(account);
  const demo=account.mode==="demo";
  const canManage=demo||isManagement(account.role);
  const canChooseSector=demo||account.role==="admin";
  const { state, connection, syncedAt, pending, busy, run, refresh, retry, dismiss } = data;
  const [view, setView] = useState<View>("dashboard");
  const [actorId, setActorId] = useState("gestao");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOrder, setNewOrder] = useState(false);
  const [qrOrderId, setQrOrderId] = useState<string | null>(null);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState(1);
  const [receiveReference, setReceiveReference] = useState("");
  const [toast, setToast] = useState("");
  const [showPending, setShowPending] = useState(false);
  const [installEvent, setInstallEvent] = useState<{ prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null>(null);
  const initial = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const message = (value: string) => {
    setToast(value);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetView = params.get("view");
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const workerDefault=!canManage&&account.role!=="viewer";
    setView(targetView === "worker" || mobile || workerDefault ? "worker" : "dashboard");
    let savedProfile: string | null = null;
    try { savedProfile = localStorage.getItem("movel-fluxo-profile"); } catch {}
    const profile = params.get("actor") || savedProfile;
    setActorId(!canChooseSector ? actorFor(account.role) : TEAM.some(p => p.id === profile) ? profile! : mobile || targetView === "worker" ? "corte" : "gestao");
    if (params.get("order")) setSelectedId(params.get("order"));
    const install = (event: Event) => { event.preventDefault(); setInstallEvent(event as unknown as typeof installEvent); };
    window.addEventListener("beforeinstallprompt", install);
    return () => { window.removeEventListener("beforeinstallprompt", install); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => {
    if (!state || initial.current) return;
    initial.current = true;
    const params = new URLSearchParams(window.location.search);
    const order = state.orders.find(o => o.id === params.get("order"));
    if (order && !params.get("actor") && canChooseSector) setActorId(activeStage(order)?.assignedTo || "gestao");
  }, [state]);

  function selectProfile(id: string) { if(!canChooseSector)id=actorFor(account.role);setActorId(id); try { localStorage.setItem("movel-fluxo-profile", id); } catch {} }
  function navigate(next: View) {
    setView(next); setSelectedId(null); setSearch(""); setFilter("all"); setStageFilter("all");
    if (next !== "worker") selectProfile(canChooseSector?"gestao":actorFor(account.role));
    const url = new URL(window.location.href);
    url.searchParams.delete("order"); url.searchParams.delete("actor");
    if (next === "worker") url.searchParams.set("view", "worker"); else url.searchParams.delete("view");
    if(!demo||window.location.protocol!=="file:")window.history.replaceState({}, "", url);
  }
  function openWorker(id?: string, orderId?: string) {
    setView("worker"); setSearch(""); setFilter("all"); setStageFilter("all"); setSelectedId(orderId || null); selectProfile(canChooseSector?(id || (actorId === "gestao" ? "corte" : actorId)):actorFor(account.role));
    const url = new URL(window.location.href); url.searchParams.set("view", "worker");
    if (orderId) url.searchParams.set("order", orderId); else url.searchParams.delete("order");
    if(!demo||window.location.protocol!=="file:")window.history.replaceState({}, "", url);
  }
  const orders = useMemo(() => {
    if (!state) return [];
    const term = search.toLocaleLowerCase("pt-BR").trim();
    return state.orders.filter(order => {
      const stage = activeStage(order);
      const match = !term || [order.id, order.name, order.client].join(" ").toLocaleLowerCase("pt-BR").includes(term);
      return match && (filter === "all" || filter === "active" && !!stage || filter === "late" && isLate(order) || filter === "paused" && stage?.status === "paused" || filter === "done" && !stage) && (stageFilter === "all" || stage?.stageId === stageFilter);
    }).sort((a, b) => Number(isLate(b)) - Number(isLate(a)) || a.due.localeCompare(b.due));
  }, [state, search, filter, stageFilter]);
  const attentionOrders = state?.orders.filter(order => isLate(order) || activeStage(order)?.status === "paused") || [];
  const lowMaterials = state?.materials.filter(m => availableQuantity(state, m.id) < m.minimum) || [];
  const selected = state?.orders.find(o => o.id === selectedId);
  const qrOrder = state?.orders.find(o => o.id === qrOrderId);
  const detailsOrder = state?.orders.find(o => o.id === detailsOrderId);
  const receiving = state?.materials.find(m => m.id === receiveId);
  const member = TEAM.find(p => p.id === actorId) || TEAM[0];
  const workerTasks = orders.filter(order => activeStage(order)?.assignedTo === actorId);
  const workerOrder = selected || workerTasks[0];
  const waitingRecords = pending.filter(p => p.status === "pending").length;
  const eventList = useMemo(() => state?.events.filter(event => !search || [event.orderId, event.title, event.detail, TEAM.find(p => p.id === event.actorId)?.name].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).slice().reverse() || [], [state, search]);

  function exportBackup() {
    if(!state)return;
    const payload={app:"MobiLog",version:"R01",workspace:account.workspaceName,exportedAt:new Date().toISOString(),revision:data.revision,state};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="mobilog-copia-"+todayInAcre()+".json";a.click();URL.revokeObjectURL(url);
    message("Cópia do estado exportada. Guarde junto aos registros da turma.");
  }
  function exportOrders() {
    const cell = (value: string | number) => {
      let text = String(value); if (/^[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = [["Pedido", "Móvel", "Destino", "Quantidade", "Prazo", "Etapa", "Progresso", "Responsável"],
      ...orders.map(o => [o.id, o.name, o.client, o.quantity, o.due, orderStateText(o), progress(o) + "%", activeStage(o)?.assignedName || TEAM.find(p => p.id === activeStage(o)?.assignedTo)?.name || "Concluído"])];
    const blob = new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mobilog-pedidos-" + todayInAcre() + ".csv"; a.click(); URL.revokeObjectURL(url);
    message("Relatório dos pedidos exportado.");
  }
  function ordersTable(list: Order[], compact = false) {
    return <div className="table-scroll"><table className="orders-table"><thead><tr><th>Pedido / móvel</th><th>Etapa atual</th>{!compact && <th>Responsável</th>}<th>Prazo</th><th>Progresso</th><th aria-label="Ações"/></tr></thead><tbody>{list.map(order => {
      const current = activeStage(order);
      return <tr key={order.id}><td><button className="order-cell" onClick={() => setSelectedId(order.id)}><span className="furniture-thumb"><FurnitureArt type={order.type}/></span><span><small>{order.id}{order.priority === "alta" && <b className="priority-dot" title="Prioridade alta"/>}</small><strong>{order.name}</strong><em>{order.quantity} un. · {order.client}</em></span></button></td><td><span className="stage-name">{orderStateText(order)}</span><StatusBadge order={order}/></td>{!compact && <td><div className="person-inline"><Avatar id={current?.assignedTo || "gestao"} small/><span>{current ? current.assignedName||TEAM.find(p => p.id === current.assignedTo)?.name : "Finalizado"}</span></div></td>}<td className={isLate(order) ? "text-red" : ""}><span className="date-cell">{formatDate(order.due)}</span>{isLate(order) && <small className="due-note">Atrasado</small>}</td><td><ProgressBar order={order}/></td><td><div className="table-actions"><a className="icon-btn tv-table-link" href={trackingHref(order.id,account.workspaceId)} target="_blank" rel="noopener noreferrer" aria-label={"Acompanhar " + order.id + " na TV (abre em nova aba)"} title="Acompanhar na TV"><Monitor size={17}/></a><button className="icon-btn" aria-label={"QR Code do " + order.id} onClick={() => setQrOrderId(order.id)}><QrCode size={17}/></button><button className="icon-btn" aria-label={"Abrir " + order.id} onClick={() => setSelectedId(order.id)}><ChevronRight size={17}/></button></div></td></tr>;
    })}</tbody></table>{!list.length && <Empty>Nenhum pedido corresponde a esta busca.</Empty>}</div>;
  }
  function filtersBar() {
    return <div className="filters-bar"><div className="filter-tabs">{[{id:"all",label:"Todos"},{id:"active",label:"Em andamento"},{id:"late",label:"Atrasados"},{id:"done",label:"Entregues"}].map(f => <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>{f.label}{f.id === "all" && <span>{state?.orders.length || 0}</span>}</button>)}</div><label className="select-filter"><span className="sr-only">Filtrar etapa</span><select value={stageFilter} onChange={e => setStageFilter(e.target.value)}><option value="all">Todas as etapas</option>{STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>;
  }

  return <div className={"app-shell " + (view === "worker" ? "worker-mode" : "")}>
    <a href="#main-content" className="skip-link">Ir para o conteúdo</a>
    <aside className="sidebar">
      <a className="sidebar-logo" href="/" aria-label="SENAI Hub · início"><img src="/logo-senai-hub.webp" alt="SENAI Hub · Inovação e Tecnologia"/></a>
      <div className="project-brand"><span className="brand-icon"><Hammer size={21}/></span><div><strong>MobiLog</strong><span>LOGÍSTICA + MARCENARIA</span></div></div>
      <span className="nav-caption">GESTÃO DA OFICINA</span>
      <nav aria-label="Navegação principal">{NAV.map(item => { const Icon = item.icon; return <button key={item.id} className={"nav-item " + (view === item.id ? "active" : "")} aria-current={view === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><Icon size={19}/><span>{item.label}</span>{item.id === "orders" && <b>{state?.orders.length || "—"}</b>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="expo-card"><span className="badge expo"><BookOpen size={13}/>MUNDO SENAI</span><strong>Da madeira<br/>à entrega.</strong><p>Um projeto de Logística para conectar toda a marcenaria.</p><button onClick={() => setGuide(true)}>Conheça o projeto <ArrowUpRight size={15}/></button></div><button className="nav-item help-link" onClick={() => setGuide(true)}><CircleHelp size={18}/><span>Como demonstrar</span></button><div className="sidebar-version"><span className="status-dot"/>Projeto educacional <b>R01</b></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <a className="mobile-logo" href="/"><img src="/logo-senai-hub.webp" alt="SENAI Hub"/></a>
        <div className="breadcrumb"><span>Marcenaria</span><ChevronRight size={13}/><strong>{view === "worker" ? "Aplicativo" : NAV.find(n => n.id === view)?.label}</strong></div>
        <div className="topbar-right"><Connection status={connection} pending={waitingRecords}/><span className="topbar-divider"/>
          <button className="btn app-button" onClick={() => view === "worker" ? navigate("dashboard") : openWorker()}><Smartphone size={17}/><span>{view === "worker" ? "Painel da Logística" : "App do marceneiro"}</span></button>
          <button className="icon-btn notification-btn" aria-label={"Alertas: " + (attentionOrders.length + lowMaterials.length)} onClick={() => setAlerts(true)}><Bell size={20}/>{attentionOrders.length + lowMaterials.length > 0 && <i/>}</button><Avatar id={view === "worker" ? actorId : "gestao"}/>
        </div>
      </header>
      <main id="main-content" className="main-content">
        <div className={"account-strip "+(demo?"demo-strip":"")}><span>{demo?"Demonstração local · dados fictícios":account.name+" · "+account.workspaceName}</span><div>{demo?<><button onClick={exportBackup} disabled={!state}>Cópia JSON</button><button onClick={()=>{if(window.confirm("Reiniciar os exemplos deste navegador?"))data.resetDemo();}}>Reiniciar exemplos</button><a href="/">Entrar na nuvem</a></>:<>{canManage&&<button onClick={exportBackup} disabled={!state}>Cópia JSON</button>}<button onClick={onSwitchWorkspace}>Equipes e turmas</button><button onClick={()=>{if(!pending.length||window.confirm("Há tentativas neste aparelho. Elas ficam vinculadas à sua conta e serão enviadas quando você voltar. Sair agora?"))onLogout();}}>Sair</button></>}</div></div>
        <div className="page-heading"><div><div className="page-eyebrow"><span/>LOGÍSTICA EM MOVIMENTO</div><h1>{TITLES[view].title}</h1><p>{TITLES[view].description}</p></div><div className="heading-actions">{view === "orders" && <button className="btn secondary" onClick={exportOrders} disabled={!state}><Download size={16}/>Exportar</button>}{view !== "worker" && canManage && <button className="btn primary" onClick={() => setNewOrder(true)} disabled={!state}><Plus size={18}/>Novo pedido</button>}{view === "worker" && <button className="btn secondary worker-back" onClick={() => navigate("dashboard")}><ArrowLeft size={16}/>Ver painel</button>}</div></div>
        {(connection === "offline" || pending.length > 0 || data.storageError) && <div className={"sync-banner " + (data.storageError || pending.some(p => p.status === "blocked") ? "warning" : "")}><CloudOff size={19}/><div><strong>{data.storageError || (pending.length ? pending.length + " registro(s) neste aparelho" : "Aguardando conexão com o sistema")}</strong><p>{pending.length ? "Etapas pendentes serão liberadas após confirmação do servidor." : state ? "Exibindo a última consulta guardada neste aparelho." : "Conecte-se para carregar os pedidos compartilhados."}</p></div><button className="btn secondary" onClick={() => pending.length ? setShowPending(true) : void refresh()}>{pending.length ? "Ver registros" : "Tentar novamente"}</button></div>}
        <div className="search-and-label"><label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={view === "history" ? "Buscar no histórico…" : "Buscar pedido, móvel ou destino…"} aria-label="Pesquisar"/><kbd>⌕</kbd></label><span className="demo-label"><span/>{demo?"DEMONSTRAÇÃO LOCAL · SEM NUVEM":account.workspaceName}</span></div>
        {!state ? <section className="loading-grid" aria-live="polite"><div className="loading-card"><Cloud size={31}/><h2>Conectando a oficina</h2><p>{connection === "offline" ? "Os pedidos aparecerão quando a conexão estiver disponível." : "Carregando os pedidos e as atividades da equipe…"}</p><button className="btn secondary" onClick={() => void refresh()}><RefreshCw size={16}/>Atualizar</button></div></section> : <>
          {view === "dashboard" && <>
            <div className="stats-grid">
              {[{label:"Pedidos ativos",value:state.orders.filter(o => progress(o)<100).length,detail:"Da preparação à expedição",icon:ClipboardList,color:"blue",click:"active"},
                {label:"Em execução",value:state.orders.filter(o => activeStage(o)?.status==="in_progress").length,detail:"Atividades iniciadas pela equipe",icon:Hammer,color:"orange",click:"active"},
                {label:"Precisam de atenção",value:attentionOrders.length,detail:"Pausas ou prazos vencidos",icon:AlertTriangle,color:"amber",click:"attention"},
                {label:"Pedidos entregues",value:state.orders.filter(o => progress(o)===100).length,detail:"Ciclo de produção concluído",icon:Truck,color:"green",click:"done"}].map(stat => { const Icon = stat.icon; return <button className="stat-card" key={stat.label} onClick={() => { if (stat.click === "attention") setAlerts(true); else { navigate("orders"); setFilter(stat.click); } }}><span className={"stat-icon " + stat.color}><Icon size={21}/></span><span className="stat-label">{stat.label}</span><strong>{stat.value.toString().padStart(2,"0")}</strong><span className="stat-detail">{stat.detail}</span><ArrowUpRight className="stat-arrow" size={15}/></button>; })}
            </div>
            <div className="dashboard-grid"><section className="panel main-orders"><div className="panel-heading"><div><h2>Pedidos em movimento <span className="count-badge">{orders.filter(o=>progress(o)<100).length}</span></h2><p>Os próximos passos da sua oficina.</p></div><button className="text-btn" onClick={() => navigate("orders")}>Ver todos <ChevronRight size={15}/></button></div>{ordersTable(orders.filter(o => progress(o)<100).slice(0,4),true)}</section>
            <aside className="connected-card"><div className="connected-label"><span className="live-dot"/><span>OFICINA CONECTADA</span></div><h2>O trabalho acontece.<br/>O fluxo acompanha.</h2><p>Cada confirmação no celular atualiza os pedidos da equipe.</p><div className="hero-furniture"><FurnitureArt large/><span className="floating-confirm"><CircleCheck size={17}/>Etapa registrada</span></div><div className="connected-people"><div>{TEAM.slice(1).map(p => <Avatar key={p.id} id={p.id} small/>)}</div><span>Produção + Logística</span></div>{orders.length>0&&<a className="btn navy full" href={trackingHref((orders.find(o=>progress(o)<100)||orders[0]).id,account.workspaceId)} target="_blank" rel="noopener noreferrer"><Monitor size={17}/>Acompanhar na TV <ArrowUpRight size={16}/></a>}</aside></div>
            <section className="panel flow-panel"><div className="panel-heading"><div><h2>Da matéria-prima à entrega</h2><p>Selecione uma etapa para acompanhar os pedidos.</p></div><span className="badge wood"><Hammer size={13}/>MARCENARIA</span></div><div className="stage-overview">{STAGES.map((stage,index)=>{ const Icon=STAGE_ICONS[index]; const count=state.orders.filter(o=>stageIndex(o)===index).length; return <button className={count?"has-orders":""} key={stage.id} onClick={()=>{navigate("production");setStageFilter(stage.id);}}><span className="stage-overview-icon"><Icon size={20}/></span><strong>{stage.name}</strong><small>{count} pedido{count!==1?"s":""}</small>{index<STAGES.length-1&&<ChevronRight className="stage-connector" size={13}/>}</button>;})}</div></section>
            <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><h2>Últimas confirmações</h2><p>Registros recebidos pelo sistema.</p></div><button className="text-btn" onClick={()=>navigate("history")}>Histórico <ChevronRight size={15}/></button></div><div className="activity-list">{eventList.slice(0,4).map(event=><button className="activity-item" key={event.id} onClick={()=>event.orderId?setSelectedId(event.orderId):navigate("materials")}><Avatar id={event.actorId} small/><div><strong>{event.title}</strong><p>{event.orderId&&<span>{event.orderId} · </span>}{event.detail}</p></div><time>{formatDateTime(event.at)}</time></button>)}</div></section>
            <section className="panel supply-panel"><div className="panel-heading"><div><h2>Abastecimento</h2><p>Disponibilidade para os próximos pedidos.</p></div><Boxes size={20}/></div>{lowMaterials.length ? lowMaterials.map(m=><div className="supply-item" key={m.id}><span className="supply-icon"><Package size={19}/></span><div><strong>{m.name}</strong><p>{qty(availableQuantity(state,m.id))} {m.unit} disponíveis</p></div><span className="badge amber">Repor</span></div>):<Empty>Materiais acima do saldo mínimo.</Empty>}<button className="text-btn supply-link" onClick={()=>navigate("materials")}>Conferir materiais <ArrowUpRight size={16}/></button></section></div>
          </>}
          {view === "orders" && <section className="panel">{filtersBar()}{ordersTable(orders)}</section>}
          {view === "production" && <><section className="panel production-filters">{filtersBar()}</section><div className="kanban">{[
            {name:"Planejamento",desc:"Pedido e materiais",color:"blue",match:(o:Order)=>stageIndex(o)===0},
            {name:"Produção",desc:"Corte, montagem e acabamento",color:"orange",match:(o:Order)=>stageIndex(o)>0&&stageIndex(o)<5},
            {name:"Qualidade",desc:"Inspeção e aprovação",color:"purple",match:(o:Order)=>stageIndex(o)===5},
            {name:"Expedição e entrega",desc:"Embalagem até o recebimento",color:"green",match:(o:Order)=>stageIndex(o)>=6},
          ].map(column=><section className={"kanban-column "+column.color} key={column.name}><div className="kanban-heading"><h2><span/>{column.name}</h2><b>{orders.filter(column.match).length}</b><p>{column.desc}</p></div><div className="kanban-cards">{orders.filter(column.match).map(order=><button className="kanban-card" key={order.id} onClick={()=>setSelectedId(order.id)}><div className="kanban-card-top"><span>{order.id}</span><StatusBadge order={order}/></div><div className="kanban-image"><FurnitureArt type={order.type}/></div><h3>{order.name}</h3><p>{order.quantity} un. · {order.client}</p><div className="kanban-stage"><span>{orderStateText(order)}</span><small>{progress(order)}%</small></div><ProgressBar order={order}/><div className="kanban-card-bottom"><Avatar id={activeStage(order)?.assignedTo||"gestao"} small/><span className={isLate(order)?"text-red":""}><CalendarDays size={13}/>{formatDate(order.due)}</span></div></button>)}{!orders.some(column.match)&&<p className="kanban-empty">Nenhum pedido nesta etapa.</p>}</div></section>)}</div></>}
          {view === "materials" && <>
            <div className="materials-notice"><Boxes size={25}/><div><strong>Saldo, reserva e disponibilidade</strong><p>O planejamento reserva materiais. Corte, preparação e montagem registram o consumo dos materiais correspondentes.</p></div><span className="badge amber">{lowMaterials.length} item(ns) para repor</span></div>
            <section className="panel"><div className="panel-heading"><div><h2>Materiais da oficina</h2><p>Quantidades e especificações demonstrativas.</p></div></div><div className="table-scroll"><table className="materials-table"><thead><tr><th>Material</th><th>Saldo físico</th><th>Reservado</th><th>Disponível</th><th>Mínimo</th><th>Situação</th><th/></tr></thead><tbody>{state.materials.filter(m=>!search||m.name.toLowerCase().includes(search.toLowerCase())).map(m=><tr key={m.id}><td><div className="material-name"><span><Package size={20}/></span><div><strong>{m.name}</strong><small>{m.specification}</small></div></div></td><td>{qty(m.stock)} <small>{m.unit}</small></td><td>{qty(reservedQuantity(state,m.id))} <small>{m.unit}</small></td><td><strong>{qty(availableQuantity(state,m.id))}</strong> <small>{m.unit}</small></td><td>{qty(m.minimum)} <small>{m.unit}</small></td><td><span className={"badge "+(availableQuantity(state,m.id)<m.minimum?"amber":"green")}>{availableQuantity(state,m.id)<m.minimum?"Repor":"Disponível"}</span></td><td><button className="btn secondary small" disabled={!canManage} onClick={()=>{setReceiveId(m.id);setReceiveQuantity(1);setReceiveReference("");}}><Plus size={14}/>Receber</button></td></tr>)}</tbody></table></div></section>
            <p className="context-note">Receitas, saldos e mínimos são exemplos para o projeto. Confira unidades, desenhos e consumos antes de utilizar em uma marcenaria real.</p>
          </>}
          {view === "team" && <TeamPanel account={account} state={state} onMessage={message} onOpenWorker={id=>openWorker(id)}/>}
          {view === "history" && <section className="panel"><div className="panel-heading"><div><h2>Histórico da oficina <span className="count-badge">{eventList.length}</span></h2><p>Registros iniciais podem ser simulados; as novas confirmações identificam a conta responsável.</p></div></div><div className="history-list">{eventList.slice(0,100).map(event=><div className="history-item" key={event.id}><span className={"history-marker "+(event.kind==="stage-pause"||event.kind==="quality-rework"?"amber":"")}>{event.kind==="stage-pause"||event.kind==="quality-rework"?<AlertTriangle size={17}/>:<CircleCheck size={17}/>}</span><div><strong>{event.title}</strong><p>{event.detail}</p><div className="history-person"><Avatar id={event.actorId} small/><span>{event.performer?.name||"Exemplo · "+TEAM.find(p=>p.id===event.actorId)?.name}</span>{event.orderId&&<button onClick={()=>setSelectedId(event.orderId)}>{event.orderId}<ArrowUpRight size={12}/></button>}</div></div><time>{formatDateTime(event.at)}</time></div>)}{!eventList.length&&<Empty>Nenhum registro encontrado.</Empty>}</div></section>}
          {view === "worker" && <div className="worker-layout"><aside className="worker-list"><section className="panel worker-profile"><div className="worker-profile-top"><Avatar id={actorId}/><div><span className="eyebrow">{demo?"PERFIL DEMONSTRATIVO":canChooseSector?"VISÃO POR SETOR":"SEU ACESSO"}</span><h2>{demo?member.name:account.name}</h2><p>{member.role}</p></div></div>{canChooseSector?<label className="field">{demo?"Setor demonstrativo":"Visualizar setor"}<select value={actorId} onChange={e=>{selectProfile(e.target.value);setSelectedId(null);}}>{TEAM.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>:<p className="worker-identity-note">Os registros usarão seu login individual.</p>}<Connection status={connection} pending={waitingRecords}/></section><div className="worker-list-heading"><h3>Atividades disponíveis</h3><span>{workerTasks.length}</span></div>{workerTasks.map(order=><button key={order.id} className={"worker-order "+(workerOrder?.id===order.id?"selected":"")} onClick={()=>setSelectedId(order.id)}><span className="worker-order-thumb"><FurnitureArt type={order.type}/></span><div><small>{order.id}</small><strong>{order.name}</strong><span>{orderStateText(order)} · {order.quantity} un.</span></div><ChevronRight size={16}/></button>)}{!workerTasks.length&&<Empty>Nenhuma atividade liberada para este perfil.</Empty>}<button className="text-btn mobile-help" onClick={()=>setGuide(true)}><CircleHelp size={16}/>Como instalar e demonstrar</button></aside><section className="panel worker-task-detail">{workerOrder?<><div className="panel-heading"><div><span className="eyebrow">SUA PRÓXIMA CONFIRMAÇÃO</span><h2>{orderStateText(workerOrder)}</h2></div><button className="btn secondary small" onClick={()=>setQrOrderId(workerOrder.id)}><QrCode size={16}/>Ficha QR</button></div><TaskPanel key={workerOrder.id+"-"+activeStage(workerOrder)?.stageId+"-"+activeStage(workerOrder)?.status} order={workerOrder} state={state} actorId={actorId} account={account} run={run} pending={pending} busy={busy} onMessage={message} onProfile={selectProfile}/><div className="worker-route"><h3>Jornada do pedido</h3><OrderRoute order={workerOrder} compact/></div></>:<div className="worker-no-task"><Hammer size={42}/><h2>Tudo em dia por aqui.</h2><p>As próximas etapas aparecerão após a confirmação da atividade anterior.</p><button className="btn secondary" onClick={()=>void refresh()}><RefreshCw size={16}/>Consultar atividades</button></div>}</section></div>}
        </>}
        <footer className="workspace-footer"><span>SENAI Hub <i/>Logística + Marcenaria <i/>Mundo SENAI</span><span>{syncedAt?"Última consulta: "+new Date(syncedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"America/Rio_Branco"}):demo?"Demonstração R01":"MobiLog R01"}<button onClick={()=>setGuide(true)}>Sobre o projeto <CircleHelp size={13}/></button></span></footer>
      </main>
      <nav className="mobile-nav" aria-label="Navegação no celular"><button className={view==="dashboard"?"active":""} onClick={()=>navigate("dashboard")}><LayoutDashboard size={19}/><span>Painel</span></button><button className={view==="orders"?"active":""} onClick={()=>navigate("orders")}><ClipboardList size={19}/><span>Pedidos</span></button><button className={view==="worker"?"active":""} onClick={()=>openWorker()}><Smartphone size={19}/><span>Atividades</span></button><button className={view==="materials"?"active":""} onClick={()=>navigate("materials")}><Boxes size={19}/><span>Materiais</span></button><button className={view==="team"?"active":""} onClick={()=>navigate("team")}><Users size={19}/><span>Equipe</span></button></nav>
    </div>
    {newOrder&&state&&<NewOrder state={state} busy={busy} run={run} onClose={()=>setNewOrder(false)} onMessage={message}/>}
    {selected&&state&&view!=="worker"&&<Modal title={selected.name} subtitle={selected.id+" · "+selected.quantity+" un. · "+selected.client} onClose={()=>setSelectedId(null)} drawer><div className="drawer-order-overview"><FurnitureArt type={selected.type}/><div><StatusBadge order={selected}/><span className="drawer-due"><CalendarDays size={15}/>Entrega: {formatDate(selected.due)}</span><ProgressBar order={selected}/></div></div><a className="btn navy full tracking-launch" href={trackingHref(selected.id,account.workspaceId)} target="_blank" rel="noopener noreferrer"><Monitor size={18}/>Acompanhar na TV<ArrowUpRight size={16}/></a><div className="drawer-section-heading"><h3>Jornada do pedido</h3><button className="btn secondary small" onClick={()=>setQrOrderId(selected.id)}><QrCode size={15}/>Ficha QR</button></div><OrderRoute order={selected}/>{!demo&&account.role==="admin"&&<StageAssignment account={account} order={selected} busy={busy} run={run} onMessage={message}/>}
{activeStage(selected)&&<div className="drawer-action"><TaskPanel key={selected.id+"-"+activeStage(selected)?.stageId+"-"+activeStage(selected)?.status} order={selected} state={state} actorId={canChooseSector?"gestao":actorFor(account.role)} account={account} run={run} pending={pending} busy={busy} onMessage={message} onProfile={id=>openWorker(id,selected.id)}/></div>}<div className="drawer-section-heading"><h3>Materiais previstos</h3><span className="badge wood">{selected.materialState==="consumed"?"Consumo registrado":selected.materialState==="reserved"?"Reservados":"A reservar"}</span></div><div className="drawer-materials">{selected.materials.map(item=>{const m=state.materials.find(m=>m.id===item.materialId)!;return <div key={m.id}><span>{m.name}</span><strong>{qty(item.quantity)} {m.unit} · {item.consumed?"consumido":selected.materialState==="reserved"?"reservado":"previsto"}</strong></div>;})}</div>{selected.notes&&<div className="order-notes"><strong>Observação</strong><p>{selected.notes}</p></div>}{selected.reworks>0&&<p className="inline-note amber">{selected.reworks} solicitação(ões) de retrabalho. Consulte os motivos no histórico.</p>}<button className="text-btn full" onClick={()=>{setSearch(selected.id);setView("history");setSelectedId(null);}}>Ver registros deste pedido <ArrowUpRight size={15}/></button></Modal>}
    {qrOrder&&<QRModal key={qrOrder.id} order={qrOrder} account={account} onClose={()=>setQrOrderId(null)} onMessage={message} onEdit={canManage?()=>{setDetailsOrderId(qrOrder.id);setQrOrderId(null);}:undefined}/>}
    {detailsOrder&&canManage&&<ProductDetailsEditor key={detailsOrder.id} order={detailsOrder} busy={busy} run={run} onClose={()=>setDetailsOrderId(null)} onMessage={message}/>}
    {receiving&&<Modal title="Receber material" subtitle={receiving.name} onClose={()=>setReceiveId(null)}><form onSubmit={event=>{event.preventDefault();void run({kind:"stock-receive",actorId:"gestao",materialId:receiving.id,quantity:receiveQuantity,reason:receiveReference}).then(result=>{message(result.message);if(result.status!=="blocked")setReceiveId(null);});}}><div className="inline-note blue"><Package size={19}/><span>Saldo atual: <strong>{qty(receiving.stock)} {receiving.unit}</strong></span></div><label className="field">Quantidade recebida ({receiving.unit})<input autoFocus type="number" min={receiving.unit==="un."?1:0.001} step={receiving.unit==="un."?1:"any"} max={10000} required value={receiveQuantity} onChange={e=>setReceiveQuantity(Number(e.target.value))}/></label><label className="field">Referência do recebimento<input required minLength={3} maxLength={160} value={receiveReference} onChange={e=>setReceiveReference(e.target.value)} placeholder="Ex.: Recebimento didático 01"/></label><div className="button-row"><button type="button" className="btn secondary" onClick={()=>setReceiveId(null)}>Cancelar</button><button className="btn primary" disabled={busy}>Confirmar recebimento</button></div></form></Modal>}
    {alerts&&<Modal title="O que precisa de atenção" subtitle="Logística da oficina" onClose={()=>setAlerts(false)}><div className="alerts-list">{attentionOrders.map(order=><button key={order.id} onClick={()=>{setAlerts(false);setView("orders");setSelectedId(order.id);}}><AlertTriangle size={20}/><div><strong>{order.id} · {order.name}</strong><p>{activeStage(order)?.status==="paused"?activeStage(order)?.issue:"Prazo de entrega vencido."}</p></div><ChevronRight size={16}/></button>)}{lowMaterials.map(m=><button key={m.id} onClick={()=>{setAlerts(false);navigate("materials");}}><Boxes size={20}/><div><strong>{m.name}</strong><p>{qty(availableQuantity(state!,m.id))} {m.unit} disponíveis; mínimo {qty(m.minimum)} {m.unit}.</p></div><ChevronRight size={16}/></button>)}{!attentionOrders.length&&!lowMaterials.length&&<Empty>Nenhuma pendência identificada.</Empty>}</div></Modal>}
    {showPending&&<Modal title="Registros neste aparelho" subtitle="Sincronização" onClose={()=>setShowPending(false)}><p className="muted">Uma etapa só é liberada para a equipe após confirmação do servidor.</p><div className="pending-list">{pending.map(item=><div key={item.command.eventId}><div><strong>{item.command.orderId||"Oficina"} · {item.status==="blocked"?"Precisa de revisão":"Aguardando envio"}</strong><p>{item.error||"Guardado no aparelho; aguardando confirmação na nuvem."}</p></div>{item.status==="blocked"&&<button className="btn secondary small" onClick={()=>dismiss(item.command.eventId)}>Descartar tentativa</button>}</div>)}</div><div className="button-row"><button className="btn secondary" onClick={()=>setShowPending(false)}>Fechar</button><button className="btn primary" disabled={busy} onClick={()=>void retry().then(r=>message(r.message))}><RefreshCw size={16}/>Sincronizar registros</button></div></Modal>}
    {guide&&<Modal title="Da madeira à entrega" subtitle="Projeto Mundo SENAI · R01" onClose={()=>setGuide(false)} className="guide-modal"><div className="guide-intro"><span><Hammer size={26}/></span><p>Os alunos de Logística organizam pedidos, materiais, etapas e entregas. A equipe da marcenaria confirma cada atividade pelo smartphone.</p></div><ol className="guide-steps"><li><strong>Abra o painel em um computador.</strong><p>Escolha um pedido ou cadastre um móvel demonstrativo.</p></li><li><strong>Abra o aplicativo em outro aparelho.</strong><p>Use “App do marceneiro” e entre com o acesso individual fornecido pelo instrutor; na demonstração local, escolha um setor. O QR da peça abre a ficha pública de rastreabilidade, sem login.</p></li><li><strong>Inicie e confirme uma etapa.</strong><p>Marque o checklist e confira a quantidade do lote. O servidor registra a confirmação e libera a etapa seguinte.</p></li><li><strong>Acompanhe a atualização no painel.</strong><p>Abra o pedido e selecione “Acompanhar na TV”. Use “Tela cheia” para apresentar o móvel em 3D e a etapa em destaque. A consulta de apoio ocorre a cada 6 segundos com a tela aberta e conexão disponível.</p></li></ol><div className="guide-install"><Smartphone size={23}/><div><h3>Instale na tela inicial</h3><p>No Android, procure “Instalar aplicativo” no navegador. No iPhone, use Safari → Compartilhar → Adicionar à Tela de Início.</p></div>{installEvent&&<button className="btn primary" onClick={()=>void installEvent.prompt().then(()=>installEvent.userChoice).then(choice=>{if(choice.outcome==="accepted")setInstallEvent(null);})}>Instalar</button>}</div><div className="guide-limits"><strong>Sobre esta versão</strong><p>A demonstração local usa dados fictícios e funciona somente neste navegador. No ambiente em nuvem, cada pessoa entra com sua conta e recebe uma função na equipe. Confira as receitas de materiais e o processo da marcenaria antes de usar dados reais.</p><p>Registros sem conexão ficam no aparelho como pendentes. Mantenha o aplicativo aberto ao reconectar para sincronizar. A perda dos dados do navegador também pode apagar tentativas ainda não enviadas.</p></div></Modal>}
    {toast&&<div className="toast" role="status"><CircleCheck size={19}/><span>{toast}</span><button className="icon-btn" aria-label="Fechar aviso" onClick={()=>setToast("")}>×</button></div>}
  </div>;
}
