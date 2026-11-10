const sections=[
{title:"Início e apresentação",desc:"Banner principal, chamada de sustentabilidade, pesquisa de descarte e atalhos.",id:"inicio"},
{title:"Indicadores de impacto",desc:"Números de reciclagem, CO₂ evitado e pontos de entrega.",id:"impacto"},
{title:"Mapa e pontos de coleta",desc:"Mapa, locais de entrega, endereços, horários e filtros por material.",id:"coleta"},
{title:"Calendário de coleta por CEP",desc:"Consulta dos dias e horários previstos de coleta na rua do cidadão.",id:"calendario"},
{title:"Guia de descarte",desc:"Pesquisa de materiais e orientações por categoria de resíduo.",id:"descarte"},
{title:"Transparência e relatórios",desc:"Gráficos, indicadores públicos e documentos para consulta.",id:"transparencia"},
{title:"Área do cidadão",desc:"Solicitação de coleta de volumosos, denúncias e programa EcoPontos.",id:"cidadao"},
{title:"Área para empresas",desc:"Orientações para grandes geradores, PGRS, MTR e cooperativas.",id:"empresas"}
];
const root=document.querySelector("#sectionReviews");
root.innerHTML=sections.map((s,i)=>`<article class="review-card" data-section="${s.id}">
<div class="review-card-top"><div><h2>${s.title}</h2><p>${s.desc}</p></div><span class="section-number">${String(i+1).padStart(2,"0")}</span></div>
<div class="choice-grid" role="radiogroup" aria-label="Avaliação: ${s.title}">
${[["manter","Manter"],["modificar","Modificar"],["retirar","Retirar"],["adicionar","Ampliar / adicionar"]].map(([v,l])=>`<label class="choice"><input type="radio" name="${s.id}-choice" value="${v}"><span>${l}</span></label>`).join("")}
</div>
<label class="review-label" for="${s.id}-note">Observações sobre esta seção (opcional)</label>
<textarea id="${s.id}-note" name="${s.id}-note" placeholder="O que você gostaria de mudar, incluir ou retirar?"></textarea>
</article>`).join("");
const form=document.querySelector("#reviewForm");
function collect(){
const reviews=sections.map(s=>({section:s.title,decision:form.querySelector(`[name="${s.id}-choice"]:checked`)?.value||"não avaliado",comment:document.getElementById(`${s.id}-note`).value.trim()}));
return {project:"EcoCidade",submittedAt:new Date().toISOString(),client:{name:document.querySelector("#clientName").value.trim(),contact:document.querySelector("#clientContact").value.trim()},reviews,newIdeas:document.querySelector("#newIdeas").value.trim(),finalApproval:document.querySelector("#finalApproval").checked};
}
function updateProgress(){
const count=sections.filter(s=>form.querySelector(`[name="${s.id}-choice"]:checked`)).length;
document.querySelector("#progressText").textContent=`${count} de ${sections.length} seções avaliadas`;
document.querySelector("#progressFill").style.width=`${count/sections.length*100}%`;
}
form.addEventListener("change",updateProgress);
function restore(data){
if(!data)return;
data.reviews?.forEach((r,i)=>{const s=sections[i];if(!s)return;const radio=form.querySelector(`[name="${s.id}-choice"][value="${r.decision}"]`);if(radio)radio.checked=true;document.getElementById(`${s.id}-note`).value=r.comment||"";});
document.querySelector("#clientName").value=data.client?.name||"";
document.querySelector("#clientContact").value=data.client?.contact||"";
document.querySelector("#newIdeas").value=data.newIdeas||"";
document.querySelector("#finalApproval").checked=!!data.finalApproval;updateProgress();
}
document.querySelector("#saveBtn").addEventListener("click",()=>{localStorage.setItem("ecocidadeClientReview",JSON.stringify(collect()));document.querySelector("#savedStatus").textContent="Avaliação salva neste navegador."});
document.querySelector("#exportBtn").addEventListener("click",()=>{const data=collect();const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="avaliacao-cliente-ecocidade.json";a.click();URL.revokeObjectURL(url);document.querySelector("#savedStatus").textContent="Arquivo de avaliação gerado. Encaminhe-o à equipe do projeto."});
document.querySelector("#clearBtn").addEventListener("click",()=>{if(!confirm("Deseja apagar todas as respostas desta avaliação?"))return;form.reset();localStorage.removeItem("ecocidadeClientReview");updateProgress();document.querySelector("#savedStatus").textContent="Respostas apagadas."});
try{restore(JSON.parse(localStorage.getItem("ecocidadeClientReview")))}catch(e){console.warn("Não foi possível recuperar a avaliação salva.",e)}
document.querySelector("#sendBtn").addEventListener("click",async()=>{
const status=document.querySelector("#savedStatus"),btn=document.querySelector("#sendBtn");
if(!document.querySelector("#finalApproval").checked){status.textContent="Marque a confirmação final antes de enviar.";return}
const data=collect();
if(!data.reviews.some(r=>r.decision!=="não avaliado")&&!data.newIdeas){status.textContent="Avalie ao menos uma seção ou escreva uma sugestão antes de enviar.";return}
btn.disabled=true;status.textContent="Enviando...";
try{
const res=await fetch("/api/avaliacoes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
if(!res.ok)throw new Error((await res.json().catch(()=>({}))).erro||"Falha no envio");
localStorage.removeItem("ecocidadeClientReview");
status.textContent="Avaliação enviada com sucesso. Obrigado! Use “Ver resultado” para consultar os envios.";
}catch(e){status.textContent="Não foi possível enviar agora ("+e.message+"). Use “Baixar avaliação” para guardar uma cópia e tente novamente.";}
finally{btn.disabled=false}
});
