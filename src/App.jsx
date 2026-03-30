import { useState, useMemo, useEffect } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzuQ1JVabLW4uQLqU4DJQ3cvLXA4xqxNaOVDFTlTosTyMIklYuWg8l63iay9zoBxwH9/exec";

const RANK_CFG = {
  S:{label:"S — 本人肉声",bg:"#FFF3E0",border:"#E65100",text:"#E65100",pill:"#FFD0A0"},
  A:{label:"A — 直接引用",bg:"#E8F5E9",border:"#2E7D32",text:"#1B5E20",pill:"#A5D6A7"},
  B:{label:"B — 研究者解釈",bg:"#E3F2FD",border:"#1565C0",text:"#0D47A1",pill:"#90CAF9"},
  C:{label:"C — 断片補完",bg:"#F3E5F5",border:"#7B1FA2",text:"#6A1B9A",pill:"#CE93D8"},
};
const ACCESS_CFG = {
  "無料":     {bg:"#E8F5E9",text:"#1B5E20"},
  "サブスク": {bg:"#E3F2FD",text:"#0D47A1"},
  "有料購入": {bg:"#FFF3E0",text:"#E65100"},
  "要申請":   {bg:"#FCE4EC",text:"#880E4F"},
};
const STATUS_CFG = {
  "未着手": {bg:"#F5F5F5",text:"#757575",icon:"○"},
  "収集中": {bg:"#E3F2FD",text:"#1565C0",icon:"▷"},
  "整理中": {bg:"#FFFDE7",text:"#F57F17",icon:"◈"},
  "完了":   {bg:"#E8F5E9",text:"#2E7D32",icon:"✓"},
};

function normalizeRow(row) {
  const keyMap = {
    "ID":"id","人物名":"person","カテゴリ":"cat",
    "ドキュメントタイトル":"title","ソース名":"source",
    "ドキュメント種別":"type","媒体":"media","言語":"lang","年":"year",
    "信頼度\n(S/A/B/C)":"rank","信頼度\r\n(S/A/B/C)":"rank","信頼度(S/A/B/C)":"rank",
    "人物の役割":"role","入手方法":"access",
    "URL（直リンク）":"url","備考・抽出ポイント":"note",
  };
  const out = {};
  for (const [k,v] of Object.entries(row)) {
    const key = k.trim().replace(/\r\n|\n/g,"\n");
    const mapped = keyMap[key] || keyMap[k.trim()] || k.trim();
    out[mapped] = v ?? "";
  }
  return out;
}

