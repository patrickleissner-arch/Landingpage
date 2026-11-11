(function(root){
  'use strict';
  function calculate(peak, target, price, years) {
    if (![peak,target,price,years].every(Number.isFinite) || peak<0 || peak>1000000 || target<0 || target>peak || price<0 || price>10000 || ![1,3,5].includes(years)) {
      throw new RangeError('Ungültige Eingaben');
    }
    const current=peak*price, limited=target*price, saving=current-limited;
    return {current,limited,saving,total:saving*years,years};
  }
  const api={calculate};
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.AgnesModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
