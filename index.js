
global.self = global; 0;  //fix annoying language difference
 //silly test: let fs2_=require("fs"); eval(fs2_.readFileSync("index.js","utf8").replace('require("fs")', 'global.fs2_'));
let /*http = require("http"), */
  https = require("https"),
  exec_ = (self.exec_=require("child_process")),
  fs = require("fs"), 
  zlib = require("zlib")
  stream=require("stream");


	//	server options, currently only ssl certpath
self.global_svr_opt=JSON.parse(fs.readFileSync("options.json","utf8"));


let { randomBytes } = require("crypto");
self.randomBytes=randomBytes;

self.Ark12_s = fs.readFileSync("algswp12.js", "utf8");
eval(Ark12_s);
//setting encryption/authorization key
//in final verson, need to compute the encrptyption array from
// the password first and store it in a file, load it when
// the server starts and fill out the decryption array using it

// Ark12(new Uint8Array(1), "P@s$w0rd"); example only;
(function access_keyLoader(){
var f_key=fs.readFileSync("_key.a12k"), //name of key file
f_sig=f_key.slice(0,6).toString("binary"),aak;
if(f_sig!="Ark12k") console.log("W A R N I N G :   key file is corrupt or incorrect, server will not work correctly and no one will be able to log in");
aak=f_key.slice(6,f_key.length);
var _P=Ark12.P;
_P.set(new Uint8Array(aak),0);
var j=4096,_rP=Ark12.rP,
_g12a4=Ark12.g12a4,_s12a4=Ark12.s12a4;
while(j--) _s12a4(_rP,_g12a4(_P,j*3)*3,j);

})(); //end of key loader


self.fak_s = fs.readFileSync("fak.js", "utf8");
eval(fak_s);



	// user session part 1
Object.assign(self, {_lgdn : {},  //session uuids of loggedin users
  _chllng : {},  //active fak challenges
  
  _create_chllng:function CreateFakChallenge(uuid,ca){
	//console.log("Set new challenge for uid "+uuid);
    //ca == set cookie array
	var fak,Lo,cc_=Object.keys(self._chllng);
    if(cc_.length>=4){ delete self._chllng[cc_[0]]; }
	fak=randomBytes(48);
	self._chllng[uuid+"_fak_"+fak.toString("base64")]=true;
    var chllng=Ark12( pFak(Ark12(new Uint8Array(fak))) );
    if(typeof ca=="object"&&ca.constructor==Array){
      ca.push("_fak="+(Buffer.from(chllng)).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/\=/g,"~")+"; SameSite=Strict; Path=/");
    }else return chllng;
  } });
	//end user session part 1


