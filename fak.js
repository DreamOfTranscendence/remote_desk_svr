//cookie changer to keep login valid.

//verify authentication by decrypting _fak cookie,
//indentifying 48 byte random challange section, decrypting it,
//then re-padding it randomly with ";" as challange start marker
//and then re-encrypting it with the same key, and set it in the cookie
// _rfak

//needs algswp12.js

//_cmc=59,
var xFak=function XtraktFak(pfak){
  //pfak must be uint8Array.
  var L=pfak.length;
  for(var j=0;j!=L;j++){ if(pfak[j]==59) break; };
  j++;
  return pfak.slice(j,j+48);
}, //  xFak  end

pFak=function PadFak(fak){
  //fak must be uint8Array.
  var p=96,rL=(Math.random()*47)>>0,j=0,rbuf=0,b3=(1<<24)-1,
  rfak=new Uint8Array(p);
  while(j!=p){
    while(rbuf==0||(rbuf&59)==59) rbuf=Math.random()*b3;
    //need to include support for browsers with no "Typedarray.set" function
    if(j==rL){ rfak[j]=59; j++; rfak.set(fak,j); j+=48; }
    else{
     rfak[j]=rbuf; rbuf>>=8;
     j++;
    }
  };
  return rfak;
}; //  pFak end



if(self.document){
var str2u8a=function Str2uint8a(s){
  var a=new Uint8Array(s.length),j=0,L=s.length;
  while(j!=L){
    a[j]=s.charCodeAt(j);
    j++;
  };
  return a;
},
  
u8a2str=function Uint8a2str(a){
 var s="",L=a.length,j=0;
 while(j!=L){
   s+=String.fromCharCode(a[j]);
   j++;
 };
 return s;
},

  upd_fak="",
  chngCuk=function ChangeCookie(k){
    if(!k) Ark12.k=false; // pass boolean false as k argument to use an ecryption key that has already been set
     //get, decrypt, unpad, decrypt, re-pad, encrypt, set
      var d=self.document,dc=d.cookie+";",dcf=dc.indexOf("_fak=");
    if(dcf==-1) return false;

    var pfaks=dc.substring(dcf+5,dc.indexOf(";",dcf)).replace(/\-/g,"+").replace(/_/g,"/").replace(/\~/g,"=");
	if(upd_fak==pfaks) return "Already changed cookie";

    var pfak=Ark12(str2u8a(atob(pfaks)), k, true),

    rfak=pFak( Ark12(xFak(pfak), k,true) ),b64f;
    Ark12(rfak,k); 0;

    b64f=btoa(u8a2str(rfak)).replace(/\+/g,"-").replace(/\//g,"_").replace(/\=/g,"~");
    d.cookie="_rfak="+b64f+"; SameSite=Strict; Path=/";
	upd_fak=pfaks;
    // need?   return b64f;
  }; //end chngCuk

} //end if client side


if(!Uint8Array.prototype.set){
  Uint8Array.prototype.set=function(a,i){
    if(a.constructor!=Uint8Array) return false;
    var L2=a.length,L=this.length,j=i,j2=0;
    while(j!=L&&j2!=L2){
      this[j]=a[j2];
      j++; j2++;
    };
  };
}


