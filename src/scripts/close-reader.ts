const trigger=document.querySelector<HTMLButtonElement>('#close-reader');
const dialog=document.querySelector<HTMLDialogElement>('#close-dialog');
const warning=document.querySelector<HTMLElement>('#close-warning');
const fallback=document.querySelector<HTMLElement>('#close-fallback');
const ratingForm=document.querySelector<HTMLFormElement>('#rating-form');
let savedScore=ratingForm?.querySelector<HTMLInputElement>('input[name=score]:checked')?.value;
document.addEventListener('rating-saved',(event)=>{savedScore=(event as CustomEvent<string>).detail;});
function hasUnsubmittedResponses(){
  const score=ratingForm?.querySelector<HTMLInputElement>('input[name=score]:checked')?.value;
  const draft=Array.from(document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('#comment-form [name=author], #comment-form [name=body], .comment-tools [name=author], .comment-tools [name=body]')).some(field=>field.value!==field.defaultValue);
  return score!==savedScore || draft || !!document.querySelector('.reader-form button[type=submit]:disabled');
}
trigger?.addEventListener('click',()=>{
  if(!dialog || !warning || !fallback)return;
  warning.hidden=!hasUnsubmittedResponses();fallback.hidden=true;dialog.showModal();
});
document.querySelector('#keep-reading')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('close',()=>trigger?.focus());
document.querySelector('#confirm-close')?.addEventListener('click',()=>{
  window.close();
  // A successful close destroys this document. If it survives, offer manual recovery.
  window.setTimeout(()=>{if(fallback && dialog?.open)fallback.hidden=false;},350);
});