Object.assign(self, {prpr : function ParamParse(vs, isUrl) {
    //use for urls and cookies
    var eq = "=",
      a = vs.split(isUrl ? "&":";"),
    j = a.length, ro = {}, ei, cv;
    while (j--) {
      cv = a[j];
      ei = cv.indexOf(eq);
      if (ei > 0) ro[cv.substr(0, ei)] = decodeURIComponent(cv.substr(ei + 1));
    }
    return ro;
  }, //end prpr

  
  _rspnd : function Respond(sc, hed, resp, pipe /* [bool] */, nogz) {
    if (!(typeof hed == "object" && hed.constructor == Object)) hed = {};
    if ((!(pipe||nogz))&&resp.length > 1000) {
      hed["Content-Encoding"] = "gzip";
	 //need Transfer-Encoding for 206 chunked compressed sections
      if (typeof resp == "string") resp = Buffer.from(resp, "utf8");
      resp = zlib.gzipSync(resp);
    }
    this.writeHead(sc, hed);
    if(pipe){
     stream.pipeline(resp,this,err=>{ console.log(err); });
    }else{
     this.write(resp);
     this.end();
    }
  }, //end _rspnd
  

 srv_file_chunk_size:Math.pow(2,20), //2 megabytes, decrease if needed

 srv_file : function ServeFile(fpth,req_hed) {
   var rv={"rspS":"unknown error","hed":{},"mime":"application/x-octet-stream"};
   if(!fs.existsSync(fpth)){ rv.sc=404;
    rv.rspS="file "+fpth+" not found"; return rv;
   }
	
   req_hed=req_hed||{};
   var rrange=req_hed.range, fstat=fs.lstatSync(fpth),
   size=fstat.size;
   if(!fstat.isFile()){
	//directory handler
	var dirLs=[],bLs=fs.readdirSync(fpth),i=0,L=bLs.length,cst;
	if(fpth.charAt(fpth.length-1)!="/") fpth+="/";
	while(i!=L){
		cst=fs.lstatSync(fpth+bLs[i]);
		dirLs.push({"name":bLs[i],"size":cst.size,"isDir":cst.isDirectory(),/*"user":cst.uid,*/
		"atime":cst.atimeMs,"mtime":cst.mtimeMs,"ctime":cst.mtimeMs, "permissions":cst.mode}); //mode gets Object.keys(s.contstants) that begin with S_I, Read Write Xecute
		i++;
	};
	rv.rspS=JSON.stringify(dirLs);
	rv.mime="application/json";
	return rv;
   }
   if(size > srv_file_chunk_size && (!rrange) )
     rrange="0-"+srv_file_chunk_size;
   if(rrange){
    var [start,end]=rrange.replace(/bytes=/,"").split("-");
    start*=1; end*=1;
	if(isNaN(start)||isNaN(end)){ rv.sc=400; rv.rspS="400 Bad request (range url param)"; return rv; }
    rv.sc=206;
    rv.pipe=true;
    rv.rspS=fs.createReadStream(fpth,{"start":start,"end":end});
    rv.hed["Content-Range"]="bytes "+start+"-"+end+"/"+size;
    rv.hed["Content-Length"]=end-start;
    rv.hed["Accept-Ranges"]="bytes";
    //use Transfer-Encoding for gzip
   }else rv.rspS=fs.readFileSync(fpth,"utf8"); //simple version
   return rv;
 }, //end srv_file

//(if rspS variable type is stream, set pipe to true on rspnd() )
"upL_file":function Upload_File(fpth,req_hed,bod){
	var rv={"rspS":'{"error":"unknown error"}',"hed":{},"mime":"application/json","sc":200},fst;
	if((!bod)||bod.length==0){ rv.sc=400; rv.rspS='{"error":"400 Bad request, empty body"}'; return rv; }
	req_hed=req_hed||{};
	var rrange=req_hed["file-range"]||req_hed["content-range"],start=0,end,wf;
	if(rrange){
		[start,end]=rrange.replace(/bytes=/,"").split("-");
		start*=1; end*=1;
		if(isNaN(end)) end=start+bod.length;
		if(isNaN(start)|| ( (end-start)!=bod.length ) ){ rv.sc=400; rv.rspS='{"error":"400 Bad request (range param)"}'; return rv; }
	}
	//I'm not allowing creation of new folders as of now?
	try{
		wf=fs.createWriteStream(fpth,{"start":start});
		wf.end(bod); //do need? : wf.on("finish", function(){ if(!wf.destroyed) wf.destroy(); });
		rv.rspS=JSON.stringify({"success":"maybe"});
	}catch(e){ rv.sc=400; rv.rspS=JSON.stringify({"error":e}); };
	return rv;
} //end upL_file
});


Object.assign(self,{ visitor_ip:{},
ban_time:1000*600, //10 min ban time
min10:1000*600,

del_cuk:"; expires=Thu, 01 Jan 1970 00:00:00 GMT",

screensh_buf:[] }); //might need this for comparing 2 images to diff to save bandwidth, discard if using ffmpeg mp4 stream instead of images


self._MonStat=function MakeMonitorOn(){
	exec_.exec("xset -q | grep \"Monitor is \"",function(e,o,e2){
		let s_s=o.toString("binary").toLowerCase();
		if(s_s.indexOf("monitor is on")==-1) console.log("Turned Monitor on "+exec_.execSync("xset -display ${DISPLAY} dpms force on").toString("binary"));
	})&&null;
};


	//https server options

let certpath=self.global_svr_opt.certpath;
let srv_options = {
  key: fs.readFileSync(certpath+'privkey.pem'),
  cert: fs.readFileSync(certpath+'cert.pem')
};


	//	begin srv_func

