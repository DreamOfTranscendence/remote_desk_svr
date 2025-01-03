
self.Ark12=Object.assign(function a12(dat,key,dc){ //dat must be Uint8Array
 var i,j=0,dL=dat.length,dL2=dL<<1,b,c,P=a12.P,rP=a12.rP,g12a4=a12.g12a4,s12a4=a12.s12a4,d,e,f,g,h,m,n;

 if(key&&(a12.k!=key)){ i=4096; while(i--)s12a4(P,i*3,i);
  while(i<key.length){ //scramble array with key
   if(!d){d=!0;f=key.charCodeAt(i);g=key.charCodeAt((i+1)%key.length);}
   c=(((Math.cbrt(f*g)+((f^g)*(i+1))+((Math.sin((Math.PI*(f+g)/255)+j)+1)*j/7))<<0)+j)%4096;

   b=g12a4(P,h=j*3);s12a4(P,h,g12a4(P,m=c*3));s12a4(P,m,b);
   j++;if(j>=4096){j=0;i++;d=!1;}
  }
  i=4096; while(i--)s12a4(rP,g12a4(P,i*3)*3,i);
  a12.k=key;
 }

 if(dc){i=dL2;
  while(i--){
   n=g12a4(dat,i)^g12a4(dat,i+dL);s12a4(dat,i,g12a4(rP,n*3));
  }
 }else{i=0;
  while(i<dL2){
   n=g12a4(dat,i);s12a4(dat,i,g12a4(P,n*3)^g12a4(dat,i+dL));
   i++;
  }
 }
 return dat;
},{"P":new Uint8Array(6144),"rP":new Uint8Array(6144),
"g12a4":function get12BitAtIndx4(u8a,i4){ var aL=u8a.length,i8=(i4>>1)%aL,b1=u8a[i8],b2=u8a[(i8+1)%aL];
return i4&1?(((b1&15)<<8)+b2):((b1<<4)+(b2>>4)); },
"s12a4":function set12BitAtIndx4(u8a,i4,n){ var aL=u8a.length,i8=(i4>>1)%aL,Lm=(i8+1)%aL,b;
if(i4&1){ b=u8a[i8];u8a[i8]=(b&240)+(n>>8);u8a[Lm]=n&255; }else{ u8a[i8]=n>>4;b=u8a[Lm];u8a[Lm]=((n&15)<<4)+(b&15); } }
});