if (typeof exports != 'undefined') {
	funcs = exports;
} else {
	funcs = window;
}

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}

//-----------------
funcs.port_sendMessage = function(data, port) {
	var port_;
	if (typeof opera == 'undefined') {
		if (typeof chrome != 'undefined') {
			// Chrome
		    port_ = port || chrome.extension.connect({name: "ei_core"});
    		port_.postMessage(data, "*");
    	} else {
    	    // Firefox
		    port_ = port || addon.port;
	        port_.emit("message", data);
    	}
    } else {
    	// Opera old
		window.postMessage(data, "*");
    }
};

funcs.utf8_to_koi8r = function(str) {
    var trans_Koi8r = {"9472":128,"9474":129,"9484":130,"9488":131,"9492":132,"9496":133,"9500":134,"9508":135,"9516":136,"9524":137,"9532":138,"9600":139,"9604":140,"9608":141,"9612":142,"9616":143,"9617":144,"9618":145,"9619":146,"8992":147,"9632":148,"8729":149,"8730":150,"8776":151,"8804":152,"8805":153,"160":154,"8993":155,"176":156,"178":157,"183":158,"247":159,"9552":160,"9553":161,"9554":162,"1105":163,"9555":164,"9556":165,"9557":166,"9558":167,"9559":168,"9560":169,"9561":170,"9562":171,"9563":172,"9564":173,"9565":174,"9566":175,"9567":176,"9568":177,"9569":178,"1025":179,"9570":180,"9571":181,"9572":182,"9573":183,"9574":184,"9575":185,"9576":186,"9577":187,"9578":188,"9579":189,"9580":190,"169":191,"1102":192,"1072":193,"1073":194,"1094":195,"1076":196,"1077":197,"1092":198,"1075":199,"1093":200,"1080":201,"1081":202,"1082":203,"1083":204,"1084":205,"1085":206,"1086":207,"1087":208,"1103":209,"1088":210,"1089":211,"1090":212,"1091":213,"1078":214,"1074":215,"1100":216,"1099":217,"1079":218,"1096":219,"1101":220,"1097":221,"1095":222,"1098":223,"1070":224,"1040":225,"1041":226,"1062":227,"1044":228,"1045":229,"1060":230,"1043":231,"1061":232,"1048":233,"1049":234,"1050":235,"1051":236,"1052":237,"1053":238,"1054":239,"1055":240,"1071":241,"1056":242,"1057":243,"1058":244,"1059":245,"1046":246,"1042":247,"1068":248,"1067":249,"1047":250,"1064":251,"1069":252,"1065":253,"1063":254,"1066":255};

    var ret=[];
    for(var i=0;i<str.length;i++)
    {
        var n=str.charCodeAt(i);
        if(typeof trans_Koi8r[n]!='undefined')
            n = trans_Koi8r[n];
        if (n <= 0xFF)
            ret.push(n);
    }

    ret = String.fromCharCode.apply(null,ret)+'';
    return ret;
}

funcs.un_entity = function(ret) {
    ret = (ret+'')
            .replace(/&/igm, '&amp;');

    return ret;
}
funcs.string2array_of_number = function(s) {
	var ret = s.split(/,/);
	if (ret) {
		var i, len = ret.length;
		for (i=0; i < len; i++) {
			ret[i] = parseFloat(ret[i]);
		}
	}

    return ret;
}

funcs.getCrdsElementForVisiblePlaceOnClient = function(el, size_x, size_y, ofs_x, ofs_y) {
 var pos = el.offset();
 var doc_width = $(window).width();
 var doc_height = $(window).height();

 var x = pos.left;
 var y = pos.top;
 x += ofs_x; y += ofs_y;

 var xo = x, yo = y;

 if (y+size_y > doc_height) y = doc_height-size_y-5;
 if (x+size_x > doc_width) x = doc_width-size_x-10;

 return ({"x":x, "y":y, "xo":xo, "yo":yo});
}

