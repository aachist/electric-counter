// ------------ конфиг ------------
const PERIOD=0, PREV=1, CUR=2, SPEND=3, TARIF=4, COST=5;
let data=[];          // массив строк
let chart=null;

// ------------ инициализация ------------
document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('addRowBtn').addEventListener('click', addManualRow);
loadFromStorage();
render();

// ------------ загрузка Excel ------------
function handleFile(e){
  const f=e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=function(e){
    const wb=XLSX.read(e.target.result,{type:'binary'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    raw.shift();                 // удалить заголовок
    data=raw.map(r=>[
      r[0]||'', +r[1]||0, +r[2]||0, +r[3]||0, +r[4]||0, +r[5]||0
    ]).filter(r=>r[CUR]);        // оставить только строки с текущими
    saveToStorage();
    render();
  };
  r.readAsBinaryString(f);
}

// ------------ ручной ввод ------------
function addManualRow(){
  const p=prompt('Период (например 09.2023):','');
  const c=+prompt('Текущие показания, кВт·ч:','');
  if(!p||!c)return;
  const last=data.length?data[data.length-1][CUR]:0;
  data.push([p, last, c, c-last, 0, 0]);
  saveToStorage();
  render();
}

// ------------ отрисовка таблицы + итоги ------------
function render(){
  const tbl=document.getElementById('dataTable');
  tbl.innerHTML='';
  let tr=document.createElement('tr');
  ['Период','Пред','Текущ','Расход','Тариф','Сумма'].forEach(h=>{
    const th=document.createElement('th'); th.textContent=h; tr.appendChild(th);
  }); tbl.appendChild(tr);

  data.forEach(r=>{
    tr=document.createElement('tr');
    r.forEach((c,i)=>{
      const td=document.createElement('td');
      td.textContent=i===SPEND||i===COST?c.toFixed(2):c;
      tr.appendChild(td);
    }); tbl.appendChild(tr);
  });

  // ------------ итоговые цифры ------------
  const totalSpend=data.reduce((s,r)=>s+r[SPEND],0);
  const days=calcDays();
  const avg=days?totalSpend/days:0;
  document.getElementById('totals').innerHTML=
    `Итого расход: ${totalSpend.toFixed(2)} кВт·ч<br>`+
    `Дней всего: ${days}<br>`+
    `Среднедневное: ${avg.toFixed(2)} кВт·ч/сут`;

  drawChart();
}

// ------------ график ------------
function drawChart(){
  const ctx=document.getElementById('chart').getContext('2d');
  if(chart)chart.destroy();
  const labels=data.map(r=>r[PERIOD]);
  const values=data.map(r=>r[SPEND]);
  chart=new Chart(ctx,{
    type:'line',
    data:{
      labels:labels,
      datasets:[{
        label:'Расход, кВт·ч',
        data:values,
        borderColor:'#0066cc',
        fill:false,
        tension:0.15
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:true}},
      scales:{y:{beginAtZero:true}}
    }
  });
}

// ------------ количество дней ------------
function calcDays(){
  if(data.length<2)return 0;
  const first=parseDate(data[0][PERIOD]);
  const last=parseDate(data[data.length-1][PERIOD]);
  return Math.round((last-first)/864e5)+1;
}
function parseDate(str){          // превращаем "09.2023" в Date
  const [mm,yyyy]=str.split(/[.\-\/]/);
  return new Date(yyyy,mm-1,1);
}

// ------------ localStorage ------------
function saveToStorage(){localStorage.setItem('ec_data',JSON.stringify(data))}
function loadFromStorage(){
  const s=localStorage.getItem('ec_data');
  if(s)data=JSON.parse(s);
}