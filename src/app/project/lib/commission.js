// LOGIC ONLY
export const fmtIDR = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
        .format(Math.round(n || 0));

export const toNumber = (s) => Number(String(s ?? "").replace(/[^0-9.-]/g, "")) || 0;

export function perUnitCommission(p) {
    return Math.max(((p.price ?? 0) - (p.vc || 0)), 0) * (p.rate || 0);
}
export function rowSubtotal(p) { return perUnitCommission(p) * (p.qty == null ? 0 : +p.qty); }
export function warningBelowVC(p) { return (p.price || 0) < (p.vc || 0) - 1e-6; }
export function displayQty(p) { if (p.qty == null) return ""; const s = p.step || 1; return s===1 ? String(Math.round(p.qty)) : String(Number(p.qty).toFixed(1)); }
export function unitFor(p) { return p.family.toLowerCase() === "bond" ? "sak" : "m3"; }

export function computeSummary({ items, target = 0, achPctAAC = null, achPctBond = null }) {
    const aAchRaw = items.filter(p=>p.family==="AAC").reduce((s,p)=>s+rowSubtotal(p),0);
    const bAchRaw = items.filter(p=>p.family==="Bond").reduce((s,p)=>s+rowSubtotal(p),0);

    const xA = achPctAAC ?? null, xB = achPctBond ?? null;

    let baseA=0,b1A=0,b2A=0;
    if (xA!==null){ if(xA>=70){ if(xA<=100){ baseA=(xA/100)*1.0*aAchRaw; b1A=(xA/100)*0.1*aAchRaw; }
    else{ baseA=1.0*aAchRaw; b1A=0.1*aAchRaw; b2A=(xA/100)*1.2*aAchRaw-1.1*aAchRaw; } } }
    else baseA=aAchRaw;

    let baseB=0,b1B=0,b2B=0;
    if (xB!==null){ if(xB>=50){ if(xB<=100){ baseB=(xB/100)*1.0*bAchRaw; b1B=xB>=70?(xB/100)*0.1*bAchRaw:0; }
    else{ baseB=1.0*bAchRaw; b1B=0.1*bAchRaw; b2B=(xB/100)*1.2*bAchRaw-1.1*bAchRaw; } } }
    else baseB=bAchRaw;

    if (xA===null || xA<70) b1A=0;
    if (xB===null || xB<70) b1B=0;

    const baseTotal = baseA + baseB;
    const bonus1 = b1A + b1B;
    const bonus2 = b2A + b2B;
    const subtotal = baseTotal + bonus1 + bonus2;

    const rem = Math.max(0, target - baseTotal);
    const pct = target ? Math.min(100, Math.round((baseTotal/target)*100)) : 0;

    return { aAchRaw, bAchRaw, baseTotal, bonus1, bonus2, subtotal, target, rem, pct };
}

export function computeSummarySplit({ items, targetAAC = 0, targetBond = 0 }) {
    const famAch = (fam) => items.filter(p=>p.family===fam).reduce((s,p)=>s+rowSubtotal(p),0);
    const baseA=famAch("AAC"), baseB=famAch("Bond");
    const remAAC=Math.max(0,targetAAC-baseA), remBond=Math.max(0,targetBond-baseB);
    const totalTar=targetAAC+targetBond;
    const pct = totalTar ? Math.min(100, Math.round(((totalTar-(remAAC+remBond))/totalTar)*100)) : 0;
    return { baseA, baseB, baseTotal: baseA+baseB, remAAC, remBond, totalTar, pct };
}

export function distributeGreedy({ items, target }) {
    const achieved = () => items.reduce((s,p)=>s+rowSubtotal(p),0);
    let R = Math.max(0, (target||0) - achieved());
    if (R<=0) return items;

    const cands = items.map(p=>({p, per: perUnitCommission(p)})).filter(x=>x.per>0);
    cands.sort((a,b)=>b.per-a.per);
    for(const c of cands){
        if(R<=0) break;
        const step=c.p.step||1, perStep=c.per*step;
        if(perStep<=0) continue;
        const addSteps=Math.ceil(R/perStep);
        c.p.qty = step===1
            ? Math.max(0, Math.round((c.p.qty||0)+addSteps*step))
            : Math.max(0, Math.round(((c.p.qty||0)+addSteps*step)/step)*step);
        R = Math.max(0, (target||0) - achieved());
    }
    return items;
}