// сейчас там
// 13 мин. назад
// 4 ч. назад
// 2 дн. назад
// 3 нед. назад
// 3 мес. назад
// 1 год. назад
//
funcs.time2date_day = function(time, limitCount) {
	limitCount = limitCount || 1;

    var cur = new Date();
    var ref_time = (Math.round(cur.getTime()/1000)-time); //секунды

    if (ref_time < 60) {
        return 'сейчас там';
    }

    var t = [], i, period;

   	period = (60*60*24*365);
    if (ref_time > period) {
    	i = Math.round(ref_time/period);
    	if (i) {
    	    t.push(i+' год.');
        }
       	ref_time = ref_time % period;
	}

	period = (60*60*24*30);
    if (ref_time > period && t.length < limitCount) {
    	i = Math.round(ref_time/period);
    	if (i) {
	        t.push(i+' мес.');
        }
    	ref_time = ref_time % period;
    }

	period = (60*60*24*7);
    if (ref_time > period && t.length < limitCount) {
    	i = Math.round(ref_time/period);
    	if (i) {
	        t.push(i+' нед.');
        }
    	ref_time = ref_time % period;
    }

	period = (60*60*24);
    if (ref_time > period && t.length < limitCount) {
    	i = Math.round(ref_time/period);
    	if (i) {
        	t.push(i+' дн.');
        }
    	ref_time = ref_time % period;
    }

	period = (60*60);
    if (ref_time > period && t.length < limitCount) {
    	i = Math.round(ref_time/period);
    	if (i) {
	        t.push(i+' ч.');
        }
    	ref_time = ref_time % period;
    }

	period = (60);
    if (ref_time > period && t.length < limitCount) {
    	i = Math.round(ref_time/period);
    	if (i) {
	        t.push(i+' мин.');
        }
    	ref_time = ref_time % period;
    }

    return t.join(' ')+' назад';
}

funcs.get_el_by_field = function(arr, f, v) {
    for (var i=0, m = arr.length; i < m; i++) if (typeof arr[i] != 'undefined' && arr[i][f] == v) return i;return -1;
}

funcs.getCaretPosition = function(ctrl) {
	var CaretPos = 0;
	// IE Support
	if (document.selection) {

		ctrl.focus ();
		var Sel = document.selection.createRange ();

		Sel.moveStart ('character', -ctrl.value.length);

		CaretPos = Sel.text.length;
	}
	// Firefox support
	else if (ctrl.selectionStart || ctrl.selectionStart == '0')
		CaretPos = ctrl.selectionStart;
	return (CaretPos);
}