self.srv_func = function Server_func(req, res) {
	var rDte=(new Date()).getTime();

    //must ban brute force attack ips

	var cra="addr_"+req.connection.remoteAddress, ccli=self.visitor_ip[cra]; //ccli = current client
	if(ccli){
		if(ccli.ban){
			res.end();
			if((rDte-ccli.lrt)>self.ban_time) delete ccli.ban;  //unban after ban time over
			console.log("blocked reqest from   "+cra);
			 return 0;
		}
	}else{
	  ccli=(visitor_ip[cra]={"reqn":0,"lrt":0,"failq":0}); //req num, last req time, sequential requests while not logged in count
	  console.log("new client connected:  "+cra);
	}
	ccli.reqn++; if(ccli.lgdn) ccli.failq=0; else ccli.failq++;
	if( ccli.failq > 7 && (!ccli.lgdn) && rDte-ccli.lrt < self.min10 ) ccli.ban=true;
	ccli.lrt=rDte;
	if(ccli.reqn>65535) ccli.reqn=0;

	if(ccli.ban){ res.end(); return 0; }

	//end brute force prevention

// rb_ is importiant now
    var rbod1 = [], rb_={},
      rspnd = self._rspnd.bind(res);
    req.on("data", function (dat) {
      rbod1.push(dat);
    });
    req.on("end", function (){
	rb_.ended=true;
	if(rbod1.length) rb_.body = Buffer.concat(rbod1);
	if(typeof rb_.onend=="function") rb_.onend();
    });
        var rqp = req.url;
        var qi = rqp.indexOf("?"),
        unq,  unp,  que="",
        rhed={},mime="text/html",sc=200,resp="nothing.", pipe=false,
	//  rhed   IS RESPONSE HEADER
        rqCuk = req.headers["cookie"]?prpr(req.headers["cookie"].substr(0,2048).replace(/\;\x20/g,";"),false):false,
        unp,
        gfak=false, create_chllng=self._create_chllng;

	if(qi==-1){ unq=rqp; }else{ unq=rqp.substr(0, qi); que=rqp.substr(qi+1); }
	unp = unq.split("/");


        //user session part 2

        var cuka=(rhed["Set-Cookie"]=[]), c_sms="; SameSite=Strict; Path=/";
      
        var c_cid, c_uuid;
        if(rqCuk.cid){
          c_cid=rqCuk.cid;
	  if(!ccli.acuk) ccli.acuk=true; //client ip has a cookie
        }else{ c_cid=rDte.toString(36)+"_"+(Math.random().toString(36).substr(2));
        cuka.push("cid="+c_cid+"; HttpOnly"+c_sms);
        }
	c_uuid="uuid_"+c_cid;
        
        if(rqCuk._rfak&&rqCuk._rfak.length>30){
          //extract and verify rfak value exists in _chllng[]
          var rf1=Ark12(new Uint8Array(Buffer.from(
	  rqCuk._rfak.replace(/\-/g,"+").replace(/_/g,"/").replace(/(\~|\%7E)/g,"="),
	  "base64")),false,true);
          
          var dfak=Buffer.from(xFak(rf1)).toString("base64"), _chllvl=c_uuid+"_fak_"+dfak;
          if( gfak=(_lgdn[c_uuid]= (_chllng[_chllvl]) ) ){
		delete _chllng[_chllvl];
		create_chllng(c_uuid,cuka); //create new when delete
	  }
	  //console.log("Challenge answered by "+c_uuid+" with "+dfak);
	  ccli.lgdn=gfak; // set client ip status to logged in if success
		cuka.push("_rfak=deleted"+c_sms+del_cuk); //delete cookie so server doesn't think client sent it again.
        }
	    //end user session part 2

      
 /*bgn*/if(unp[1]=="algswp12.js"){
          resp=Ark12_s;
          mime="text/javascript";
 /*bgn*/}else if(unp[1]=="fak.js"){
          resp=fak_s;
          mime="text/javascript";
 /*bgn*/}else if(unq=="/"|| unq.toLowerCase()=="/index.html"){
          create_chllng(c_uuid,cuka);
          resp=fs.readFileSync("index.html","utf8");
 /*bgn*/}else if(gfak&&unp[1]=="x0i"){
	  // should I switch to ydotool?  there would be no way to getdisplaygeometry?

	  self._MonStat();
	  rhed["Access-Control-Allow-Origin"]="*";
          if(unp[2]&&unp[2].length>5){	
          var ecmd=new Uint8Array( Buffer.from(unp[2].replace(/\_/g,"/").replace(/\-/g,"+").replace(/(\~|\%7E)/g,"="),"base64") ),
          cmd=Buffer.from(Ark12(ecmd,false,true)).toString("utf8");
		var cmd2="xdotool "+cmd.replace(/\;/g,"; xdotool "); console.log(cmd2)//debug
          resp=exec_.execSync(cmd2);  //should I encrypt the response?
		//may need to handle error objects to send error response
		//need DONTdoubleDown handling here server side also
          }else resp="0";
          mime="text/plain";
 /*bgn*/}else if(gfak&&unp[1]=="screen.jpeg"){
		rhed["Access-Control-Allow-Origin"]="*";

	  var scren,sbuf=screensh_buf[0];
	  if( sbuf && (rDte-sbuf.Dte)<192 ) scren=sbuf.dat;
	  else{
		self._MonStat(); //do need here?
		scren=exec_.execSync("import -window root -resize 900x600 jpeg:-");null;
		//ug! may need to go back to mouting some RAM to write image files to speed things up, standard runtime for import with pipe is 180ms
		if(!sbuf) sbuf=(screensh_buf[0]={});
		if(sbuf.dat) delete sbuf.dat;
		sbuf.Dte=rDte; sbuf.dat=scren;
	  }
          //use imagecv to compute difference? (create image thumbnails and compute their differences and blow up the difference map back to image size and mask?)
          
          //https://stackoverflow.com/questions/18510897/how-to-compare-two-images-using-node-js
          //https://www.howtoforge.com/tutorial/how-to-take-screenshots-in-linux-with-scrot/
          //https://github.com/buhman/capture/blob/master/README.md
             resp=scren; //temp?
          mime="image/jpeg";
          //end of screenshot page

 /*bgn*/}else if(unp[1]=="fig"&&gfak&&unp[2]){
		var fpth=Ark12(new Uint8Array(
		Buffer.from(unp[2].replace(/\_/g,"/").replace(/\-/g,"+").replace(/(\~|\%7E)/g,"="),"base64")
		),false,true),
		onEnd=(rb_.onend=function(){
			var que2="&"+que+"&",_fr=que2.indexOf("&range="),req_hed=req.headers,range,
			sPth=Buffer.from(fpth).toString("utf8"),	fres;
			if(_fr!=-1) range=que2.substring(_fr+7,que2.indexOf("&",_fr+7));
			if(rb_.body){ if(range) req_head["file-range"]=range;  fres=self.upL_file(sPth,req_hed,rb_.body); }
			else{ if((!req_hed.range)&&range) req_hed.range=range; fres=self.srv_file(sPth,req_hed); }
			resp=fres.rspS;  sc=fres.sc; pipe=fres.pipe; Object.assign(rhed,fres.hed); mime=fres.mime; // ||"application/x-octet-stream";
		});
		if(rb_.ended) onEnd();
		//end of file get page
 /*bgn*/}else if(unp[1]=="is_lgdn.js"){
	  var nw_chll=(prpr(que,true).nw_chll||"").toLowerCase();
	  if(nw_chll*1||nw_chll=="true"||nw_chll=="yes") create_chllng(c_uuid,cuka); //gen new challange if requested to
		rhed["Access-Control-Allow-Origin"]="*";
          resp="is_lgdn("+(( _lgdn[c_uuid] && "true")||"false")+");"; //must remain _lgdn[c_uuid] NOT gfak because sometimes _rfak has been deleted and not replenished, resulting in gfak being left to it's default value bool "false";
          mime="text/javascript";
        }
	
	rhed["Content-Type"]=mime+";charset=utf-8";
        rspnd(sc,rhed,resp,pipe);

  }; 	//	end srv_func


//server activation
if(self.svr1){
 self.svr1._events.request=srv_func;
 console.log("replaced srv_func with updated");
}else{
self.svr1=https.createServer(srv_options,srv_func);
 svr1.listen(44300);
 console.log("remote desk svr started listening on 44300");
}

	//	end srv_func activation section


