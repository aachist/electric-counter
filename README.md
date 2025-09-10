Ниже – финальная версия (v3) без загрузки Excel, с:

- единой ячейкой-полем «Тариф» (вводится один раз, применяется ко всем новым записям);  
- гистограммой (Chart.js, type: 'bar') по столбцу «Сумма»;  
- календарями period (month) и payDate (date);  
- прежними колонками: Период | Пред | Текущ | Расход | Тариф | Сумма | Дата оплаты.

--------------------------------------------------
1. index.html
--------------------------------------------------
```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Учёт электроэнергии</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Показания счётчика</h1>

  <!-- ЕДИНОЕ ПОЛЕ ТАРИФА -->
  <div class="tarif-line">
    <label>Тариф, руб/кВт·ч:
      <input type="number" id="globalTarif" step="0.01" min="0" value="5.00">
    </label>
  </div>
  <hr>

  <!-- Форма добавления -->
  <h3>Добавить запись</h3>
  <div class="row">
    <label>Период: <input type="month" id="period"></label>
    <label>Пред-щие, кВт·ч: <input type="number" id="prev" step="0.01" min="0"></label>
    <label>Текущие, кВт·ч: <input type="number" id="curr" step="0.01" min="0"></label>
    <label>Дата оплаты: <input type="date" id="payDate"></label>
    <button id="addBtn">+ Добавить</button>
  </div>
  <hr>

  <!-- Таблица -->
  <table id="dataTable"></table>

  <!-- ГИСТОГРАММА по СУММАМ -->
  <canvas id="chart" height="120"></canvas>

  <script src="js/app.js"></script>
</body>
</html>
```

--------------------------------------------------
2. css/style.css  (добавлена строка для тарифа)
--------------------------------------------------
```css
body{font-family:Arial,Helvetica,sans-serif;margin:2rem;background:#fafafa}
h1,h3{margin-top:0}
.tarif-line{margin-bottom:1rem;font-weight:bold}
.row{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
label{display:inline-flex;flex-direction:column;font-size:.9rem}
input[type=number],input[type=month],input[type=date]{width:10rem}
table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid #ccc;padding:4px 8px;text-align:center}
```

--------------------------------------------------
3. js/app.js  (без загрузки файла, гистограмма по Sum)
--------------------------------------------------
```javascript
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
```

--------------------------------------------------
4. README.md  (коротко)
--------------------------------------------------
```markdown
# Электро-счётчик online v3
GitHub Pages:  
- ввод тарифа **один раз** (поле сверху);  
- форма добавления: период (month), пред-щие, текущие, дата оплаты (date);  
- гистограмма **сумм платежей**;  
- загрузка Excel убрана, данные хранятся в localStorage.

## Как залить
1. Создать репозиторий `electric-counter`.  
2. Залить файлы `index.html`, `css/style.css`, `js/app.js`.  
3. Включить GitHub Pages (Source → main → /root).  
4. Открыть `https://ВАШ_НИК.github.io/electric-counter/`
```

--------------------------------------------------
Готово: страница с единым полем тарифа, календарями, столбцом «Дата оплаты» и гистограммой сумм.