const points=[
 {name:"Ecoponto Centro",address:"Av. João Pessoa, 1250",type:["reciclaveis","eletronicos","pilhas"],hours:"Seg. a sáb. • 8h às 18h"},
 {name:"Ponto Verde Zona Sul",address:"Av. Cavalhada, 3100",type:["oleo","reciclaveis"],hours:"Seg. a sex. • 9h às 17h"},
 {name:"Estação de Reciclagem Norte",address:"Rua dos Andradas, 450",type:["eletronicos","pilhas","reciclaveis"],hours:"Seg. a sáb. • 8h às 17h"},
 {name:"Cooperativa Recomeço",address:"Rua Voluntários da Pátria, 2200",type:["reciclaveis","oleo"],hours:"Seg. a sex. • 8h às 16h"}
];
const materials=[
 {name:"Garrafa PET",icon:"♻",category:"reciclaveis",desc:"Esvazie, retire o excesso de resíduos e, se possível, amasse. Encaminhe à coleta seletiva.",tag:"Reciclável"},
 {name:"Papel e papelão",icon:"▤",category:"reciclaveis",desc:"Mantenha secos e limpos. Dobre caixas para ocupar menos espaço.",tag:"Reciclável"},
 {name:"Latas de alumínio",icon:"▣",category:"reciclaveis",desc:"Esvazie e enxágue quando necessário. Não é preciso retirar o lacre.",tag:"Reciclável"},
 {name:"Vidros e garrafas",icon:"♢",category:"reciclaveis",desc:"Separe inteiros. Vidros quebrados devem ser embalados com segurança e identificados.",tag:"Reciclável"},
 {name:"Restos de alimentos",icon:"♧",category:"organicos",desc:"Podem ser destinados à compostagem. Evite misturar com recicláveis secos.",tag:"Orgânico"},
 {name:"Cascas e folhas",icon:"❧",category:"organicos",desc:"Separe para compostagem doméstica ou serviço municipal, quando disponível.",tag:"Orgânico"},
 {name:"Papel higiênico usado",icon:"◌",category:"rejeitos",desc:"Descarte no lixo comum, bem acondicionado. Não deve ir à reciclagem.",tag:"Rejeito"},
 {name:"Espelho quebrado",icon:"◇",category:"rejeitos",desc:"Não coloque solto na coleta. Envolva em papelão resistente, identifique como vidro quebrado e consulte a coleta local.",tag:"Rejeito / especial"},
 {name:"Pilhas e baterias",icon:"▣",category:"perigosos",desc:"Nunca descarte no lixo comum. Leve a um ponto de logística reversa ou coletor específico.",tag:"Resíduo especial"},
 {name:"Lâmpadas",icon:"☼",category:"perigosos",desc:"Não quebre. Devolva em pontos de recebimento do comércio ou locais licenciados.",tag:"Resíduo especial"},
 {name:"Medicamentos vencidos",icon:"✚",category:"perigosos",desc:"Entregue em farmácias ou pontos de coleta habilitados. Não descarte na pia ou no vaso sanitário.",tag:"Resíduo especial"},
 {name:"Óleo de cozinha",icon:"◉",category:"perigosos",desc:"Após esfriar, armazene em garrafa PET bem fechada e leve a um ponto que receba óleo usado.",tag:"Resíduo especial"}
];
const $=s=>document.querySelector(s);
function renderPoints(filter="todos"){
 const list=points.filter(p=>filter==="todos"||p.type.includes(filter));
 $("#pointList").innerHTML=list.map(p=>`<div class="point-item"><span class="pin">⌖</span><div><strong>${p.name}</strong><small>${p.address}</small><small>${p.hours}</small><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+" "+p.address+", Porto Alegre RS")}">Ver rota ↗</a></div></div>`).join("");
 $("#pointCount").textContent=`${list.length} ${list.length===1?"local encontrado":"locais encontrados"}`;
}
function renderGuides(category="todos"){
 const list=materials.filter(m=>category==="todos"||m.category===category);
 $("#guideGrid").innerHTML=list.map(m=>`<article class="guide-card"><span class="g-icon">${m.icon}</span><h3>${m.name}</h3><p>${m.desc}</p><span class="tag ${m.category}">${m.tag}</span></article>`).join("");
}
function searchMaterial(q){
 const clean=q.trim().toLocaleLowerCase("pt-BR");
 if(!clean){$("#guideResult").textContent="Digite um material para pesquisar.";return}
 const found=materials.filter(m=>m.name.toLocaleLowerCase("pt-BR").includes(clean)||m.desc.toLocaleLowerCase("pt-BR").includes(clean));
 if(found.length){$("#guideResult").innerHTML=found.slice(0,3).map(m=>`<div><strong>${m.name} — ${m.tag}.</strong> ${m.desc}</div>`).join("")}
 else{$("#guideResult").innerHTML="<strong>Não encontramos esse material.</strong> Consulte o órgão municipal responsável antes de descartar, especialmente se for um resíduo perigoso."}
}
renderPoints();renderGuides();
$("#wasteFilter").addEventListener("change",e=>renderPoints(e.target.value));
$("#guideSearchBtn").addEventListener("click",()=>searchMaterial($("#guideQuery").value));
$("#guideQuery").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchMaterial(e.target.value)}});
$("#heroSearch").addEventListener("submit",e=>{e.preventDefault();$("#guideQuery").value=$("#heroQuery").value;searchMaterial($("#heroQuery").value);location.hash="#descarte"});
$("#categoryRow").addEventListener("click",e=>{const b=e.target.closest("button[data-category]");if(!b)return;document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderGuides(b.dataset.category)});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#mainNav").addEventListener("click",e=>{if(e.target.tagName==="A")$("#mainNav").classList.remove("open")});
$("#locateBtn").addEventListener("click",()=>{const msg=$("#geoMessage");if(!navigator.geolocation){msg.textContent="Geolocalização não suportada neste navegador.";return}msg.textContent="Obtendo localização...";navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;msg.textContent=`Localização identificada (${latitude.toFixed(3)}, ${longitude.toFixed(3)}). Consulte rotas nos pontos listados.`;showToast("Localização obtida. Os pontos demonstrativos ainda não são ordenados por distância.")},()=>{msg.textContent="Não foi possível acessar sua localização. Verifique a permissão do navegador."},{enableHighAccuracy:true,timeout:8000})});
const modal=$("#serviceModal");
const templates={
 volumosos:{title:"Agendar coleta de volumosos",desc:"Informe os dados do endereço e os itens para retirada.",fields:[["Nome completo","text","Seu nome"],["CPF (opcional)","text","000.000.000-00"],["Endereço completo","text","Rua, número, bairro"],["CEP","text","00000-000"],["Itens para retirada","textarea","Descreva móveis, eletrodomésticos ou outros itens"],["Data preferencial","date",""]]},
 denuncia:{title:"Registrar denúncia ou ocorrência",desc:"Descreva o problema e indique onde ele acontece.",fields:[["Nome (opcional)","text","Seu nome"],["E-mail ou telefone para retorno","text","Contato"],["Local da ocorrência","text","Endereço ou ponto de referência"],["Tipo de ocorrência","select","Descarte irregular|Entulho em via pública|Contêiner danificado|Outro"],["Descrição","textarea","Descreva a situação"]]}
};
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.open)));
function openModal(type){const t=templates[type];$("#modalTitle").textContent=t.title;$("#modalDescription").textContent=t.desc;$("#dynamicFields").innerHTML=t.fields.map((f,i)=>{let control=f[1]==="textarea"?`<textarea required placeholder="${f[2]}"></textarea>`:f[1]==="select"?`<select required>${f[2].split("|").map(x=>`<option>${x}</option>`).join("")}</select>`:`<input type="${f[1]}" ${f[1]==="text"?"placeholder=\""+f[2]+"\"":""} ${i===0?"required":""}>`;return `<div class="field"><label>${f[0]}</label>${control}</div>`}).join("");modal.dataset.type=type;modal.classList.add("open");modal.setAttribute("aria-hidden","false")}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeModal));
function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
$("#serviceForm").addEventListener("submit",e=>{e.preventDefault();closeModal();showToast("Formulário demonstrativo preenchido. Nenhum dado foi enviado.");e.target.reset()});
$("#ecoInfo").addEventListener("click",()=>showToast("Exemplo: leve recicláveis a pontos participantes. Pontuação real depende de cadastro e validação."));
let toastTimer;function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),4000)}