funcs.setCaretPosition = function(ctrl, pos) {

	if(ctrl.setSelectionRange)
	{
		ctrl.focus();
		ctrl.setSelectionRange(pos,pos);
	}
	else if (ctrl.createTextRange) {
		var range = ctrl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}

funcs.get_el_by_fields = function(arr, fv) {
    var j, k, l;
    for (var i=0, m = arr.length; i < m; i++)
    {
     if (typeof arr[i] != 'undefined')
     {
      k=0, l=0;
      for (j in fv) if (fv.hasOwnProperty(j))
      {
       l++;
       if (typeof arr[i][j] != 'undefined')
       {
        if (arr[i][j] == fv[j]) k++;
       }
      }
      if (l > 0 && k == l) return i;
     }
    }
    return -1;
}

funcs.get_els_by_field = function(arr, f, v) {
        var els = [];
        for (var i=0, m = arr.length; i < m; i++)
        {
         if (arr[i][f] == v)
         {
          els.push(i);
         }
        }
        return els;
}

//---------
funcs.date2time = function(date, timeBase, year) {
	year = year || false;

    var month2number = {'янв':1, 'фев':2, 'мар':3, 'апр':4, 'май':5, 'июн':6, 'июл':7, 'авг':8, 'сен':9, 'окт':10, 'ноя':11, 'дек':12,
                        'январь':1, 'февраль':2, 'март':3, 'апрель':4, 'май':5, 'июнь':6, 'июль':7, 'август':8, 'сентябрь':9, 'октябрь':10, 'ноябрь':11, 'декабрь':12
    }

    var cur = (!timeBase) ? new Date() : new Date(timeBase*1000);
    var yesterday = new Date((Math.round(cur.getTime()/1000)-(1*24*60*60))*1000);

    var mm;

    date = ''+date;

    date = date.replace(/сегодня/i, cur.getDate()+'.'+(cur.getMonth()+1)+'.'+cur.getFullYear());
    date = date.replace(/вчера/i, yesterday.getDate()+'.'+(yesterday.getMonth()+1)+'.'+yesterday.getFullYear());

    if (/^\d+\s.*?\.*\s\d+:\d/i.test(date)) {
        mm = date.match(/^(\d+)\s(.*?)\.*\s+(.*)/i);
        if (mm) {
            var day = mm[1];
            var month = month2number[(mm[2]+'').toLowerCase()];
            if (typeof month != 'undefined') {
            	if (!year) {
            		year = cur.getFullYear();
            	}
                //! год не сделал, пока не нужно, будем считать, что год текущий (!! проверить в январе)
                date = day+'.'+month+'.'+year+' '+mm[3];
            }
        }
    }

    var t = cur;

    var mm = date.match(/0*(\d+)\.0*(\d+)\.0*(\d+) 0*(\d+):0*(\d+)/i);
    if (mm) {
        t = new Date(mm[3], mm[2]-1, mm[1], mm[4], mm[5], 0, 0);
    }
    mm = null;

    cur = null;
    yesterday = null;

    return Math.round(t.getTime()/1000);
}

// 2011-06-18 13:32:42
funcs.date2time_full = function(date) {
	var t = 0;

	if (!date) date = '';
    var mm = (date+'').match(/0*(\d+)-0*(\d+)-0*(\d+) 0*(\d+):0*(\d+):0*(\d+)/i);
    if (mm) {
        t = Math.round((new Date(date)).getTime()/1000)
    }
    mm = null;

    return t;
}

// сейчас там
// скрыто
// 13 мин. назад
// 4 ч. назад
// 2 дн. назад
// больше 2 мес. назад
// больше 3 месяцев назад
//
funcs.ref_date2time = function(date, timeBase) {

    var date_element2number = {'мин.': 1, 'ч.': 60, 'дн.': 24*60
    }

    var cur = (!timeBase) ? new Date() : new Date(timeBase*1000);
    var time4month = new Date((Math.round(cur.getTime()/1000)-(120*24*60*60))*1000);

    var mm;

    date = ''+date;

    if (date.match(/сейчас там/i)) {
        return Math.round(cur.getTime()/1000);
    }

    if (date.match(/скрыто/i)) {
        return Math.round(time4month.getTime()/1000);
    }

    if (/больше/i.test(date)) {
        mm = date.match(/больше\s+(\d+)\s+.*/i);
        if (mm) {
            var month = parseInt(mm[1]);
            month = new Date((Math.round(cur.getTime()/1000)-(month*30*24*60*60))*1000);
            return Math.round(month.getTime()/1000);
        }
    }

    if (/назад/i.test(date)) {
        mm = date.match(/(\d+)\s+(.*?)\s+.*/i);
        if (mm) {

            var dateRefNum = parseInt(mm[1]);
            var dateRef = date_element2number[(mm[2]+'').toLowerCase()];
            if (typeof dateRef != 'undefined') {
                dateRef = new Date((Math.round(cur.getTime()/1000)-(dateRef*dateRefNum*60))*1000);
                return Math.round(dateRef.getTime()/1000);
            }
        }
    }

    return Math.round(cur.getTime()/1000);
}
/*
	"ab" 	: ":)",
	"ag" 	: ":-D",
	"ao" 	: ":ao:",
	"bn" 	: ":dn:",
	"ac" 	: ":-(",
	"ae" 	: ":-P",
	"az" 	: ":beer:",
	"ax" 	: ":ax:",
	"aw" 	: ":kiss:",
	"aq" 	: ":aq:",
	"ad" 	: ":ad:"
*/

var nn_ru_smiles2code = {
	"ab" 	: "!~1~!",
	"ag" 	: "!~2~!",
	"ao" 	: "!~3~!",
	"bn" 	: "!~4~!",
	"ac" 	: "!~5~!",
	"ae" 	: "!~6~!",
	"az" 	: "!~7~!",
	"ax" 	: "!~8~!",
	"aw" 	: "!~9~!",
	"aq" 	: "!~A~!",
	"ad" 	: "!~B~!"
};

var nn_ru_smiles2img = {
	"!~1~!" : '<img src="../images/smile/ab.gif" width="20" height="24" />',
	"!~2~!" : '<img src="../images/smile/ag.gif" width="20" height="20" />',
	"!~3~!" : '<img src="../images/smile/ao.gif" width="28" height="28" />',
	"!~4~!" : '<img src="../images/smile/bn.gif" width="32" height="20" />',
	"!~5~!" : '<img src="../images/smile/ac.gif" width="20" height="24" />',
	"!~6~!" : '<img src="../images/smile/ae.gif" width="18" height="18" />',
	"!~7~!" : '<img src="../images/smile/az.gif" width="51" height="28" />',
	"!~8~!" : '<img src="../images/smile/ax.gif" width="30" height="26" />',
	"!~9~!" : '<img src="../images/smile/aw.gif" width="47" height="24" />',
	"!~A~!" : '<img src="../images/smile/aq.gif" width="39" height="24" />',
	"!~B~!" : '<img src="../images/smile/ad.gif" width="20" height="20" />'
};

var nn_ru_img_re = /<img\s+src="http:\/\/\w+\.nn\.ru\/img\/smilies\/(\w+)\.gif"[^>]+>/im;

funcs.html2text = function(s) {
	s = (''+s);

    s = s.replace(/<\/*wbr>/igm, '');
    s = s.replace(/>[\r\n\t]{2,}</igm, '><br><');
	s = nn_ru_links_replaces(s);
    s = s.replace(/&amp;/igm, '&');
    s = s.replace(/<div class="privat-letter-one-user">(.*?)<\/div>/igm, '<login>$1</login><br>');
    s = s.replace(/<div class="privat-letter-one-date">(.*?)<\/div>/igm, '<br><i>$1</i> ');
    s = s.replace(/(<div class="[^"]+">)/igm, "<br>$1");
    s = s.replace(/<br>/igm, "\n");
    s = s.replace(/<\/*div[^>]*>/igm, '');
    s = s.replace(/<font color="red">(.*?)<\/font>/igm, '<red>$1</red>');
    s = s.replace(/<font color="green">(.*?)<\/font>/igm, '<green>$1</green>');
    s = s.replace(/<font color="blue">(.*?)<\/font>/igm, '<blue>$1</blue>');

    return s;
}

funcs.nn_ru_links_replaces = function(s) {
	s = (''+s);
    //mprint(s);

    //режем скрипты
    s = s.replace(/<script.*?<\/script>/igm, '');
    //режем стили
    s = s.replace(/<style.*?<\/style>/igm, '');
    s = s.replace(/<link.*?>/igm, '');

    s = s.replace(/((?:href|src)=")(?!https*:\/\/|mailto:)(.*?)(")/igm, '$1http://www.nn.ru$2$3');
    s = s.replace(/(<a.*?)(\s+target=".*?"\s*)(.*?>)/igm, '$1 $3');

    s = s.replace(/(<a.*?)href="http:\/\/.*?\.nn\.ru\/redirect\.php\?redir=(.*?)"(.*?>.*?<\/a>)/igm, '$1href="$2"$3')
         .replace(/(<a.*?)href="http:\/\/.*?\.nn\.ru\/redirect\.php\?(.*?)"(.*?>.*?<\/a>)/igm, '$1href="$2"$3');


    s = s.replace(/<a[^>]+href="(http:\/\/www\.nn\.ru\/.gallery\d+\?MFID=\d+(&IID=\d+)*)"[^>]*?>Перейти\s+в\s+галерею<\/a>/igm, '$1')
    s = s.replace(/<br>\s*<div\s+url="[^"]+"\s+class="[^"]+"\s+load="true"[^>]*?>([^<]+)(<\/div>|$)/igm, '')

    //цитаты
    // <table width="90%" class="forumQuote"><tr><td><img class="quote" src="http://www.nn.ru/img/forum/quote.gif"></td><td class="TextArchive" width="100%">Qavai писал(а) <br />Эта та, котора
    s = s.replace(/<table[^>]+class="forumQuote">\s*<tr>\s*<td>\s*<img\s+class="quote"[^>]+>\s*<\/td>\s*<td\s+class="TextArchive"[^>]+>(.*?)\s+писал\(а\)\s+<br\s+\/>(.*?)(<br[^>]+>)*\s*<\/td>\s*<\/tr>\s*<\/table>/igm, '<blockquote><b>$1</b><em>$2</em></blockquote>')
    s = s.replace(/<table[^>]+class="forumQuote">\s*<tr>\s*<td>\s*<img\s+class="quote"[^>]+>\s*<\/td>\s*<td\s+class="TextArchive"[^>]+>(.*?)<\/td>\s*<\/tr>\s*<\/table>/igm, '<blockquote><em>$1</em></blockquote>')

	//<a href="http://dl.dropbox.com/u/5690502/2009/18.09.2009.gif">http://dl.dropbox.com/u/5690502/2009/...</a>
	//заменяем все укороченные ссылки (и обычные) на просто текст
    s = s.replace(/<a\s+href="([^"]+)"[^>]*?>[^<]+<\/a>/igm, '$1');

    //фиксим возможный баг в пути
    //media.nn.ru//data/ufiles/
    s = s.replace(/\.nn\.ru\/\/data\/ufiles\//igm, '.nn.ru/data/ufiles/');

    s = s.replace(/(<a.*?href=")(?=https*:\/\/|mailto:)(.*?")(.*?>)/igm, '$1$2 target="_blank"$3');

    //заменяю картинки-смайлики на текст
    //<img src="http://www.nn.ru/img/smilies/ab.gif" width=20 height=24>
    s = s.replace(nn_ru_img_re, function(m) {
        m = m.match(nn_ru_img_re);
    	return nn_ru_smiles2code[m[1]];
    });

    return s;
}

var textlinks2ankers_email_true_re = '(?:[a-z0-9_\\.-]+@)(?:(?:https?|ftp)://)?(?:[\\da-z][\\-\\da-z\\.]*[\\da-z]*\\.)+[a-z]{2,6}(?::\\d{1,5})?(?:/[?!$.():=\'+\\-;&~#@,%*\\wА-Яа-я]+)*/?';
var textlinks2ankers_email_true_re_c = new RegExp(textlinks2ankers_email_true_re, 'igm');
var textlinks2ankers_email_re = '(?:[a-z0-9_\\.-]+@)?(?:(?:https?|ftp)://)?(?:[\\da-z][\\-\\da-z\\.]*[\\da-z]*\\.)+[a-z]{2,6}(?::\\d{1,5})?(?:/[?!$.():=\'+\\-;&~#@,%*\\wА-Яа-я]+)*/?';
var textlinks2ankers_email_re_c = new RegExp(textlinks2ankers_email_re, 'igm');
var textlinks2ankers_re = '(?:(?:https?|ftp)://)?(?:[\\da-z][\\-\\da-z\\.]*[\\da-z]*\\.)+[a-z]{2,6}(?::\\d{1,5})?(?:/[?!$.():=\'+\\-;&~#@,%*\\wА-Яа-я]+)*/?';
var textlinks2ankers_re_c = new RegExp(textlinks2ankers_re, 'igm');
var img_src_split = /src="http:\/\//im;
var a_href_split = /href="http:\/\//im;

var imgcode2img_re = /!~.~!/im;

funcs.textlinks_set_blank = function(s) {
    s = s.replace(/(<a.*?)(href=)(.*?)(>|\s)(.*?>)/igm, '$1$2"$3" target="_blank"$4$5');
    s = s.replace(/(<a.*?)(href=)"(.*?)"(.*?>)/igm, '$1$2"$3" target="_blank" $4');
    return s;
}

var text_remove_stars = function(s) {
	s = s+'';

	s = s.replace(/([a-zA-Zа-яА-Я]+)(\*|\^)+([a-zA-Zа-яА-Я]+)/mig, '$1$3');
	s = s.replace(/([a-zA-Zа-яА-Я]+)\*+([a-zA-Zа-яА-Я]+)/mig, '$1$2');
	s = s.replace(/([a-zA-Zа-яА-Я]+)\*+([a-zA-Zа-яА-Я]+)/mig, '$1$2');
	return s;
}

funcs.text_remove_stars = text_remove_stars;

funcs.textlinks2ankers = function(s, picToHref) {
	if (typeof picToHref == 'undefined') picToHref = false;
	s = s+'';

	s = text_remove_stars(s);

	var t = s.split(img_src_split);
	var ta = s.split(a_href_split);
	var i, r, len = t.length, l;
	if (t && len > 1 && !picToHref) {

		r = [];
		r.push(textlinks2ankers(t[0], picToHref));
		for (i=1; i < len; i++) {
			l = t[i].indexOf('"');
			r.push('src="http://');
			r.push(t[i].substr(0, l+1));
			r.push(textlinks2ankers(t[i].substr(l+1), picToHref));
		}
		s = r.join('');

	} else if (ta && ta.length > 1 && !picToHref) {

		len = ta.length;
		r = [];
		r.push(textlinks2ankers(ta[0], picToHref));
		for (i=1; i < len; i++) {
			l = ta[i].indexOf('"');
			r.push('href="http://');
			r.push(ta[i].substr(0, l+1));
			r.push(textlinks2ankers(ta[i].substr(l+1), picToHref));
		}
		s = r.join('');

	} else {
		if (picToHref) {
			s = s.replace(/<img[^>]+src="([^"]+)"[^>]*>/igm, '$1 ');
		}

        s = s.replace(textlinks2ankers_email_re_c, function(l) {
        	var lcut = l.replace(/https*:\/\//i, '//');

        	lcut = lcut.replace(/www.nn.ru\/community/i, 'форум');
        	lcut = lcut.replace(/auto.nn.ru\/forum/i, 'авто');
        	lcut = lcut.replace(/www.nn.ru\/user\.php?/i, 'юзер');

            var cutLen = 25;
            if (lcut.length > cutLen*2) {
           		lcut = lcut.substr(0, cutLen)+'<wbr>...<wbr>'+lcut.substr(-cutLen);
           	}
           	if (!(l.substr(0, 7) == 'http://' || l.substr(0, 8) == 'https://' || l.substr(0, 6) == 'ftp://')) {
           		if (textlinks2ankers_email_true_re_c.test(l)) {
	           		l = 'mailto:'+l;
	           	} else {
	           		l = 'http://'+l;
	           	}
           	}
            return '<a href="'+l+'" title="'+l+'" target="_blank">'+lcut+'</a>';
        });

        s = s.replace(imgcode2img_re, function(m) {
        	return nn_ru_smiles2img[m];
        });
	}

    return s;
}

funcs.fancyInit = function(root) {
    $("a[href^='http://www.youtube.com']:not(.lightbox-iframe)", root).each(
    	function(index, item) {

    		var i, j, is_v;
    		var h = item.href;
    		h = h.replace(/\?/i, '&');
    		var hm = h.split(/&/i);
    		if (hm && hm.length) {
    			var params = [];

    			for (i=1; i < hm.length; i++) {
    				j = hm[i].split(/=/i);

    				is_v = false;

    				if (j.length == 2) {
    					if (j[0] == 'feature') {
    						j[1] = 'player_embedded';
    					}

    					if (j[0] == 'v') {
    						is_v = true;
							hm[i] = j.join('/');
    					} else {
							hm[i] = j.join('=');
    					}

    				}
    				if (!is_v) {
	    				params.push(hm[i]);
	    			} else {
	    				params.unshift(hm[i]);
	    			}
    			}
    			h = 'http://www.youtube.com/'+params.join('&');
    		}

    		item.href = h;

    		$(item).addClass('lightbox-iframe');
    	}
    );

    $('a:not(.item-one-link)', root)
    	.unbind('click').bind('click', function(event) {
            var el = $(this);

            if (event.ctrlKey) return true;

            var t = (this.href+'');

            var images = [];
           	var startIndex = 0;

            if (el.hasClass('lightbox-iframe')) {
              	images.push({
               		"href" : this.href,
               		"title" : this.title
              	});

            	$.fancybox(images, {
            		'width'				: '95%',
            		'height'			: '95%',
                	'autoScale'			: false,
                	'transitionIn'		: 'none',
                	'transitionOut'		: 'none',
               		"titleShow"			: false,
                	'type'				: 'iframe',
                	'showNavArrows'		: false,
            		'titleFormat'       : function(title, currentArray, currentIndex, currentOpts) {
            		    return '<span id="fancybox-title-over">' + title + '</span>';
            		}
            	});

            	return false;
            }

            if (!t.match(/^.*\.(jpeg|jpg|gif|png)$/i)) return true;

           	images.push({
            		"href" : this.href,
            		"title" : this.title
           	});

        	$.fancybox(images, {
        		'width'				: '95%',
        		'height'			: '95%',
        		'autoScale'			: true,
        		'transitionIn'		: 'none',
        		'transitionOut'		: 'none',
        		'showNavArrows'		: true,
        		'titlePosition' 	: 'inside',
        		"titleShow"			: false,
        		'index' 			: startIndex,
        		'titleFormat'       : function(title, currentArray, currentIndex, currentOpts) {
        		    return '<span id="fancybox-title-over">' + title + '</span>';
        		}
        	});

        	return false;
    	});
}
//---------
//var ua = navigator.userAgent.toLowerCase();
//funcs.isOpera = (ua.indexOf('opera')>-1);
//funcs.isSafari=(ua.indexOf('safari')>-1);

//===========================================
var Dump = function(d, l, t) {
   if (typeof(t) == "undefined") t = "\n";

   var space = (t == "\n")?' ':'&nbsp;';

   if (l == null) l = 1;
   var s = '';

   if (typeof(d) == "object") {
        s += typeof(d) + space+"{"+t;
        for (var k in d) {
            if (typeof(d[k]) != "function"){
             for (var i=0; i<l; i++) s += space+space;
             s += k+":"+space + Dump(d[k],l+1, t);
            }
        }
        for (var i=0; i<l-1; i++) s += space+space;
        s += "}"+t;
    } else if (typeof(d) != "function"){
        s += "" + d + t;
    } else if (typeof(d) == "function"){
        s += "" + d.toString() + t;
    }
    return s;
}

funcs.mprint = function(s) {
    console.log(Dump(s, 1));
}

    //---------------
funcs.getAjaxUrl = function(params) {
    params = params || false;

    var baseHref = 'http://www.nn.ru/ajax.php';
    var xmlTime = (new Date).getTime()+(Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000)+'-xml';

    if (!params) {
        return baseHref+'?'+xmlTime;
    } else {
        return baseHref+'?'+params+'&'+xmlTime;
    }
}

funcs.nl2br = function(s) {
    s = (''+s).replace(/\r\n/igm, '\r');
    s = s.replace(/\n/igm, '\r');
    return s.replace(/\r/igm, '<br />');
}

//!!! убрать дубляж
funcs.date_format_simply  = function(time) {
        var d = new Date(time*1000);

        var day = d.getDate();
        if (day < 10) day = '0'+day;

        var month = d.getMonth()+1;
        if (month < 10) month = '0'+month;

        var hours = d.getHours();
        if (hours < 10) hours = '0'+hours;

        var minutes = d.getMinutes();
        if (minutes < 10) minutes = '0'+minutes;

        var df = day+'.'+month+'.'+d.getFullYear()+' '+hours+':'+minutes;

        d = null;

        return df;
}

//-===-=-=-=-
 var translit_rus = 'абвгдезиклмнопрстуфцыАБВГДЕЗИКЛМНОПРСТУФЦЫ';
 var translit_eng = 'abvgdeziklmnoprstufcyABVGDEZIKLMNOPRSTUFCY';
 var translit_ruseng = ([{"\u0439":"j","\u0451":"jo","\u0436":"zh","\u0445":"kh","\u0447":"ch","\u0448":"sh","\u0449":"shh","\u044d":"je","\u044e":"ju","\u044f":"ja","\u044a":"","\u044c":"","\u0419":"J","\u0401":"JO","\u0416":"ZH","\u0425":"KH","\u0427":"CH","\u0428":"SH","\u0429":"SHH","\u042d":"JE","\u042e":"JU","\u042f":"JA","\u042a":"","\u042c":""}])[0];

function str_translit(s, t) {
 var out_s, out_s_;
 var t_from = (t == 'rus2eng')?translit_rus:translit_eng;
 var t_to = (t != 'rus2eng')?translit_rus:translit_eng;
 var tre = translit_ruseng;

 if (t == 'rus2eng')
 {
  t_from += translit_eng;
  t_to += translit_eng;
 }

 var out = [];
 var j;
 for (var i=0; i < s.length; i++)
 {
  out_s = s.charAt(i);

  if (s.charAt(i) == ' ')
   out_s = '-';
  else
  {
   j = t_from.indexOf(s.charAt(i));
   if (j == -1)
   {
    out_s_ = false;
    for (k in tre)
    {
     if (k == s.charAt(i))
     {
      out_s_ = tre[k];
      break;
     }
    }
    if (out_s_ === false)
     out_s = s.charAt(i);
    else
     out_s = out_s_;
   }
   else
    out_s = t_to.charAt(j);
  }

  out.push(out_s.toLowerCase());
 }
 return out.join('');
}

funcs.generateEngUrl = function(str) {
    str = ''+str;

    str = str_translit(str, 'rus2eng');
    str = str.replace(/&amp;/ig, '-');
    str = str.replace(/[&\'\s\n\r]/ig, '-');
    str = str.replace(/[^a-z-0-9]/ig, '');
    str = str.replace(/-+/ig, '-');
    return str;
}


funcs.array_set_undef = function(len) {
	var arr = [];
	if (len) {
        while (--len >= 0) {
        	arr[len] = undefined;
        }
	}

	return arr;
}
