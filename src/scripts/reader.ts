import type {Results} from '../lib/model';
declare global { interface Window { turnstile?:{reset:(id:string)=>void;remove:(id:string)=>void;render:(element:HTMLElement,options:{sitekey:string;action:string;theme:string;size:string})=>string} } }
const widgetIds=new WeakMap<HTMLElement,string>();
function renderWidgets(){
  if(!window.turnstile)return;
  document.querySelectorAll<HTMLElement>('.turnstile-widget').forEach(element=>{
    if(widgetIds.has(element))return;const details=element.closest('details');
    if(details&&!details.open)return;
    widgetIds.set(element,window.turnstile!.render(element,{sitekey:element.dataset.sitekey!,action:element.dataset.action!,theme:'auto',size:'flexible'}));
  });
}
if(document.querySelector('.turnstile-widget')){
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.addEventListener('load',renderWidgets,{once:true});document.head.appendChild(script);
  document.addEventListener('toggle',renderWidgets,true);
}
function showResults(data:Results){
  document.querySelector('[data-average-value]')!.textContent=data.average===null?'—':data.average.toFixed(1);
  document.querySelector<HTMLElement>('#average .out-of')!.hidden=data.average===null;
  document.querySelector('#response-count')!.textContent=String(data.count);document.querySelector<HTMLElement>('#results-empty')!.hidden=data.count>0;
  const max=Math.max(1,...data.distribution);
  document.querySelectorAll<HTMLElement>('.distribution-column').forEach((column,i)=>{const count=data.distribution[i];column.querySelector('.bar-count')!.textContent=count?String(count):'';column.querySelector<HTMLElement>('.bar')!.style.setProperty('--bar-height',`${count/max*100}%`);column.querySelector('[data-bar-label]')!.textContent=`Score ${i}: ${count} ${count===1?'response':'responses'}`;});
}
async function refreshComments(){
  // Fetch the current server-rendered page to keep ownership controls and escaping identical to SSR.
  const response=await fetch(location.pathname,{headers:{Accept:'text/html'}});if(!response.ok)throw new Error('Your submission was saved, but comments could not be refreshed. Reload to see them.');
  const documentCopy=new DOMParser().parseFromString(await response.text(),'text/html');
  const source=documentCopy.querySelector('#comment-list');if(!source)throw new Error('Your submission was saved. Reload to see the comment.');
  const hasComments=!!source.querySelector('article');
  document.querySelectorAll<HTMLElement>('#comment-list .turnstile-widget').forEach(element=>{const id=widgetIds.get(element);if(id)window.turnstile?.remove(id);});
  document.querySelector('#comment-list')!.replaceChildren(...Array.from(source.childNodes));
  document.querySelector<HTMLElement>('#comments-empty')!.hidden=hasComments;
  const oldMore=document.querySelector('.more-comments');oldMore?.remove();const more=documentCopy.querySelector('.more-comments');if(more)document.querySelector('#comments')!.appendChild(more as Node);
  renderWidgets();
}
document.addEventListener('submit',async(event)=>{
  const form=event.target;if(!(form instanceof HTMLFormElement) || !form.classList.contains('reader-form'))return;
  event.preventDefault();if(!form.reportValidity())return;
  const button=form.querySelector<HTMLButtonElement>('button[type=submit]')!;if(button.disabled)return;
  const status=form.querySelector<HTMLElement>('.form-status')!;const original=button.textContent;button.disabled=true;button.textContent='Saving…';status.textContent='';status.classList.remove('error');
  const body=Object.fromEntries(new FormData(form));
  try {
    const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
    const result=await response.json() as {error?:string;message:string;rating?:{score:number;version:number};results?:Results};
    if(!response.ok)throw new Error(result.error||'The form could not be saved. Please try again.');
    if(form.dataset.action==='rating' && result.rating && result.results){showResults(result.results);form.querySelector<HTMLInputElement>('[name=version]')!.value=String(result.rating.version);form.querySelector<HTMLInputElement>('[name=requestId]')!.value=crypto.randomUUID();document.querySelector('#saved-rating')!.textContent=`Your saved rating: ${result.rating.score} / 10. You can update it from this browser.`;button.textContent='Update rating';}
    else if(form.dataset.action==='report'){status.textContent=result.message;return;}
    else {if(form.dataset.action==='comment'){form.reset();form.querySelector<HTMLInputElement>('[name=requestId]')!.value=crypto.randomUUID();}await refreshComments();}
    const visibleStatus=status.isConnected?status:document.querySelector<HTMLElement>('#comment-form .form-status')!;visibleStatus.textContent=result.message;visibleStatus.classList.remove('error');
  } catch(error){status.textContent=error instanceof Error?error.message:'The form could not be saved. Your text is preserved; please try again.';status.classList.add('error');}
  finally{const widget=form.querySelector<HTMLElement>('.turnstile-widget');const id=widget&&widgetIds.get(widget);if(id)window.turnstile?.reset(id);button.disabled=false;if(button.textContent==='Saving…')button.textContent=original;}
});
// A changed draft gets a new id; an unchanged retry retains its id.
document.querySelectorAll<HTMLFormElement>('#rating-form,#comment-form').forEach(form=>form.addEventListener('input',()=>{form.querySelector<HTMLInputElement>('[name=requestId]')!.value=crypto.randomUUID();}));
