const KEY="ecocidadeAdminPwd";
const $=s=>document.querySelector(s);
const LABEL={manter:"Manter",modificar:"Modificar",retirar:"Retirar",adicionar:"Ampliar / adicionar","não avaliado":"Não avaliado"};
const CLASS={manter:"b-manter",modificar:"b-modificar",retirar:"b-retirar",adicionar:"b-adicionar","não avaliado":"b-nao"};
let dados=[];

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function badge(d){return el("span","badge "+(CLASS[d]||"b-nao"),LABEL[d]||d)}
function fmt(iso){try{return new Date(iso).toLocaleString("pt-BR")}catch(e){return iso}}

async function carregar(){
const pwd=sessionStorage.getItem(KEY)||"";
const res=await fetch("/api/avaliacoes",{headers:{"X-Admin-Password":pwd}});
const body=await res.json().catch(()=>({}));
if(!res.ok){const err=new Error(body.erro||"Erro ao carregar");err.status=res.status;throw err}
dados=body;render();
}

function render(){
$("#loginBox").classList.add("hidden");$("#panel").classList.remove("hidden");
const sum=$("#summary");sum.replaceChildren();
const list=$("#list");list.replaceChildren();
if(!dados.length){list.append(el("p","rs-empty","Nenhuma avaliação enviada até agora."));return}

// resumo geral
const total={manter:0,modificar:0,retirar:0,adicionar:0};
const porSecao={};
dados.forEach(a=>a.reviews.forEach(r=>{
if(total[r.decision]!==undefined)total[r.decision]++;
const s=porSecao[r.section]||(porSecao[r.section]={manter:0,modificar:0,retirar:0,adicionar:0});
if(s[r.decision]!==undefined)s[r.decision]++;
}));
const stats=el("div","rs-summary");
[["Avaliações recebidas",dados.length],["Manter",total.manter],["Modificar",total.modificar],["Retirar",total.retirar],["Ampliar / adicionar",total.adicionar]].forEach(([l,v])=>{
const s=el("div","rs-stat");s.append(el("b","",String(v)),el("span","",l));stats.append(s)});
sum.append(stats);

const box=el("div","rs-box");box.append(el("h2","","Visão geral por seção"));
const wrap=el("div","rs-wrap"),t=el("table","rs-table"),thead=el("thead"),hr=el("tr");
["Seção","Manter","Modificar","Retirar","Ampliar"].forEach(h=>hr.append(el("th","",h)));
thead.append(hr);t.append(thead);
const tb=el("tbody");
Object.entries(porSecao).forEach(([nome,c])=>{const tr=el("tr");tr.append(el("td","",nome),el("td","",String(c.manter)),el("td","",String(c.modificar)),el("td","",String(c.retirar)),el("td","",String(c.adicionar)));tb.append(tr)});
t.append(tb);wrap.append(t);box.append(wrap);sum.append(box);

// cada avaliação
dados.forEach(a=>{
const card=el("article","rs-box");
const head=el("div","rs-head"),left=el("div");
left.append(el("h3","",a.client.name||"Cliente não identificado"));
left.append(el("p","rs-meta",[a.client.contact,fmt(a.submittedAt)].filter(Boolean).join(" · ")));
const right=el("div");
right.append(badge(a.finalApproval?"manter":"não avaliado"));
right.lastChild.textContent=a.finalApproval?"Confirmada pelo cliente":"Sem confirmação final";
const del=el("button","btn btn-outline","Excluir");del.type="button";del.style.marginLeft="8px";
del.addEventListener("click",()=>excluir(a.id));right.append(del);
head.append(left,right);card.append(head);
a.reviews.forEach(r=>{
const it=el("div","rs-item"),top=el("div","rs-item-top");
top.append(el("strong","",r.section),badge(r.decision));it.append(top);
if(r.comment)it.append(el("p","rs-comment",r.comment));
card.append(it)});
if(a.newIdeas){card.append(el("h2","","Sugestões de novos recursos"));card.lastChild.style.marginTop="14px";card.append(el("div","rs-ideas",a.newIdeas))}
list.append(card);
});
}

async function excluir(id){
if(!confirm("Excluir esta avaliação definitivamente?"))return;
const res=await fetch("/api/avaliacoes/"+encodeURIComponent(id),{method:"DELETE",headers:{"X-Admin-Password":sessionStorage.getItem(KEY)||""}});
if(res.ok)carregar().catch(e=>alert(e.message));else alert("Não foi possível excluir.");
}

async function entrar(){
sessionStorage.setItem(KEY,$("#pwd").value);
$("#loginError").textContent="";
try{await carregar()}catch(e){
sessionStorage.removeItem(KEY);
$("#loginError").textContent=e.status===401?"Senha incorreta.":e.message;
}}

$("#loginBtn").addEventListener("click",entrar);
$("#pwd").addEventListener("keydown",e=>{if(e.key==="Enter")entrar()});
$("#refreshBtn").addEventListener("click",()=>carregar().catch(e=>alert(e.message)));
$("#logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem(KEY);location.reload()});
$("#downloadBtn").addEventListener("click",()=>{
const url=URL.createObjectURL(new Blob([JSON.stringify(dados,null,2)],{type:"application/json"}));
const a=document.createElement("a");a.href=url;a.download="avaliacoes-ecocidade.json";a.click();URL.revokeObjectURL(url)});
if(sessionStorage.getItem(KEY))carregar().catch(()=>sessionStorage.removeItem(KEY));
