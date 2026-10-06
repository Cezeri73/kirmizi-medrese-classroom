const views = {
  home: document.getElementById("view-home"),
  player: document.getElementById("view-player"),
};

const lessonPill = document.getElementById("lessonPill");
const stepPill = document.getElementById("stepPill");

const lessonCards = document.getElementById("lessonCards");

const stageTitle = document.getElementById("stageTitle");
const stageBody = document.getElementById("stageBody");
const teacherNote = document.getElementById("teacherNote");
const timeBox = document.getElementById("timeBox");

const btnHome = document.getElementById("btnHome");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnStartFirst = document.getElementById("btnStartFirst");
const btnFullscreen = document.getElementById("btnFullscreen");

const stepButtons = [...document.querySelectorAll(".nav2")];

const STEPS = ["learn","anim","activity","quiz"];
const stepLabels = {
  learn: "Anlatım",
  anim: "Animasyon / Demo",
  activity: "Etkinlik",
  quiz: "Quiz"
};

const lessons = getLessons();

let currentLessonIndex = 0;
let currentStepIndex = 0;

boot();

function boot(){
  renderLessonMenu();
  bindUI();
  setView("home");
}

function bindUI(){
  btnHome.addEventListener("click", ()=> setView("home"));
  btnPrev.addEventListener("click", ()=> navigate(-1));
  btnNext.addEventListener("click", ()=> navigate(+1));

  btnStartFirst.addEventListener("click", ()=> openLesson(0));

  btnFullscreen.addEventListener("click", async ()=>{
    try{
      if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    }catch{
      alert("Tarayıcı tam ekranı engellemiş olabilir.");
    }
  });

  stepButtons.forEach(b=>{
    b.addEventListener("click", ()=>{
      currentStepIndex = STEPS.indexOf(b.dataset.step);
      renderPlayer();
    });
  });

  window.addEventListener("keydown", (e)=>{
    if(!views.player.classList.contains("active")) return;
    if(e.key === "ArrowRight") navigate(+1);
    if(e.key === "ArrowLeft") navigate(-1);
  });
}

function setView(name){
  Object.values(views).forEach(v=>v.classList.remove("active"));
  views[name].classList.add("active");
}