export default function App() {
  const [rawData,  setRawData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [rankF,    setRankF]    = useState([]);
  const [personF,  setPersonF]  = useState([]);
  const [accessF,  setAccessF]  = useState([]);
  const [statusF,  setStatusF]  = useState([]);
  const [sel,      setSel]      = useState(null);
  const [view,     setView]     = useState("table");
  const [statuses, setStatuses] = useState({});
  const [lastFetch,setLastFetch]= useState(null);

  const fetchData = () => {
    setLoading(true); setError(null);
    fetch(GAS_URL)
      .then(r => r.json())
      .then(rows => {
        const data = rows.map(normalizeRow).filter(r => r.id && r.id !== "ID" && String(r.id).trim());
        setRawData(data);
        setStatuses(prev => {
          const next = {...prev};
          data.forEach(d => { if (!next[d.id]) next[d.id] = "未着手"; });
          return next;
        });
        setLastFetch(new Date().toLocaleTimeString("ja-JP"));
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (arr,setArr,v) => setArr(arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]);
  const PERSONS = useMemo(() => [...new Set(rawData.map(d=>d.person).filter(Boolean))],[rawData]);

  const filtered = useMemo(() => rawData.filter(d => {
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase()) && !d.person?.includes(search)) return false;
    if (rankF.length   && !rankF.includes(d.rank))    return false;
    if (personF.length && !personF.includes(d.person)) return false;
    if (accessF.length && !accessF.includes(d.access)) return false;
    if (statusF.length && !statusF.includes(statuses[d.id])) return false;
    return true;
  }),[rawData,search,rankF,personF,accessF,statusF,statuses]);

  const personStats = useMemo(() => {
    const m = {};
    rawData.forEach(d => {
      if (!m[d.person]) m[d.person] = {S:0,A:0,B:0,C:0,total:0,done:0};
      if (d.rank) m[d.person][d.rank] = (m[d.person][d.rank]||0)+1;
      m[d.person].total++;
      if (statuses[d.id]==="完了") m[d.person].done++;
    });
    return m;
  },[rawData,statuses]);

  const totalDone = Object.values(statuses).filter(s=>s==="完了").length;
  const totalPct  = rawData.length ? Math.round(totalDone/rawData.length*100) : 0;

  const Pill = ({rank}) => {
    const c = RANK_CFG[rank]||{pill:"#eee",text:"#999"};
    return <span style={{display:"inline-block",padding:"1px 7px",borderRadius:4,fontSize:11,fontWeight:500,background:c.pill,color:c.text}}>{rank}級</span>;
  };
  const Badge = ({label,bg,text}) =>
    <span style={{display:"inline-block",padding:"1px 7px",borderRadius:4,fontSize:10,fontWeight:500,background:bg||"#eee",color:text||"#555",whiteSpace:"nowrap"}}>{label}</span>;
  const Chip = ({label,active,color,onClick}) =>
    <button onClick={onClick} style={{border:active?`1.5px solid ${color}`:"0.5px solid #d0d0d0",background:active?color+"18":"transparent",borderRadius:20,padding:"3px 10px",fontSize:12,cursor:"pointer",color:active?color:"#666",fontWeight:active?500:400,whiteSpace:"nowrap"}}>{label}</button>;

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:12}}>
      <div style={{width:36,height:36,border:"3px solid #eee",borderTop:"3px solid #1565C0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:13,color:"#888"}}>Googleスプレッドシートから読み込み中...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:12,padding:24}}>
      <div style={{fontSize:15,color:"#C62828",fontWeight:500}}>読み込みエラー</div>
      <div style={{fontSize:12,color:"#777",background:"#FFF3E0",padding:"10px 14px",borderRadius:6,maxWidth:480,lineHeight:1.6}}>{error}</div>
      <div style={{fontSize:12,color:"#666",maxWidth:480,textAlign:"center",lineHeight:1.7}}>
        GAS設定: 「デプロイ」→「デプロイを管理」→「アクセスできるユーザー」が<strong>「全員」</strong>か確認してください。
      </div>
      <button onClick={fetchData} style={{border:"0.5px solid #1565C0",background:"#E3F2FD",color:"#1565C0",borderRadius:6,padding:"6px 18px",fontSize:13,cursor:"pointer"}}>再試行</button>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",minHeight:500,fontFamily:"var(--font-sans,sans-serif)",fontSize:13,overflow:"hidden"}}>

      {/* サイドバー */}
      <div style={{width:210,flexShrink:0,borderRight:"0.5px solid #e0e0e0",overflowY:"auto",padding:"14px 12px",background:"#FAFAFA"}}>
        <div style={{fontWeight:500,fontSize:14,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:16}}>🎬</span> Disney Library
        </div>
        <div style={{fontSize:10,color:"#ccc",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
          {lastFetch && <span>更新: {lastFetch}</span>}
          <button onClick={fetchData} style={{border:"none",background:"none",cursor:"pointer",fontSize:10,color:"#1565C0",padding:0}}>↻ 再読込</button>
        </div>

        <div style={{background:"#fff",border:"0.5px solid #e8e8e8",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:"#888"}}>全体完了率</span>
            <span style={{fontSize:12,fontWeight:500,color:"#2E7D32"}}>{totalPct}%</span>
          </div>
          <div style={{height:5,background:"#eee",borderRadius:3,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:`${totalPct}%`,background:"#66BB6A",borderRadius:3,transition:"width 0.3s"}}/>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["S","A","B","C"].map(r=>{const n=rawData.filter(d=>d.rank===r).length;return n?<span key={r} style={{background:RANK_CFG[r].pill,color:RANK_CFG[r].text,fontSize:10,padding:"1px 6px",borderRadius:3,fontWeight:500}}>{r}:{n}</span>:null;})}
            <span style={{fontSize:10,color:"#ccc",marginLeft:"auto"}}>{rawData.length}件</span>
          </div>
        </div>

        <hr style={{border:"none",borderTop:"0.5px solid #e8e8e8",margin:"10px 0"}}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#aaa",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:6}}>信頼度ランク</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {["S","A","B","C"].map(r=><Chip key={r} label={RANK_CFG[r].label} active={rankF.includes(r)} color={RANK_CFG[r].text} onClick={()=>toggle(rankF,setRankF,r)}/>)}
          </div>
        </div>

        <hr style={{border:"none",borderTop:"0.5px solid #e8e8e8",margin:"10px 0"}}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#aaa",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:6}}>人物</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {PERSONS.map(p=>{
              const ps=personStats[p];
              const pct=ps?Math.round(ps.done/ps.total*100):0;
              const active=personF.includes(p);
              return(
                <button key={p} onClick={()=>toggle(personF,setPersonF,p)} style={{border:active?"1.5px solid #333":"0.5px solid #e0e0e0",background:active?"#f0f0f0":"#fff",borderRadius:6,padding:"5px 8px",cursor:"pointer",textAlign:"left"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:11,fontWeight:active?500:400,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{p&&p.length>12?p.slice(0,12)+"…":p}</span>
                    <span style={{fontSize:10,color:pct===100?"#2E7D32":"#999",fontWeight:500,marginLeft:4}}>{pct}%</span>
                  </div>
                  <div style={{height:3,background:"#eee",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4CAF50":"#90CAF9",borderRadius:2}}/></div>
                </button>
              );
            })}
          </div>
        </div>

        <hr style={{border:"none",borderTop:"0.5px solid #e8e8e8",margin:"10px 0"}}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#aaa",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:6}}>入手方法</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {["無料","有料購入","サブスク","要申請"].map(a=><Chip key={a} label={a} active={accessF.includes(a)} color={ACCESS_CFG[a]?.text||"#555"} onClick={()=>toggle(accessF,setAccessF,a)}/>)}
          </div>
        </div>

        <hr style={{border:"none",borderTop:"0.5px solid #e8e8e8",margin:"10px 0"}}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#aaa",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:6}}>進捗</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {Object.entries(STATUS_CFG).map(([s,c])=><Chip key={s} label={`${c.icon} ${s}`} active={statusF.includes(s)} color={c.text} onClick={()=>toggle(statusF,setStatusF,s)}/>)}
          </div>
        </div>

        {(rankF.length||personF.length||accessF.length||statusF.length||search)&&(
          <button onClick={()=>{setRankF([]);setPersonF([]);setAccessF([]);setStatusF([]);setSearch("");}} style={{width:"100%",border:"0.5px solid #FFCDD2",borderRadius:6,padding:"5px 0",background:"#FFEBEE",color:"#B71C1C",fontSize:11,cursor:"pointer",marginTop:4}}>フィルターをクリア</button>
        )}
      </div>

      {/* メインエリア */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <div style={{padding:"10px 16px",borderBottom:"0.5px solid #e8e8e8",display:"flex",alignItems:"center",gap:10,flexShrink:0,background:"#fff"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="タイトル・人物名で検索..." style={{flex:1,maxWidth:360,height:30,fontSize:12,padding:"0 10px",borderRadius:6,border:"0.5px solid #d0d0d0",outline:"none"}}/>
          <span style={{fontSize:11,color:"#999",whiteSpace:"nowrap"}}>{filtered.length}/{rawData.length}件</span>
          <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
            {["table","progress"].map(v=><button key={v} onClick={()=>setView(v)} style={{border:view===v?"1.5px solid #333":"0.5px solid #d0d0d0",background:view===v?"#f0f0f0":"transparent",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer",color:"#333"}}>{v==="table"?"テーブル":"人物別進捗"}</button>)}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {view==="progress"&&(
            <div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
              {PERSONS.map(p=>{
                const ps=personStats[p];if(!ps)return null;
                const pct=Math.round(ps.done/ps.total*100);
                return(
                  <div key={p} style={{background:"#fff",border:"0.5px solid #e8e8e8",borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontWeight:500,fontSize:13,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                      {["S","A","B","C"].filter(r=>ps[r]>0).map(r=><span key={r} style={{background:RANK_CFG[r].pill,color:RANK_CFG[r].text,fontSize:10,padding:"1px 6px",borderRadius:3,fontWeight:500}}>{r}:{ps[r]}</span>)}
                      <span style={{fontSize:10,color:"#999",marginLeft:"auto"}}>{ps.total}件</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:3}}>
                      <span>完了 {ps.done}/{ps.total}</span>
                      <span style={{color:pct===100?"#2E7D32":pct>0?"#F57F17":"#ccc",fontWeight:500}}>{pct}%</span>
                    </div>
                    <div style={{height:5,background:"#eee",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,transition:"width 0.3s",borderRadius:3,background:pct===100?"#4CAF50":pct>0?"#FFA726":"transparent"}}/></div>
                  </div>
                );
              })}
            </div>
          )}

          {view==="table"&&(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#F8F8F8",borderBottom:"0.5px solid #e0e0e0",position:"sticky",top:0,zIndex:10}}>
                  {["ID","人物","タイトル","ソース","ランク","入手","リンク","ステータス"].map(h=><th key={h} style={{padding:"7px 10px",fontWeight:500,fontSize:11,color:"#888",textAlign:"left",whiteSpace:"nowrap",borderBottom:"0.5px solid #e8e8e8"}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d,i)=>{
                  const isSel=sel?.id===d.id;
                  const stCfg=STATUS_CFG[statuses[d.id]]||STATUS_CFG["未着手"];
                  const accCfg=ACCESS_CFG[d.access]||{bg:"#F5F5F5",text:"#757575"};
                  return(
                    <tr key={d.id} onClick={()=>setSel(isSel?null:d)} style={{borderBottom:"0.5px solid #F0F0F0",cursor:"pointer",background:isSel?"#F0F4FF":i%2===0?"#fff":"#FAFAFA",transition:"background 0.1s"}}>
                      <td style={{padding:"6px 10px",fontFamily:"monospace",fontSize:10,color:"#AAA",whiteSpace:"nowrap"}}>{d.id}</td>
                      <td style={{padding:"6px 10px",fontWeight:500,whiteSpace:"nowrap",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis"}} title={d.person}>{d.person&&d.person.length>9?d.person.slice(0,9)+"…":d.person}</td>
                      <td style={{padding:"6px 10px",maxWidth:220}}>
                        <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{d.title}</div>
                        <div style={{fontSize:10,color:"#999"}}>{d.year}</div>
                      </td>
                      <td style={{padding:"6px 10px",maxWidth:130,overflow:"hidden"}}><div style={{fontSize:10,color:"#777",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.source}</div></td>
                      <td style={{padding:"6px 10px",whiteSpace:"nowrap"}}><Pill rank={d.rank}/></td>
                      <td style={{padding:"6px 10px",whiteSpace:"nowrap"}}><Badge label={d.access} bg={accCfg.bg} text={accCfg.text}/></td>
                      <td style={{padding:"6px 10px"}} onClick={e=>e.stopPropagation()}>
                        {d.url&&<a href={d.url} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"2px 8px",borderRadius:4,background:"#E3F2FD",color:"#1565C0",fontSize:10,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap"}}>開く →</a>}
                      </td>
                      <td style={{padding:"6px 10px"}} onClick={e=>e.stopPropagation()}>
                        <select value={statuses[d.id]||"未着手"} onChange={e=>setStatuses(p=>({...p,[d.id]:e.target.value}))} style={{fontSize:11,border:"0.5px solid #ddd",borderRadius:4,padding:"2px 4px",cursor:"pointer",background:stCfg.bg,color:stCfg.text}}>
                          {Object.keys(STATUS_CFG).map(s=><option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 詳細パネル */}
      {sel&&(
        <div style={{width:300,flexShrink:0,borderLeft:"0.5px solid #e8e8e8",overflowY:"auto",padding:"14px 14px",background:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{display:"inline-block",padding:"3px 10px",borderRadius:4,background:(RANK_CFG[sel.rank]||{bg:"#eee"}).bg,border:`1px solid ${(RANK_CFG[sel.rank]||{border:"#ccc"}).border}`,fontSize:11,fontWeight:500,color:(RANK_CFG[sel.rank]||{text:"#555"}).text}}>{(RANK_CFG[sel.rank]||{label:sel.rank}).label}</div>
            <button onClick={()=>setSel(null)} style={{border:"none",background:"none",cursor:"pointer",fontSize:16,color:"#bbb",padding:0,lineHeight:1}}>✕</button>
          </div>
          <div style={{fontWeight:500,fontSize:13,lineHeight:1.4,marginBottom:4}}>{sel.title}</div>
          <div style={{fontSize:11,color:"#999",marginBottom:10}}>{sel.year} · {sel.source}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
            <Badge label={sel.access} bg={ACCESS_CFG[sel.access]?.bg||"#eee"} text={ACCESS_CFG[sel.access]?.text||"#555"}/>
            {sel.media&&<Badge label={sel.media} bg="#F5F5F5" text="#616161"/>}
            {sel.lang&&<Badge label={sel.lang.toUpperCase()} bg="#F5F5F5" text="#616161"/>}
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:3}}>人物 / 役割</div>
            <div style={{fontSize:12,fontWeight:500}}>{sel.person}</div>
            <div style={{fontSize:11,color:"#888"}}>{sel.role}</div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:3}}>種別</div>
            <div style={{fontSize:11,color:"#555"}}>{sel.type}</div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:3}}>抽出ポイント</div>
            <div style={{fontSize:11,lineHeight:1.6,color:"#444",background:"#F8F9FA",borderRadius:6,padding:"8px 10px",borderLeft:"2px solid #E0E0E0"}}>{sel.note}</div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:"#bbb",fontWeight:500,letterSpacing:0.6,textTransform:"uppercase",marginBottom:5}}>進捗ステータス</div>
            <select value={statuses[sel.id]||"未着手"} onChange={e=>setStatuses(p=>({...p,[sel.id]:e.target.value}))} style={{width:"100%",fontSize:12,border:"0.5px solid #ddd",borderRadius:6,padding:"6px 8px",cursor:"pointer",background:STATUS_CFG[statuses[sel.id]]?.bg||"#F5F5F5",color:STATUS_CFG[statuses[sel.id]]?.text||"#757575"}}>
              {Object.keys(STATUS_CFG).map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {sel.url&&<a href={sel.url} target="_blank" rel="noreferrer" style={{display:"block",padding:"8px 0",borderRadius:6,textAlign:"center",background:"#1565C0",color:"#fff",textDecoration:"none",fontSize:12,fontWeight:500}}>ソースを開く →</a>}
        </div>
      )}
    </div>
  );
}
