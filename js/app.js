// --------- конфиг колонок ---------
const PERIOD=0, PREV=1, CUR=2, SPEND=3, TARIF=4, COST=5, PAYDATE=6;
let data=[];        // массив строк
let chart=null;

// --------- старт ---------
document.getElementById('addBtn').addEventListener('click', addRow);
document.getElementById('exportBtn').addEventListener('click', exportXML);
document.getElementById('importFile').addEventListener('change', importXML);
loadFromStorage();
render();

// --------- добавление строки ---------
function addRow(){
  const period=document.getElementById('period').value;        // yyyy-mm
  const prev=+document.getElementById('prev').value;
  const curr=+document.getElementById('curr').value;
  const payDate=document.getElementById('payDate').value;
  if(!period||!curr){alert('Заполните период и текущие показания');return;}
  const tarif=+document.getElementById('globalTarif').value;
  const spend=curr-prev;
  const cost=spend*tarif;
  data.push([period,prev,curr,spend,tarif,cost,payDate]);
  saveToStorage();
  render();
  // сместить «пред-щие» = введённые текущие для следующей строки
  document.getElementById('prev').value=curr;
  document.getElementById('curr').value='';
  document.getElementById('payDate').value='';
}

// --------- ЭКСПОРТ XML с выбором имени/места ---------
async function exportXML(){
  let xml='<?xml version="1.0" encoding="UTF-8"?>\n<ElectricData>\n';
  data.forEach(r=>{
    xml+=`  <Record period="${r[PERIOD]}" prev="${r[PREV]}" curr="${r[CUR]}" spend="${r[SPEND]}" tarif="${r[TARIF]}" cost="${r[COST]}" payDate="${r[PAYDATE]}"/>\n`;
  });
  xml+=`</ElectricData>`;

  const blob=new Blob([xml],{type:'application/xml'});
  // современный способ – showSaveFilePicker
  if(window.showSaveFilePicker){
    try{
      const handle=await window.showSaveFilePicker({suggestedName:'electric_data.xml',
                                                   types:[{description:'XML files',accept:{'application/xml':['.xml']}}]});
      const writable=await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }catch(e){/* пользователь отменил – падать не надо */ }
  }
  // запасной вариант – скачать через ссылку
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='electric_data.xml';
  a.click();
  URL.revokeObjectURL(url);
}

// --------- ИМПОРТ XML ---------
function importXML(e){
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=function(e){
    const parser=new DOMParser();
    const doc=parser.parseFromString(e.target.result,'application/xml');
    // проверка на ошибки парсера
    const parserError=doc.querySelector('parsererror');
    if(parserError){alert('Ошибка при чтении XML'); return;}
    const records=doc.querySelectorAll('Record');
    data=[];                                       // сброс
    records.forEach(rec=>{
      data.push([
        rec.getAttribute('period')||'',
        +(rec.getAttribute('prev')||0),
        +(rec.getAttribute('curr')||0),
        +(rec.getAttribute('spend')||0),
        +(rec.getAttribute('tarif')||0),
        +(rec.getAttribute('cost')||0),
        rec.getAttribute('payDate')||''
      ]);
    });
    saveToStorage();
    render();
  };
  r.readAsText(f);
}

// --------- РЕДАКТИРОВАНИЕ ЯЧЕЕК ---------
function makeEditable(cell,rowIdx,colIdx){
  cell.contentEditable=true;
  cell.addEventListener('blur',()=>{
    const raw=cell.textContent.trim();
    let val=raw;
    if(colIdx===PERIOD||colIdx===PAYDATE)val=raw;   // строки
    else val=parseFloat(raw)||0;                    // числа
    data[rowIdx][colIdx]=val;
    // пересчёт зависимых полей
    if(colIdx===PREV||colIdx===CUR||colIdx===TARIF){
      const r=data[rowIdx];
      r[SPEND]=r[CUR]-r[PREV];
      r[COST]=r[SPEND]*r[TARIF];
    }
    saveToStorage();
    render();   // перерисуем всё (в т.ч. график)
  });
}

// --------- УДАЛИТЬ / ВСТАВИТЬ ---------
function deleteRow(idx){
  if(!confirm('Удалить строку?'))return;
  data.splice(idx,1);
  saveToStorage();
  render();
}
function insertRow(idx,after=true){
  const empty=[ '',0,0,0,0,0,'' ];
  data.splice(after?idx+1:idx,0,empty);
  saveToStorage();
  render();
}

// --------- отрисовка таблицы + кнопки управления ---------
function render(){
  const tbl=document.getElementById('dataTable');
  tbl.innerHTML='';
  let tr=document.createElement('tr');
  // заголовки
  ['Период','Пред-щие кВт·ч','Текущие кВт·ч','Расход кВт·ч','Тариф руб','Сумма руб','Дата оплаты','',''].forEach(h=>{
    const th=document.createElement('th'); th.textContent=h; tr.appendChild(th);
  }); tbl.appendChild(tr);

  // тело
  data.forEach((r,idx)=>{
    tr=document.createElement('tr');
    // ячейки данных
    r.forEach((c,i)=>{
      const td=document.createElement('td');
      if(i===SPEND||i===COST)td.textContent=c.toFixed(2);
      else if(i===PAYDATE)td.textContent=c?c:'–';
      else td.textContent=c;
      makeEditable(td,idx,i);
      tr.appendChild(td);
    });
    // кнопки управления
    const tdDel=document.createElement('td');
    const btnDel=document.createElement('button');
    btnDel.textContent='🗑'; btnDel.className='btn-icon'; btnDel.title='Удалить';
    btnDel.onclick=()=>deleteRow(idx);
    tdDel.appendChild(btnDel); tr.appendChild(tdDel);

    const tdIns=document.createElement('td');
    const btnIns=document.createElement('button');
    btnIns.textContent='➕'; btnIns.className='btn-icon'; btnIns.title='Вставить после';
    btnIns.onclick=()=>insertRow(idx,true);
    tdIns.appendChild(btnIns); tr.appendChild(tdIns);

    tbl.appendChild(tr);
  });
  drawChart();
}

// --------- ГИСТОГРАММА по СУММАМ ---------
function drawChart(){
  const ctx=document.getElementById('chart').getContext('2d');
  if(chart)chart.destroy();
  const labels=data.map(r=>r[PERIOD]);
  const values=data.map(r=>r[COST]);
  chart=new Chart(ctx,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{label:'Сумма платежа, руб',data:values,backgroundColor:'#39c'}]
    },
    options:{responsive:true,plugins:{legend:{display:true}},scales:{y:{beginAtZero:true}}}
  });
}

// --------- localStorage ---------
function saveToStorage(){localStorage.setItem('ec_data_v5',JSON.stringify(data))}
function loadFromStorage(){
  const s=localStorage.getItem('ec_data_v5');
  if(s)data=JSON.parse(s);
}