function renderLessonMenu(){
  lessonCards.innerHTML = "";
  lessons.forEach((l, idx)=>{
    const card = document.createElement("div");
    card.className = "card lesson-card";

    const tags = l.tags.map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");

    card.innerHTML = `
      <h3>${escapeHtml(l.title)}</h3>
      <p class="muted">${escapeHtml(l.short)}</p>
      <div class="badges">${tags}</div>
      <div class="cta-row">
        <button class="primary">Dersi Aç</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", ()=> openLesson(idx));
    lessonCards.appendChild(card);
  });
}

function openLesson(index){
  currentLessonIndex = index;
  currentStepIndex = 0;
  setView("player");
  renderPlayer();
}

function navigate(dir){
  const newStep = currentStepIndex + dir;

  if(newStep >= 0 && newStep < STEPS.length){
    currentStepIndex = newStep;
    renderPlayer();
    return;
  }

  const newLesson = currentLessonIndex + (dir > 0 ? 1 : -1);
  if(newLesson < 0 || newLesson >= lessons.length) return;

  currentLessonIndex = newLesson;
  currentStepIndex = dir > 0 ? 0 : (STEPS.length - 1);
  renderPlayer();
}

function renderPlayer(){
  const lesson = lessons[currentLessonIndex];
  const step = STEPS[currentStepIndex];

  lessonPill.textContent = `Ders: ${lesson.title}`;
  stepPill.textContent = `Bölüm: ${stepLabels[step]}`;

  stageTitle.textContent = `${lesson.title} • ${stepLabels[step]}`;

  teacherNote.innerHTML = lesson.teacherNotes?.[step] || "-";
  timeBox.textContent = lesson.timePlan || "Toplam: 50 dk";

  stepButtons.forEach(b=> b.classList.toggle("active", b.dataset.step === step));

  stageBody.innerHTML = "";
  // Weekly module list auto-load
  if(lesson.id === "weekly_modules" && step === "learn"){
    loadWeeklyModulesInto("weeklyList", "weeklyErr");
  }
  if(step === "learn") stageBody.innerHTML = lesson.learnHtml;
  if(step === "anim") stageBody.innerHTML = lesson.animHtml;
  if(step === "activity") stageBody.innerHTML = lesson.activityHtml;
  if(step === "quiz") stageBody.innerHTML = renderQuiz(lesson.quiz);

  hookInteractions(step);
}

function hookInteractions(step){
  if(step !== "anim" && step !== "activity") return;

  // 1) Packet animation (internet story)
  const packet = document.querySelector(".packet");
  const btnRunAnim = document.getElementById("btnRunAnim");
  if(btnRunAnim && packet){
    btnRunAnim.addEventListener("click", ()=>{
      packet.classList.toggle("run");
      btnRunAnim.textContent = packet.classList.contains("run") ? "Animasyonu durdur" : "Animasyonu çalıştır";
    });
  }

  // 2) DNS mini sim
  const dnsBtn = document.getElementById("dnsResolve");
  const dnsName = document.getElementById("dnsName");
  const dnsResult = document.getElementById("dnsResult");
  if(dnsBtn && dnsName && dnsResult){
    dnsBtn.addEventListener("click", ()=>{
      const name = dnsName.value.trim().toLowerCase();
      const map = {
        "kirmizimedrese.com":"203.0.113.10",
        "google.com":"142.250.***.***",
        "wikipedia.org":"208.80.154.224"
      };
      dnsResult.textContent = map[name] ? `Sonuç: ${map[name]}` : "Sonuç: Bulunamadı (rehberde yok gibi düşün!)";
    });
  }

  // 3) BIT/BYTE interactive (activity)
  const bitOut = document.getElementById("bitOut");
  const bitDec = document.getElementById("bitDec");
  const bitAscii = document.getElementById("bitAscii");

  function updateBits(){
    const bits = [...document.querySelectorAll(".bit")].map(b => b.classList.contains("on") ? "1" : "0");
    if(bits.length !== 8) return;
    const bin = bits.join("");
    const dec = parseInt(bin, 2);
    const ch = (dec >= 32 && dec <= 126) ? String.fromCharCode(dec) : "—";
    if(bitOut) bitOut.textContent = bin;
    if(bitDec) bitDec.textContent = String(dec);
    if(bitAscii) bitAscii.textContent = ch;
    // update visual 0/1 text on blocks
    document.querySelectorAll(".bit").forEach((b,i)=> b.textContent = bits[i]);
  }

  document.querySelectorAll(".bit").forEach(b=>{
    b.addEventListener("click", ()=>{
      b.classList.toggle("on");
      updateBits();
    });
  });

  const btnResetBits = document.getElementById("btnResetBits");
  if(btnResetBits){
    btnResetBits.addEventListener("click", ()=>{
      document.querySelectorAll(".bit").forEach(b=> b.classList.remove("on"));
      updateBits();
    });
  }

  const btnSetA = document.getElementById("btnSetA");
  if(btnSetA){
    btnSetA.addEventListener("click", ()=>{
      const pattern = "01000001"; // 'A'
      document.querySelectorAll(".bit").forEach((b,i)=> b.classList.toggle("on", pattern[i]==="1"));
      updateBits();
    });
  }

  // 4) Password strength mini (today tech)
  const pass = document.getElementById("passInput");
  const passBar = document.getElementById("passBar");
  const passText = document.getElementById("passText");
  if(pass && passBar && passText){
    pass.addEventListener("input", ()=>{
      const v = pass.value;
      let score = 0;
      if(v.length >= 8) score += 25;
      if(v.length >= 12) score += 15;
      if(/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 20;
      if(/\d/.test(v)) score += 20;
      if(/[^a-zA-Z0-9]/.test(v)) score += 20;
      score = Math.min(100, score);
      passBar.style.width = score + "%";
      const label = score < 40 ? "Zayıf" : score < 70 ? "Orta" : "Güçlü";
      passText.textContent = `Güç: ${label} (${score}/100)`;
    });
  }

  // 5) Prompt builder (AI)
  const promptOut = document.getElementById("promptOut");
  const roleSel = document.getElementById("roleSel");
  const levelSel = document.getElementById("levelSel");
  const topicSel = document.getElementById("topicSel");
  const formatSel = document.getElementById("formatSel");
  const btnCopyPrompt = document.getElementById("btnCopyPrompt");

  function updatePrompt(){
    if(!promptOut || !roleSel || !levelSel || !topicSel || !formatSel) return;
    promptOut.value =
`${roleSel.value}
Konu: ${topicSel.value}
Seviye: ${levelSel.value}
İstediğim format: ${formatSel.value}
Ek istek: Kısa örnek ver ve güvenlik uyarısı ekle.`;
  }

  [roleSel, levelSel, topicSel, formatSel].forEach(x=>{
    if(x) x.addEventListener("change", updatePrompt);
  });
  if(promptOut) updatePrompt();

  if(btnCopyPrompt && promptOut){
    btnCopyPrompt.addEventListener("click", async ()=>{
      try{
        await navigator.clipboard.writeText(promptOut.value);
        alert("Prompt kopyalandı. (İnternet varsa AI aracına yapıştırabilirsin.)");
      }catch{
        alert("Kopyalama başarısız olabilir. Metni seçip Ctrl+C yapabilirsin.");
      }
    });
  }

  // 6) Canva checklist score
  const canvaScore = document.getElementById("canvaScore");
  const canvaChecks = [...document.querySelectorAll("input[data-canva-check]")];
  if(canvaScore && canvaChecks.length){
    const calc = ()=>{
      const done = canvaChecks.filter(c=>c.checked).length;
      canvaScore.textContent = `Kontrol: ${done}/${canvaChecks.length}`;
    };
    canvaChecks.forEach(c=>c.addEventListener("change", calc));
    calc();
  }

  // 7) Slides good/bad reveal (Google)
  const revealBtn = document.getElementById("revealSlidesTips");
  const revealBox = document.getElementById("slidesTips");
  if(revealBtn && revealBox){
    revealBtn.addEventListener("click", ()=> revealBox.classList.toggle("hidden"));
  }
}

function renderQuiz(quiz){
  return `
    <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
      <h3>Mini Quiz (Sınıfça Oylama)</h3>
      <p class="muted">Çocuklar A/B/C/D için el kaldırsın. Sonra “Cevabı Göster”e bas.</p>
      <div class="hr"></div>
      ${quiz.map((q, i)=> quizItemHtml(q, i)).join("")}
    </div>
  `;
}

function quizItemHtml(q, idx){
  const letters = ["A","B","C","D"];
  const correctLetter = letters[q.correctIndex];

  return `
    <div class="card" style="margin:12px 0; background:rgba(0,0,0,.12); border-color:rgba(255,255,255,.08)">
      <div><strong>Soru ${idx+1}:</strong> ${escapeHtml(q.q)}</div>
      <div class="quizGrid" style="margin-top:12px">
        ${q.options.map((opt, oi)=> `
          <div class="quizOpt">
            <span class="bigLetter">${letters[oi]}</span>
            ${escapeHtml(opt)}
          </div>
        `).join("")}
      </div>
      <div class="cta-row">
        <button class="btn" onclick="document.getElementById('ans-${idx}').classList.toggle('hidden')">Cevabı Göster / Gizle</button>
      </div>
      <div id="ans-${idx}" class="notice2 hidden">
        <strong>Doğru:</strong> ${correctLetter}<br/>
        <span class="muted">${escapeHtml(q.explain || "")}</span>
      </div>
    </div>
  `;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&#60;")
    .replaceAll(">","&#62;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ===================== LESSONS ===================== */

function getLessons(){
  return [
    // 1) INTERNET STORY (detaylı)
    {
  id:"weekly_modules",
  title:"Haftalık Modüller (Arşiv)",
  short:"Her hafta eklenen harici ders/sunum sayfaları burada listelenir.",
  tags:["Haftalık","Arşiv"],
  timePlan:"İstediğin modülü seç → 50 dk uygula",
  teacherNotes:{
    learn:"Listeden haftayı seçip aç. İnternet yoksa local kopyadan açabilirsin.",
    anim:"-",
    activity:"-",
    quiz:"-"
  },
  learnHtml: `
    <h3>Haftalık Modüller</h3>
    <p class="muted">Liste <code>modules/modules.json</code> dosyasından otomatik gelir.</p>
    <div id="weeklyList" class="list"></div>
    <div id="weeklyErr" class="notice2 hidden"></div>
    <div class="hr"></div>
    <p class="muted">
      Yeni modül eklemek için:<br/>
      1) <code>modules/</code> altına yeni HTML koy<br/>
      2) <code>modules/modules.json</code> içine yeni satır ekle
    </p>
  `,
  animHtml:`<p class="muted">Bu ders listeden açılır.</p>`,
  activityHtml:`<p class="muted">Bu ders listeden açılır.</p>`,
  quiz:[]
},
    {
      id:"internet_story",
      title:"İnternet Nasıl Çalışır? (Hikâye + Tarihçe)",
      short:"İlk internet nasıl doğdu, paketler nasıl gider, elektrik nasıl 0-1 olur?",
      tags:["İnternet","Tarihçe","Bit/Byte","DNS"],
      timePlan:"Toplam 50 dk (Anlatım 18 • Demo 12 • Etkinlik 12 • Quiz 8)",
      teacherNotes:{
        learn:`Çok basit dil: “İnternet = yollar, paket = küçük mektup”. Her başlıkta 1 soru sor.`,
        anim:`Paket animasyonu + DNS simülasyonu. “İsim yazıyoruz, sayı değil” vurgusu.`,
        activity:`Bit/byte ile A harfini yap. Sonra “postacı oyunu” ile paketleri canlandır.`,
        quiz:`İnternet/web farkı + DNS + bit + paket mantığı.`
      },
      learnHtml: `
        <h3>Hikâye: “Mert ‘Selam’ yazdı”</h3>
        <p>Mert telefondan “Selam” yazdı. Mesaj tek parça gitmez. <strong>Küçük parçalara</strong> ayrılır.</p>
        <ul>
          <li><strong>Paket</strong>: Mesajın bir parçası + adres etiketi</li>
          <li><strong>Router</strong>: Kavşak gibi, paketi doğru yola yönlendirir</li>
          <li><strong>Sunucu</strong>: Web sitesinin durduğu güçlü bilgisayar</li>
        </ul>

        <div class="hr"></div>

        <h3>İnternet ve Web aynı mı?</h3>
        <ul>
          <li><strong>İnternet</strong>: Bağlantı ağı (yollar)</li>
          <li><strong>Web</strong>: Bu yollarda giden “web sayfaları” hizmeti</li>
        </ul>

        <div class="hr"></div>

        <h3>İlk internet nasıl çıktı? (Kısa tarihçe)</h3>
        <p>Eskiden bilgisayarlar birbirine bağlı değildi. Bilgi paylaşmak zordu.</p>
        <ul>
          <li><strong>1969:</strong> İlk ağ denemeleri (ARPANET) – birkaç bilgisayar konuştu</li>
          <li><strong>1983:</strong> Ortak konuşma dili yaygınlaştı (TCP/IP gibi düşün)</li>
          <li><strong>1991:</strong> Web sayfaları fikri ortaya çıktı (WWW)</li>
        </ul>

        <div class="hr"></div>

        <h3>Elektrik nasıl yazıya dönüşüyor?</h3>
        <p>Kabloda harf gitmez. Kabloda <strong>elektrik sinyali</strong> gider.</p>
        <p>Bilgisayar bunu <strong>0</strong> ve <strong>1</strong> diye okur. Buna <strong>bit</strong> deriz.</p>
        <ul>
          <li><strong>Bit</strong>: 0 veya 1</li>
          <li><strong>Byte</strong>: 8 bit (genelde 1 harfe yeter)</li>
        </ul>

        <div class="hr"></div>

        <h3>DNS nedir?</h3>
        <p>Sen “google.com” yazarsın. Bilgisayar adresi sayıyla bulur. DNS, isimleri sayıya çeviren rehber gibidir.</p>
      `,
      animHtml: `
        <div class="animWrap">
          <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
            <h3>Demo 1: Paket Yolculuğu</h3>
            <p class="muted">Butona basınca paket yolda gidiyormuş gibi görünür.</p>
            <div class="cta-row">
              <button class="primary" id="btnRunAnim">Animasyonu çalıştır</button>
            </div>
          </div>

          <div class="animCanvas">
            <div class="nodeRow">
              <div class="node"><strong>Telefon/PC</strong><div class="muted">Gönder</div></div>
              <div class="node"><strong>Modem</strong><div class="muted">Kapı</div></div>
              <div class="node"><strong>Router</strong><div class="muted">Kavşak</div></div>
              <div class="node"><strong>Sunucu</strong><div class="muted">Cevap</div></div>
            </div>
            <div class="packet" title="Paket"></div>
          </div>

          <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
            <h3>Demo 2: DNS Mini Simülasyon (Offline çalışır)</h3>
            <div class="toggleRow">
              <input id="dnsName" class="mono smallInput" placeholder="Örn: kirmizimedrese.com"/>
              <button class="btn" id="dnsResolve">DNS Çöz</button>
            </div>
            <div class="pill mono" id="dnsResult">Sonuç: -</div>
            <p class="muted">Soru: “DNS olmazsa?” → siteleri sayı ile yazmak zorunda kalırdık.</p>
          </div>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik 1: 8 bit ile “A” harfi üret (Offline)</h3>
        <p class="muted">Hedef: 01000001 (A). Bitlere tıklayın.</p>

        <div class="bitPanel">
          <div>
            <div class="bits">
              <div class="bit">0</div><div class="bit">0</div><div class="bit">0</div><div class="bit">0</div>
              <div class="bit">0</div><div class="bit">0</div><div class="bit">0</div><div class="bit">0</div>
            </div>
            <div class="cta-row">
              <button class="btn" id="btnResetBits">Sıfırla</button>
              <button class="primary" id="btnSetA">A yap</button>
            </div>
          </div>

          <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
            <h4>Çeviri</h4>
            <div class="kv">
              <div>Binary</div><div class="mono" id="bitOut">00000000</div>
              <div>Decimal</div><div class="mono" id="bitDec">0</div>
              <div>ASCII</div><div class="mono" id="bitAscii">—</div>
            </div>
          </div>
        </div>

        <div class="hr"></div>

        <h3>Etkinlik 2: Postacı Oyunu (Sınıf canlandırma)</h3>
        <ol>
          <li>4 öğrenci: Gönderici, Modem, Router, Sunucu</li>
          <li>Mesajı 3 pakete böl (3 kâğıt)</li>
          <li>Router paketlerin sırasını karıştırabilir</li>
          <li>Sunucu paketleri birleştirip mesajı okur</li>
        </ol>
      `,
      quiz: [
        { q:"İnternet ile Web farkı?", options:[
          "İnternet yollar, Web web siteleri hizmeti",
          "Web kablodur, internet ekrandır",
          "İkisi aynı şey",
          "Web sadece oyun içindir"
        ], correctIndex:0, explain:"İnternet ağdır; Web, bu ağ üzerinde çalışan hizmetlerden biridir."},
        { q:"DNS ne yapar?", options:[
          "İsmi IP sayısına çevirir",
          "Bilgisayarı soğutur",
          "Telefonu şarj eder",
          "Virüs üretir"
        ], correctIndex:0, explain:"Alan adı (isim) → IP (sayı) çevirir."},
        { q:"Bit nedir?", options:[
          "0 veya 1",
          "8 bit",
          "Kablo tipi",
          "Ekran"
        ], correctIndex:0, explain:"Bit tek basamaktır: 0 ya da 1."},
      ]
    },

    // 2) COMPUTER BASICS (donanım + yazılım + örnekler)
    {
      id:"computer_basics",
      title:"Bilgisayar Nedir? (Parçalar + Yazılım)",
      short:"CPU, RAM, SSD ne işe yarar? Program nedir? Basit örneklerle.",
      tags:["Donanım","Temel","Program"],
      timePlan:"Toplam 50 dk (Anlatım 16 • Demo 12 • Etkinlik 14 • Quiz 8)",
      teacherNotes:{
        learn:"CPU=mutfak şefi, RAM=tezgâh, SSD=depo benzetmesi çok anlaşılır.",
        anim:"İnternet varsa: Görev Yöneticisi göster. Offline: ekran görüntüsü üzerinden anlat.",
        activity:"Sınıfça ‘bilgisayar tarifi’ yazdır: parça + görev.",
        quiz:"RAM/SSD karıştıran çok olur; örnekle sor."
      },
      learnHtml: `
        <h3>Bilgisayar nedir?</h3>
        <p>Bilgisayar: <strong>veri alır</strong> (klavye) → <strong>işler</strong> (CPU) → <strong>gösterir</strong> (ekran).</p>

        <div class="hr"></div>

        <h3>En önemli parçalar (çok basit)</h3>
        <ul>
          <li><strong>CPU:</strong> Beyin. Hesaplar ve karar verir.</li>
          <li><strong>RAM:</strong> Çalışma masası. Şu an yaptıkların burada durur.</li>
          <li><strong>SSD/Disk:</strong> Dolap/depo. Dosyalar uzun süre burada kalır.</li>
          <li><strong>GPU (bazı bilgisayarlarda):</strong> Resim/oyun işleri için yardımcı.</li>
        </ul>

        <div class="hr"></div>

        <h3>Yazılım nedir?</h3>
        <p><strong>Yazılım</strong> = bilgisayara ne yapacağını söyleyen talimatlar.</p>
        <ul>
          <li><strong>İşletim sistemi:</strong> Windows / macOS</li>
          <li><strong>Uygulama:</strong> Tarayıcı, oyun, Canva</li>
        </ul>

        <div class="hr"></div>

        <h3>Örnek (çok somut)</h3>
        <p>Bir fotoğraf açtığında:</p>
        <ol>
          <li>Fotoğraf SSD’den okunur</li>
          <li>RAM’e alınır</li>
          <li>CPU/GPU ekrana çizer</li>
        </ol>
      `,
      animHtml: `
        <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
          <h3>Demo (İnternet varsa/yoksa fark etmez)</h3>
          <div class="goodbad">
            <div class="gb">
              <h4>İnternet varsa (Canlı)</h4>
              <ul>
                <li>Bilgisayarda “Görev Yöneticisi / Task Manager” aç</li>
                <li>CPU ve RAM kullanımını göster</li>
                <li>Bir sekme açınca RAM artar mı sor</li>
              </ul>
            </div>
            <div class="gb">
              <h4>İnternet yoksa (Offline plan)</h4>
              <ul>
                <li>“CPU=işçi sayısı, RAM=masa” benzetmesini tekrar et</li>
                <li>Tahtaya: SSD → RAM → CPU/GPU → Ekran akışını çiz</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik: “Bilgisayar tarifi” (14 dk)</h3>
        <ol>
          <li>Tahtaya yaz: CPU, RAM, SSD, Ekran</li>
          <li>Her grup 1 parça seçip “Ben olmasam ne olur?” cümlesi kurar.</li>
          <li>Sonunda herkes 1 cümle söyler.</li>
        </ol>
        <div class="notice2">
          <strong>Mini soru:</strong> “RAM dolarsa ne olur?” → Bilgisayar yavaşlar, çünkü SSD’ye gidip gelmeye çalışır.
        </div>
      `,
      quiz: [
        { q:"RAM neye benzer?", options:["Çalışma masası","Dolap","Kablo","Ekran"], correctIndex:0, explain:"RAM geçici ve hızlıdır: o an çalıştığın yer."},
        { q:"SSD ne işe yarar?", options:["Dosyaları uzun süre saklar","Hesap yapar","Wi‑Fi yayar","Ekranı aydınlatır"], correctIndex:0, explain:"Dosyalar kapanınca da kalır."},
      ]
    },

    // 3) CANVA (detay + checklist)
    {
      id:"canva",
      title:"Grafik Tasarım + Canva (Poster)",
      short:"Az yazı, 2 yazı tipi, 3 renk. Sınıfça poster üretimi.",
      tags:["Canva","Tasarım","Poster"],
      timePlan:"Toplam 50 dk (Anlatım 12 • Demo 15 • Etkinlik 15 • Quiz 8)",
      teacherNotes:{
        learn:"Kural: Az yazı. Çocuklara ‘başlık 5 kelime’ sınırı koy.",
        anim:"İnternet varsa Canva canlı. Offline: taslağı kağıtta yap.",
        activity:"Sınıfça tek poster: slogan seç, renk seç, ikon seç.",
        quiz:"Okunurluk ve renk kuralları."
      },
      learnHtml: `
        <h3>Tasarım nedir?</h3>
        <p>Tasarım: Mesajı <strong>hızlı</strong> ve <strong>güzel</strong> anlatmak.</p>

        <h3>3 Altın Kural</h3>
        <ol>
          <li><strong>Az yazı:</strong> Başlık kısa olsun</li>
          <li><strong>2 yazı tipi</strong> yeter</li>
          <li><strong>3 renk</strong> kuralı</li>
        </ol>

        <div class="hr"></div>

        <h3>Örnek sloganlar</h3>
        <ul>
          <li>“Şifreni Paylaşma!”</li>
          <li>“Tanımadığın Linke Tıklama!”</li>
          <li>“İnternette Kibar Ol!”</li>
        </ul>
      `,
      animHtml: `
        <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
          <h3>Demo: Canva ile Poster (İnternet varsa)</h3>
          <ol>
            <li>Canva → Poster şablonu seç</li>
            <li>Başlık yaz (en fazla 5 kelime)</li>
            <li>1 ikon ekle</li>
            <li>3 renk kuralını kontrol et</li>
          </ol>

          <div class="hr"></div>

          <h3>Offline plan (İnternet yoksa)</h3>
          <ol>
            <li>Kağıtta poster taslağı çiz</li>
            <li>Başlık + 2 madde + 1 ikon yeri</li>
            <li>Sonra internet gelince Canva’da aynısını yap</li>
          </ol>

          <div class="hr"></div>

          <h3>Kontrol listesi (Etkileşimli)</h3>
          <div class="checklist">
            <label class="chk"><input type="checkbox" data-canva-check/> Başlık kısa (≤ 5 kelime)</label>
            <label class="chk"><input type="checkbox" data-canva-check/> 2 yazı tipi kullandım</label>
            <label class="chk"><input type="checkbox" data-canva-check/> En fazla 3 renk kullandım</label>
            <label class="chk"><input type="checkbox" data-canva-check/> Yazı okunuyor (kontrast iyi)</label>
            <label class="chk"><input type="checkbox" data-canva-check/> 1 ikon/görsel ekledim</label>
            <label class="chk"><input type="checkbox" data-canva-check/> Boşluk bıraktım (çok kalabalık değil)</label>
          </div>
          <div class="pill" id="canvaScore">Kontrol: 0/6</div>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik: Sınıfça Tek Poster (15 dk)</h3>
        <ol>
          <li>Konu seç: <strong>Güvenli İnternet</strong></li>
          <li>Herkes 1 slogan önerir</li>
          <li>En iyi 3 sloganı oylayın</li>
          <li>Canva’da posteri birlikte tamamlayın</li>
        </ol>
        <div class="notice2"><strong>Mini görev:</strong> Poster bitince 2 öğrenci “Neden bu rengi seçtik?” anlatsın.</div>
      `,
      quiz: [
        { q:"Poster başlığı nasıl olmalı?", options:["Kısa ve net","Çok uzun paragraf","Hiç başlık olmasın","10 renk olsun"], correctIndex:0, explain:"Kısa başlık daha hızlı okunur."},
        { q:"Genelde kaç yazı tipi yeterlidir?", options:["1–2","5–6","10–12","Sınırsız"], correctIndex:0, explain:"Çok font karışıklık yapar."},
      ]
    },

    // 4) GOOGLE WORKSPACE (detay + good/bad)
    {
      id:"google_ws",
      title:"Google Ofis (Docs / Slides / Sheets)",
      short:"Ödev, sunum, tablo. Okul için pratik kullanım.",
      tags:["Docs","Slides","Sheets","Okul"],
      timePlan:"Toplam 50 dk (Anlatım 12 • Demo 15 • Etkinlik 15 • Quiz 8)",
      teacherNotes:{
        learn:"Docs=ödev, Slides=sunum, Sheets=liste. ‘Kısa metin’ kuralını söyle.",
        anim:"İnternet varsa canlı demo. Offline: iyi/kötü slayt karşılaştırma kartını kullan.",
        activity:"3 slayt kuralı ile mini sunum iskeleti yazdır.",
        quiz:"Doğru aracı doğru iş için seçtirme."
      },
      learnHtml: `
        <h3>Docs (Dokümanlar)</h3>
        <ul>
          <li>Ödev yazma</li>
          <li>Başlıklar (Başlık 1/2)</li>
          <li>Madde işaretleri</li>
        </ul>

        <h3>Slides (Sunular)</h3>
        <p>Sunumda amaç: <strong>kısa yazı + görsel + anlatım</strong></p>

        <h3>Sheets (Tablolar)</h3>
        <p>Liste ve plan: haftalık program, okuma listesi, basit toplama.</p>
      `,
      animHtml: `
        <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
          <h3>Demo (İnternet varsa)</h3>
          <ol>
            <li>Docs: Başlık → madde → görsel</li>
            <li>Slides: 3 slayt oluştur → tema seç</li>
            <li>Sheets: 5 satır plan tablosu</li>
          </ol>

          <div class="hr"></div>

          <h3>Offline (İnternet yoksa): İyi/Kötü Slayt Kartı</h3>
          <div class="goodbad">
            <div class="gb">
              <h4>İyi slayt</h4>
              <ul>
                <li>Başlık büyük</li>
                <li>3 kısa madde</li>
                <li>1 ikon/görsel</li>
              </ul>
            </div>
            <div class="gb">
              <h4>Kötü slayt</h4>
              <ul>
                <li>Paragraf dolu</li>
                <li>Çok renk / çok font</li>
                <li>Okunmuyor</li>
              </ul>
            </div>
          </div>

          <div class="cta-row">
            <button class="btn" id="revealSlidesTips">İpuçlarını aç/kapat</button>
          </div>
          <div id="slidesTips" class="notice2 hidden">
            <strong>Kural:</strong> Slayt “okunmak için” değil, “anlatmak için”dir.
          </div>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik: 3 Slayt Kuralı (15 dk)</h3>
        <ol>
          <li>Slayt 1: Başlık + 1 cümle</li>
          <li>Slayt 2: 3 madde + 1 ikon</li>
          <li>Slayt 3: Sonuç + teşekkür</li>
        </ol>
        <div class="notice2"><strong>Mini görev:</strong> Her slaytta en fazla 15 kelime!</div>
      `,
      quiz: [
        { q:"Ödev yazmak için en uygun araç?", options:["Docs","Slides","Sheets","Kamera"], correctIndex:0, explain:"Docs yazı ve düzen için uygundur."},
        { q:"Sunumda metin nasıl olmalı?", options:["Kısa ve net","Uzun paragraf","Sadece yazı","Başlıksız"], correctIndex:0, explain:"Sunumda anlatım senin; slayt destek olur."},
      ]
    },

    // 5) TODAY TECH (bulut + IoT + güvenlik + password meter)
    {
      id:"today_tech",
      title:"Günümüz Teknolojileri + Siber Güvenlik",
      short:"Bulut, IoT ve güvenli internet alışkanlıkları.",
      tags:["Bulut","IoT","Güvenlik"],
      timePlan:"Toplam 50 dk (Anlatım 14 • Demo 12 • Etkinlik 16 • Quiz 8)",
      teacherNotes:{
        learn:"Somut örnek ver: Drive, akıllı saat, 2 adımlı doğrulama.",
        anim:"Şifre gücü ölçer ile ‘güçlü şifre’yi göster. Offline da çalışır.",
        activity:"Gruplar: Bulut/IoT/Güvenlik kartı hazırlasın.",
        quiz:"Link tıklama, şifre, 2FA."
      },
      learnHtml: `
        <h3>Bulut (Cloud) nedir?</h3>
        <p>Dosyayı sadece bilgisayarda değil, internette de saklamak (Drive gibi).</p>
        <h3>IoT nedir?</h3>
        <p>İnternete bağlanan eşyalar: akıllı saat, akıllı lamba.</p>

        <div class="hr"></div>

        <h3>Siber güvenlik (çok basit kurallar)</h3>
        <ul>
          <li>Şifreni kimseyle paylaşma</li>
          <li>Tanımadığın linke tıklama</li>
          <li>Mümkünse 2 adımlı doğrulama kullan</li>
        </ul>
      `,
      animHtml: `
        <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
          <h3>Etkileşim: Şifre Gücü Ölçer (Offline)</h3>
          <p class="muted">Gerçek şifrenizi yazmayın. Örnek bir şifre deneyin.</p>
          <input id="passInput" placeholder="Örn: Km2026!Güvenli" class="mono" style="width:min(520px,100%); padding:10px 12px; border-radius:12px;"/>
          <div class="meter" style="margin-top:10px"><div id="passBar"></div></div>
          <div class="pill" id="passText">Güç: -</div>

          <div class="hr"></div>

          <h4>Güçlü şifre fikri</h4>
          <ul class="muted">
            <li>En az 12 karakter</li>
            <li>Büyük + küçük harf</li>
            <li>Sayı</li>
            <li>Sembol (! ? .)</li>
          </ul>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik: Teknoloji Kartları (16 dk)</h3>
        <ol>
          <li>3 grup: Bulut / IoT / Güvenlik</li>
          <li>Her grup 2 örnek + 1 risk yazsın</li>
          <li>1 dakikada sunsun</li>
        </ol>
        <div class="notice2"><strong>Mini soru:</strong> “En büyük risk nedir?” → Kişisel bilgi paylaşmak / zayıf şifre.</div>
      `,
      quiz: [
        { q:"Güvenlikte en doğru davranış?", options:["Tanımadığın linke tıklamamak","Şifreyi arkadaşla paylaşmak","Her yerde aynı şifre","Adresi paylaşmak"], correctIndex:0, explain:"Linkler tuzak olabilir."},
        { q:"Buluta örnek?", options:["Google Drive","Klavye","Mouse","Monitör"], correctIndex:0, explain:"Drive internet üzerinden depolama sağlar."},
      ]
    },

    // 6) AI INTRO (prompt builder + online/offline)
    {
      id:"ai_intro",
      title:"Yapay Zeka Giriş + Prompt Yazma",
      short:"AI nedir, ne değildir? Güvenli kullanım ve iyi prompt.",
      tags:["AI","Prompt","Etik"],
      timePlan:"Toplam 50 dk (Anlatım 14 • Demo 14 • Etkinlik 14 • Quiz 8)",
      teacherNotes:{
        learn:"AI her zaman doğru değil. ‘Kontrol et’ alışkanlığı ver.",
        anim:"İnternet varsa kötü prompt vs iyi prompt canlı göster. Offline: prompt builder ile metin üret.",
        activity:"Sınıfça 1 prompt yazıp geliştirin.",
        quiz:"Kişisel bilgi + doğruluk + prompt."
      },
      learnHtml: `
        <h3>Yapay zeka nedir?</h3>
        <p>Yapay zeka, örneklerden öğrenip cevap üreten program türüdür.</p>

        <h3>AI ne değildir?</h3>
        <ul>
          <li>Her zaman doğru söylemez</li>
          <li>Bazen tahmin eder</li>
        </ul>

        <div class="hr"></div>

        <h3>Güvenli kullanım</h3>
        <ul>
          <li>Kişisel bilgi yazma (adres, telefon, şifre)</li>
          <li>Ödevde kopyalama değil: anla, düzelt, kaynak ekle</li>
        </ul>

        <div class="hr"></div>

        <h3>İyi prompt formülü</h3>
        <div class="pill">Rol + Konu + Seviye + Format</div>
      `,
      animHtml: `
        <div class="card" style="background:rgba(0,0,0,.10); border-color:rgba(255,255,255,.08)">
          <h3>Demo (İnternet varsa)</h3>
          <ol>
            <li>Kötü prompt: “İnterneti anlat.”</li>
            <li>İyi prompt: “Bir öğretmen gibi… 5. sınıf… 5 madde + örnek…”</li>
            <li>Sonra sor: “Hangisi daha anlaşılır?”</li>
          </ol>

          <div class="hr"></div>

          <h3>Offline: Prompt Oluşturucu (Etkileşimli)</h3>
          <div class="toggleRow">
            <select id="roleSel">
              <option>Bir ilkokul öğretmeni gibi davran.</option>
              <option>Bir teknoloji eğitmeni gibi davran.</option>
              <option>Bir güvenlik uzmanı gibi davran.</option>
            </select>

            <select id="topicSel">
              <option>Güvenli şifre nasıl seçilir?</option>
              <option>İnternet nedir?</option>
              <option>Canva ile poster nasıl yapılır?</option>
              <option>Sunum nasıl hazırlanır?</option>
            </select>

            <select id="levelSel">
              <option>5. sınıf</option>
              <option>6. sınıf</option>
              <option>7. sınıf</option>
              <option>8. sınıf</option>
            </select>

            <select id="formatSel">
              <option>5 madde + 1 örnek</option>
              <option>3 adım + 1 kontrol listesi</option>
              <option>Kısa hikâye + 3 soru</option>
            </select>
          </div>

          <textarea id="promptOut" class="mono" rows="6" style="width:100%; margin-top:10px"></textarea>
          <div class="cta-row">
            <button class="primary" id="btnCopyPrompt">Promptu Kopyala</button>
          </div>

          <div class="notice2">
            <strong>İpucu:</strong> AI’ya “kısa, basit, örnekli” de. Sonra cevabı kontrol et.
          </div>
        </div>
      `,
      activityHtml: `
        <h3>Etkinlik: “Promptu iyileştirelim” (14 dk)</h3>
        <ol>
          <li>Tahtaya kötü prompt yaz: “Bunu anlat.”</li>
          <li>Sınıfça ekleyin: Rol + Seviye + Format</li>
          <li>Sonunda “güvenlik uyarısı ekle” deyin</li>
        </ol>
        <div class="notice2">
          <strong>Mini kontrol:</strong> Promptta “seviye” var mı? “format” var mı? “örnek” istiyor mu?
        </div>
      `,
      quiz: [
        { q:"Yapay zeka her zaman doğru mudur?", options:["Hayır","Evet","Sadece öğretmen kullanır","Sadece internet yokken çalışır"], correctIndex:0, explain:"AI bazen yanlış üretebilir; kontrol etmek gerekir."},
        { q:"İyi promptta hangisi önemlidir?", options:["Seviye ve format belirtmek","Şifre yazmak","Sadece 'anlat' demek","Kişisel bilgi paylaşmak"], correctIndex:0, explain:"Ne istediğini net söylersen cevap daha iyi olur."},
      ]
    },
  ];
}
async function loadWeeklyModulesInto(containerId, errorId){
  const container = document.getElementById(containerId);
  const errBox = document.getElementById(errorId);
  if(!container) return;

  container.innerHTML = `<div class="muted">Yükleniyor...</div>`;
  if(errBox) errBox.classList.add("hidden");

  try{
    // cache-busting: her güncellemede en güncel json gelsin
    const url = `./modules/modules.json?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error(`modules.json okunamadı (${res.status})`);
    const items = await res.json();

    if(!Array.isArray(items) || items.length === 0){
      container.innerHTML = `<div class="muted">Henüz modül eklenmemiş.</div>`;
      return;
    }

    // tarihe göre yeni -> eski
    items.sort((a,b)=> String(b.date).localeCompare(String(a.date)));

    container.innerHTML = items.map((m)=> {
      const tags = (m.tags || []).map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join("");
      const minutes = m.minutes ? `${m.minutes} dk` : "—";
      const note = m.note ? escapeHtml(m.note) : "";
      const href = m.href || "#";

      return `
        <div class="card" style="margin:12px 0; background:rgba(0,0,0,.12); border-color:rgba(255,255,255,.08)">
          <div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap; align-items:flex-start">
            <div>
              <div><strong>${escapeHtml(m.title || "Modül")}</strong></div>
              <div class="muted">${escapeHtml(m.date || "")} • ${escapeHtml(minutes)} ${note ? "• " + note : ""}</div>
              <div class="badges" style="margin-top:8px">${tags}</div>
            </div>
            <div class="cta-row" style="margin:0">
              <a class="btn" href="${escapeHtml(href)}" target="_blank" rel="noopener">Aç (Yeni Sekme)</a>
              <a class="btn" href="${escapeHtml(href)}">Bu Sekmede Aç</a>
            </div>
          </div>
        </div>
      `;
    }).join("");

  }catch(e){
    container.innerHTML = "";
    if(errBox){
      errBox.classList.remove("hidden");
      errBox.innerHTML = `
        <strong>Liste yüklenemedi.</strong><br/>
        <span class="muted">
          İnternet yoksa bu normal olabilir. Offline kullanım için siteyi ZIP indirip local çalıştırabilirsin.<br/>
          Hata: ${escapeHtml(e.message)}
        </span>
      `;
    }
  }
}