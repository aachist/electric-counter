// --------- конфиг колонок ---------
const PERIOD=0, PREV=1, CUR=2, SPEND=3, TARIF=4, COST=5, PAYDATE=6;
let data=[];        // массив строк
let chart=null;

// --------- старт ---------
document.getElementById('addBtn').addEventListener('click', addRow);
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
function saveToStorage(){localStorage.setItem('ec_data_v3',JSON.stringify(data))}
function loadFromStorage(){
  const s=localStorage.getItem('ec_data_v3');
  if(s)data=JSON.parse(s);
}