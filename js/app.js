// --------- конфиг колонок ---------
const PERIOD=0, PREV=1, CUR=2, SPEND=3, TARIF=4, COST=5, PAYDATE=6;
let data=[];        // массив строк
let chart=null;

// --------- старт ---------
document.getElementById('addBtn').addEventListener('click', addRow);
document.getElementById('fileInput').addEventListener('change', handleFile);
loadFromStorage();
render();

// --------- загрузка Excel ---------
function handleFile(e){
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=function(e){
    const wb=XLSX.read(e.target.result,{type:'binary'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    raw.shift();                       // заголовок
    data=raw.map(r=>[
      r[0]||'',                // period
      +r[1]||0,                // prev
      +r[2]||0,                // curr
      +r[3]||0,                // spend
      +r[4]||0,                // tarif
      +r[5]||0,                // cost
      r[6]||''                 // paydate
    ]).filter(r=>r[CUR]);              // только есть текущие
    saveToStorage();
    render();
  };
  r.readAsBinaryString(f);
}

// --------- ручной ввод ---------
function addRow(){
  const period=document.getElementById('period').value;          // yyyy-mm
  const prev=+document.getElementById('prev').value;
  const curr=+document.getElementById('curr').value;
  const tarif=+document.getElementById('tarif').value;
  const payDate=document.getElementById('payDate').value;
  if(!period||!curr){alert('Заполните период и текущие показания');return;}
  const spend=curr-prev;
  const cost=spend*tarif;
  data.push([period,prev,curr,spend,tarif,cost,payDate]);
  saveToStorage();
  render();
  // очистить форму
  document.getElementById('prev').value=curr;
  document.getElementById('curr').value='';
  document.getElementById('tarif').value='';
  document.getElementById('payDate').value='';
}

// --------- отрисовка таблицы ---------
function render(){
  const tbl=document.getElementById('dataTable');
  tbl.innerHTML='';
  let tr=document.createElement('tr');
  ['Период','Пред-щие кВт·ч','Текущие кВт·ч','Расход кВт·ч','Тариф руб','Сумма руб','Дата оплаты'].forEach(h=>{
    const th=document.createElement('th'); th.textContent=h; tr.appendChild(th);
  }); tbl.appendChild(tr);

  data.forEach(r=>{
    tr=document.createElement('tr');
    r.forEach((c,i)=>{
      const td=document.createElement('td');
      if(i===SPEND||i===COST)td.textContent=c.toFixed(2);
      else if(i===PAYDATE)td.textContent=c?c:'–';
      else td.textContent=c;
      tr.appendChild(td);
    }); tbl.appendChild(tr);
  });
  drawChart();
}

// --------- график ---------
function drawChart(){
  const ctx=document.getElementById('chart').getContext('2d');
  if(chart)chart.destroy();
  const labels=data.map(r=>r[PERIOD]);
  const values=data.map(r=>r[SPEND]);
  chart=new Chart(ctx,{
    type:'line',
    data:{
      labels:labels,
      datasets:[{label:'Расход кВт·ч',data:values,borderColor:'#0066cc',fill:false,tension:0.15}]
    },
    options:{responsive:true,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true}}}
  });
}

// --------- localStorage ---------
function saveToStorage(){localStorage.setItem('ec_data_v2',JSON.stringify(data))}
function loadFromStorage(){
  const s=localStorage.getItem('ec_data_v2');
  if(s)data=JSON.parse(s);
}