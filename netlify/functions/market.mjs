import { getStore } from "@netlify/blobs";
import { createHash, createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { PRODUCTS, COLOUR_STORIES } from "../../public/catalog.js";

const defaults = () => ({
  households: [1, 2, 3].map(i => ({id: "h" + i, name: "Household " + i, cap: ""})),
  made: {}
});
const env = key => process.env[key] || "";
const hasGateway = () => Boolean(env("RAZORPAY_KEY_ID") && env("RAZORPAY_KEY_SECRET"));
const same = (a, b) => timingSafeEqual(hash(a), hash(b));
const hash = value => createHash("sha256").update(String(value)).digest();
const sign = (secret, value) => createHmac("sha256", secret).update(value).digest("hex");
const dateHere = () => new Date().toLocaleDateString("en-CA", {timeZone:"Asia/Kolkata"});
function requireThat(condition, message, status = 400) {
  if (!condition) throw Object.assign(new Error(message), {status});
}
function string(value, min, max, label) {
  const s = typeof value === "string" ? value.trim() : "";
  requireThat(s.length >= min && s.length <= max, "Check " + label + ".");
  return s;
}
function choice(value, choices) {
  requireThat(choices.includes(value), "Choose an available option.");
  return value;
}
function wantedDate(value) {
  if (!value) return "";
  requireThat(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10) === value && value >= dateHere(), "Choose today or a later date.");
  return value;
}
function mobile(value) {
  requireThat(/^[6-9]\d{9}$/.test(value), "Enter a valid Indian mobile number.");
  return String(value);
}
function recordId(prefix, token) {
  requireThat(typeof token === "string" && /^[a-f0-9-]{36}$/.test(token), "Invalid receipt key.");
  return prefix + "-" + hash(token).toString("hex").slice(0,24).toUpperCase();
}
function sessionCookie(value, age) {
  return 'kg_session=' + value + '; Path=/.netlify/functions/market; HttpOnly; Secure; SameSite=Strict; Max-Age=' + age;
}
function authorize(req) {
  const secret = env("MAKERS_PASSWORD");
  requireThat(secret.length >= 16, "Set a makers’ password in Netlify to open this desk.", 503);
  const match = (req.headers.get("cookie") || "").match(/(?:^|;\s*)kg_session=(\d+)\.([a-f0-9]{64})(?:;|$)/);
  requireThat(match && +match[1] > Date.now() && same(match[2], sign(secret, "desk:" + match[1])), "Sign in to open the makers’ desk.", 401);
}
function order(body, id) {
  const c = body.details || {};
  const mode = choice(c.mode, ["pickup","delivery"]);
  const plan = choice(c.plan, ["advance","full"]);
  const method = choice(c.method, ["cash","online","arrange"]);
  requireThat(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 150, "Check the items in your cart.");
  const items = body.items.map(line => {
    const p = PRODUCTS.find(p => p.id === line.id);
    requireThat(p && p.price != null && Number.isInteger(line.qty) && line.qty > 0 && line.qty <= 999, "Check the design and quantity.");
    let custom = null;
    if (p.personalise) custom = {text:string(line.custom?.text, 1, 8, "the panel name"), colour:choice(line.custom?.colour, COLOUR_STORIES.map(c => c.id))};
    return {id:p.id, name:p.name, size:p.size, price:p.price, qty:line.qty, custom};
  });
  if (method === "cash") requireThat(mode === "pickup" && plan === "full" && !items.some(x => x.custom), "This order requires an advance or full payment.");
  if (method === "online") requireThat(hasGateway(), "Online payment is unavailable. Choose payment with the makers.", 409);
  const total = items.reduce((a,i) => a + i.qty*i.price, 0);
  const requested = plan === "advance" ? Math.round(total * 0.3) : total;
  let address = "Pickup from Kandil Galli";
  if (mode === "delivery") {
    requireThat(/^[1-9]\d{5}$/.test(c.pin), "Check the PIN code.");
    address = [string(c.addr,4,250,"the street address"), string(c.city,2,120,"the area and city"), c.pin].join(", ");
  }
  return {id, createdAt:Date.now(), items, total, requested, plan, method, mode, address, date:wantedDate(c.date),
    notes:string(c.notes,0,500,"the notes"), customer:{name:string(c.name,2,120,"the name"),phone:mobile(c.phone)},
    testPayment:method==="online" && env("RAZORPAY_KEY_ID").startsWith("rzp_test_"),paidNow:0,balance:total,payStatus:method === "cash" ? "Pay at pickup" : method === "online" ? "Awaiting online payment" : "Makers to confirm payment", status:"new"};
}
function enquiry(input,id) {
  const e = {id, createdAt:Date.now(), status:"New", phone:mobile(input.phone),date:wantedDate(input.date)};
  for (const k of ["name","occasion","size","qty","location","customNote"]) e[k] = string(input[k], k === "customNote" ? 0 : 1, 500, k);
  for (const k of ["designs","custom"]) {
    requireThat(Array.isArray(input[k]) && input[k].length <= 30, "Check the " + k + ".");
    e[k] = input[k].map(x => string(x,1,150,k));
  }
  return e;
}
async function update(db,key,f,initial=null) {
  for (let i=0;i<6;i++) {
    const previous = await db.getWithMetadata(key,{type:"json"});
    requireThat(previous || initial, "This record could not be found.", 404);
    const next = f(previous?.data ?? initial());
    const write = await db.setJSON(key,next,previous ? {onlyIfMatch:previous.etag} : {onlyIfNew:true});
    if (write.modified) return next;
  }
  requireThat(false,"Another maker updated this record. Refresh and retry.",409);
}
async function gateway(path, opts={}) {
  const auth = Buffer.from(env("RAZORPAY_KEY_ID")+":"+env("RAZORPAY_KEY_SECRET")).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/payment_links"+path,{...opts,headers:{Authorization:"Basic "+auth,"Content-Type":"application/json"},signal:AbortSignal.timeout(10000)});
  requireThat(r.ok, "The payment provider could not complete this request. Your order is saved. Try again from your receipt.", 502);
  return r.json();
}
async function paymentLink(db,o,origin) {
  requireThat(o.method === "online" && hasGateway() && !o.paidNow && !o.balanceReceived, "This order has no online payment due.",409);
  if (o.link) return o.link;
  const search = () => gateway("?reference_id="+encodeURIComponent(o.id));
  let link = (await search()).payment_links?.find(l=>l.reference_id===o.id);
  if (!link) {
    try {
      link = await gateway("",{method:"POST",body:JSON.stringify({
        amount:o.requested*100,currency:"INR",accept_partial:false,reference_id:o.id,
        description:"Kandil Galli · "+o.id, callback_url:origin+"/?receipt="+o.id,callback_method:"get",
        notify:{sms:false,email:false},reminder_enable:false
      })});
    } catch (e) {
      link = (await search()).payment_links?.find(l=>l.reference_id===o.id);
      if (!link) throw e;
    }
  }
  requireThat(link.reference_id===o.id && link.currency==="INR" && link.amount===o.requested*100 && /^https:\/\//.test(link.short_url),"Could not verify this payment link.",502);
  const saved=await update(db,o.id,record=>({...record,link:{id:link.id,url:link.short_url}}));
  return saved.link;
}
async function recordPaid(db,id,link) {
  return update(db,id,o=>{
    requireThat(o.method==="online" && link.reference_id===id && (!o.link || link.id===o.link.id) &&
      link.currency==="INR" && link.status==="paid" && link.amount_paid===o.requested*100,"Payment details do not match.",409);
    return {...o,paidNow:o.requested,balance:o.total-o.requested,payStatus:o.plan==="advance" ? "30% advance paid" : "Paid in full"};
  });
}
async function list(db,prefix) {
  const {blobs}=await db.list();
  return (await Promise.all(blobs.filter(x=>x.key.startsWith(prefix)).map(x=>db.get(x.key,{type:"json"})))).filter(Boolean);
}
function editSettings(s,b) {
  if (b.edit==="made") {
    requireThat(PRODUCTS.some(p=>p.id===b.id && p.price!=null),"Unknown design.");
    requireThat(b.value==="" || Number.isInteger(b.value) && b.value>=0 && b.value<=999999,"Check the production count.");
    s.made[b.id]=b.value;
    return s;
  }
  if (b.edit==="hhAdd") {
    s.households.push({id:"h"+randomUUID(),name:"Household "+(s.households.length+1),cap:""});
    return s;
  }
  const h=s.households.find(h=>h.id===b.id);
  requireThat(h,"Refresh to see the current households.",409);
  if (b.edit==="hhDel") {
    requireThat(s.households.length>1,"Keep at least one household.");
    s.households=s.households.filter(h=>h.id!==b.id);
  } else if (b.edit==="hhName") h.name=string(b.value,1,120,"the household name");
  else if (b.edit==="hhCap") {
    requireThat(b.value==="" || Number.isInteger(b.value) && b.value>=0 && b.value<=999999,"Check the weekly capacity.");
    h.cap=b.value;
  } else requireThat(false,"Unknown setting.");
  return s;
}
const response=(data,status=200,headers={})=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store", ...headers}});
export default async function market(req) {
  try {
    requireThat(req.method==="POST","Use POST.",405);
    const address=new URL(req.url);
    const origin=req.headers.get("origin");
    requireThat(!origin || origin===address.origin,"Request origin is invalid.",403);
    const raw=await req.text();
    requireThat(Buffer.byteLength(raw)<=64000,"Request too large.",413);
    const db=getStore("kandil-market",{consistency:"strong"});
    if (address.searchParams.has("webhook")) {
      requireThat(env("RAZORPAY_WEBHOOK_SECRET") && same(req.headers.get("x-razorpay-signature"),sign(env("RAZORPAY_WEBHOOK_SECRET"),raw)),"Invalid webhook signature.",401);
      const event=JSON.parse(raw);
      if (event.event==="payment_link.paid") {
        const link=event.payload?.payment_link?.entity;
        if (/^KG-[A-F0-9]{24}$/.test(link?.reference_id)) await recordPaid(db,link.reference_id,link);
      }
      return response({ok:true});
    }
    requireThat(req.headers.get("content-type")?.startsWith("application/json"),"Send JSON.",415);
    const b=JSON.parse(raw);
    if (b.action==="config") return response({online:hasGateway(),test:env("RAZORPAY_KEY_ID").startsWith("rzp_test_")});
    if (b.action==="login") {
      const secret=env("MAKERS_PASSWORD");
      requireThat(secret.length>=16,"Set MAKERS_PASSWORD in Netlify (at least 16 characters) and redeploy.",503);
      requireThat(typeof b.password==="string" && same(b.password,secret),"Incorrect makers’ password.",401);
      const exp=String(Date.now()+8*3600*1000);
      return response({ok:true},200,{"Set-Cookie":sessionCookie(exp+"."+sign(secret,"desk:"+exp),28800)});
    }
    if (b.action==="logout") return response({ok:true},200,{"Set-Cookie":sessionCookie("",0)});
    if (b.action==="order" || b.action==="enquiry") {
      const id=recordId(b.action==="order" ? "KG" : "BQ",b.token);
      const existing=await db.get(id,{type:"json"});
      if (existing) return response({id});
      const data=b.action==="order" ? order(b,id) : enquiry(b.details,id);
      await db.setJSON(id,data,{onlyIfNew:true});
      return response({id},201);
    }
    if (b.action==="track" || b.action==="pay") {
      const id=recordId("KG",b.token);
      let o=await db.get(id,{type:"json"});
      requireThat(o,"Order could not be found.",404);
      if (b.action==="pay") return response(await paymentLink(db,o,address.origin));
      let paymentCheck="";
      if (o.link && !o.paidNow && hasGateway()) {
        try {
          const link=await gateway("/"+encodeURIComponent(o.link.id));
          if (link.status==="paid") o=await recordPaid(db,id,link);
          else if (["expired","cancelled"].includes(link.status)) paymentCheck="The payment link has "+link.status+". Contact the makers to arrange payment.";
        } catch { paymentCheck="Payment confirmation is temporarily unavailable. Refresh this receipt shortly."; }
      }
      return response({order:o,paymentCheck});
    }
    authorize(req);
    if (b.action==="desk") {
      const [orders,enquiries,settings]=await Promise.all([list(db,"KG-"),list(db,"BQ-"),db.get("settings",{type:"json"})]);
      return response({orders,enquiries,settings:settings||defaults()});
    }
    if (b.action==="settings") return response(await update(db,"settings",s=>editSettings(s,b),defaults));
    if (b.action==="change") {
      requireThat(/^(KG|BQ)-[A-F0-9]{24}$/.test(b.id),"Invalid record.");
      const values={status:["new","accepted","production","ready","delivered"],estatus:["New","Called","Quote sent","Booked with advance","Closed"]};
      if (b.field==="household") {
        const s=await db.get("settings",{type:"json"})||defaults();
        requireThat(b.value==="" || s.households.some(h=>h.id===b.value),"Choose a current household.");
      } else if (b.field==="balanceReceived") requireThat(b.id.startsWith("KG-") && typeof b.value==="boolean","Invalid receipt.");
      else {
        requireThat(b.field===(b.id.startsWith("KG-")?"status":"estatus"),"Invalid field.");
        choice(b.value,values[b.field]);
      }
      return response(await update(db,b.id,o=>{
        if (b.field==="balanceReceived" && o.method==="online" && !o.paidNow) requireThat(false,"Confirm the online payment first.",409);
        if (b.field==="balanceReceived" && o.method==="arrange") return {...o,manualPaid:b.value ? o.total : 0,balanceReceived:b.value};
        return {...o,[b.field]:b.value};
      }));
    }
    if (b.action==="manualPaid") {
      requireThat(/^KG-[A-F0-9]{24}$/.test(b.id),"Invalid order.");
      return response(await update(db,b.id,o=>{
        requireThat(o.method==="arrange" && Number.isInteger(b.value) && b.value>=0 && b.value<=o.total,"Enter the total amount received for this order.");
        return {...o,manualPaid:b.value,balanceReceived:b.value===o.total};
      }));
    }
    requireThat(false,"Unknown action.",404);
  } catch(e) {
    if (e instanceof SyntaxError) return response({error:"Invalid JSON."},400);
    return response({error:e.status ? e.message : "The shop service is temporarily unavailable. Please try again."},e.status||503);
  }
}
export const config={rateLimit:{windowSize:60,windowLimit:100,aggregateBy:["ip"]}};
