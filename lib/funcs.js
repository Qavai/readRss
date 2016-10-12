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
		    port_ = port || chrome.runtime.connect({name: "ei_core"});
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

funcs.html2text = function(s) {
	s = (''+s);

    s = s.replace(/<\/*wbr>/igm, '');
    s = s.replace(/>[\r\n\t]{2,}</igm, '><br><');
    s = s.replace(/&amp;/igm, '&');
    s = s.replace(/<br>/igm, "\n");
    s = s.replace(/<\/*div[^>]*>/igm, '');

    return s;
}

//<div class="feedflare">\n<a href="http://feeds.feedburner.com/~ff/SitepointFeed?a=Zr8X0Wpdvto:edlrpOjCo7A:yIl2AUoC8zA"><img src="http://feeds.feedburner.com/~ff/SitepointFeed?d=yIl2AUoC8zA" border="0"></a> <a href="http://feeds.feedburner.com/~ff/SitepointFeed?a=Zr8X0Wpdvto:edlrpOjCo7A:qj6IDK7rITs"><img src="http://feeds.feedburner.com/~ff/SitepointFeed?d=qj6IDK7rITs" border="0"></a> <a href="http://feeds.feedburner.com/~ff/SitepointFeed?a=Zr8X0Wpdvto:edlrpOjCo7A:gIN9vFwOqvQ"><img src="http://feeds.feedburner.com/~ff/SitepointFeed?i=Zr8X0Wpdvto:edlrpOjCo7A:gIN9vFwOqvQ" border="0"></a>\n</div><img src="http://feeds.feedburner.com/~r/SitepointFeed/~4/Zr8X0Wpdvto" height="1" width="1">
//<img width="1" height="1" src="http://slon.ru.feedsportal.com/c/34610/f/632866/s/2dc5a121/mf.gif" border="0"><div class="mf-viral"><table border="0"><tr><td valign="middle"><a href="http://share.feedsportal.com/viral/sendEmail.cfm?lang=ru&amp;title=10+non-f…Fslon.ru%2Frussia%2F10_non_fiction_knig_ot_borisa_kupriyanova-958033.xhtml"><img src="http://res3.feedsportal.com/images/emailthis_ru.gif" border="0"></a></td><td valign="middle"><a href="http://res.feedsportal.com/viral/bookmark_ru.cfm?title=10+non-fiction+%D0%B…Fslon.ru%2Frussia%2F10_non_fiction_knig_ot_borisa_kupriyanova-958033.xhtml"><img src="http://res3.feedsportal.com/images/bookmark_ru.gif" border="0"></a></td></tr></table></div><br><br><a href="http://da.feedsportal.com/r/165665368363/u/192/f/632866/c/34610/s/2dc5a121/a2.htm"><img src="http://da.feedsportal.com/r/165665368363/u/192/f/632866/c/34610/s/2dc5a121/a2.img" border="0"></a><img width="1" height="1" src="http://pi.feedsportal.com/r/165665368363/u/192/f/632866/c/34610/s/2dc5a121/a2t.img" border="0">
//<img width="1" height="1" src="http://slon.ru.feedsportal.com/c/34610/f/632865/s/3072626b/sc/23/mf.gif" border="0"><br clear="all"><div class="mf-viral"><table border="0"><tr><td valign="middle"><a href="http://share.feedsportal.com/viral/sendEmail.cfm?lang=ru&amp;title=%D0%98%D1%81%D1%81%D0%BB%D0%B5%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%3A+%D0%B7%D0%B0%D0%BA%D1%80%D1%8B%D1%82%D0%B8%D0%B5+%D0%BF%D0%B8%D1%80%D0%B0%D1%82%D1%81%D0%BA%D0%B8%D1%85+%D1%81%D0%B0%D0%B9%D1%82%D0%BE%D0%B2+%D1%81%D0%BD%D0%B8%D0%B6%D0%B0%D0%B5%D1%82+%D0%BA%D0%B0%D1%81%D1%81%D0%BE%D0%B2%D1%8B%D0%B5+%D1%81%D0%B1%D0%BE%D1%80%D1%8B&amp;link=http%3A%2F%2Fslon.ru%2Ffast%2Ffuture%2Fissledovanie-zakrytie-piratskikh-saytov-snizhaet-kassovye-sbory-983004.xhtml"><img src="http://res3.feedsportal.com/images/emailthis_ru.gif" border="0"></a></td><td valign="middle"><a href="http://res.feedsportal.com/viral/bookmark_ru.cfm?title=%D0%98%D1%81%D1%81%D0%BB%D0%B5%D0%B4%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%3A+%D0%B7%D0%B0%D0%BA%D1%80%D1%8B%D1%82%D0%B8%D0%B5+%D0%BF%D0%B8%D1%80%D0%B0%D1%82%D1%81%D0%BA%D0%B8%D1%85+%D1%81%D0%B0%D0%B9%D1%82%D0%BE%D0%B2+%D1%81%D0%BD%D0%B8%D0%B6%D0%B0%D0%B5%D1%82+%D0%BA%D0%B0%D1%81%D1%81%D0%BE%D0%B2%D1%8B%D0%B5+%D1%81%D0%B1%D0%BE%D1%80%D1%8B&amp;link=http%3A%2F%2Fslon.ru%2Ffast%2Ffuture%2Fissledovanie-zakrytie-piratskikh-saytov-snizhaet-kassovye-sbory-983004.xhtml"><img src="http://res3.feedsportal.com/images/bookmark_ru.gif" border="0"></a></td></tr></table>
//<img width="1" height="1" src="http://design-milk.feedsportal.com/c/34720/f/638765/s/307359a1/sc/22/mf.gif" border="0"><br clear="all"><br><br><a href="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/1/rc.htm"><img src="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/1/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/2/rc.htm"><img src="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/2/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/3/rc.htm"><img src="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/sc/22/rc/3/rc.img" border="0"></a><br><br><a href="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/a2.htm"><img src="http://da.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/a2.img" border="0"></a><img width="1" height="1" src="http://pi.feedsportal.com/r/173608272109/u/49/f/638765/c/34720/s/307359a1/a2t.img" border="0">																					//</div><br><br><a href="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/1/rc.htm"><img src="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/1/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/2/rc.htm"><img src="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/2/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/3/rc.htm"><img src="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/sc/23/rc/3/rc.img" border="0"></a><br><br><a href="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/a2.htm"><img src="http://da.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/a2.img" border="0"></a><img width="1" height="1" src="http://pi.feedsportal.com/r/173953076961/u/192/f/632865/c/34610/s/3072626b/a2t.img" border="0">
//<div class="feedflare"><a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:yIl2AUoC8zA"><img src="http://feeds.feedburner.com/~ff/my-chrome?d=yIl2AUoC8zA" border="0"></img></a> <a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:-BTjWOF_DHI"><img src="http://feeds.feedburner.com/~ff/my-chrome?i=OSkSTzFa2eg:TyLZ-Zr0Byo:-BTjWOF_DHI" border="0"></img></a> <a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:D7DqB2pKExk"><img src="http://feeds.feedburner.com/~ff/my-chrome?i=OSkSTzFa2eg:TyLZ-Zr0Byo:D7DqB2pKExk" border="0"></img></a></div><img src="http://feeds.feedburner.com/~r/my-chrome/~4/OSkSTzFa2eg" height="1" width="1"/>';
//<img width="1" height="1" src="http://weburbanist.feedsportal.com/c/34699/f/637598/s/30764834/sc/4/mf.gif" border="0"><br clear="all"><div><table border="0"><tr><td valign="middle"><a href="http://share.feedsportal.com/share/twitter/?u=http%3A%2F%2Fweburbanist.com%2F2013%2F08%2F27%2F15-year-photo-project-construction-of-a-150-year-bridge%2F%253Futm_source%253Dmediafed%2526utm_medium%253Dfeed%2526utm_campaign%253Dfeed-main%2526utm_content%253Dunknown%2526utm_term%253Dfeed-title&amp;t=15-Year+Photo+Project%3A+Construction+of+a+150-Year+Bridge"><img src="http://res3.feedsportal.com/social/twitter.png" border="0"></a>&nbsp;<a href="http://share.feedsportal.com/share/facebook/?u=http%3A%2F%2Fweburbanist.com%2F2013%2F08%2F27%2F15-year-photo-project-construction-of-a-150-year-bridge%2F%253Futm_source%253Dmediafed%2526utm_medium%253Dfeed%2526utm_campaign%253Dfeed-main%2526utm_content%253Dunknown%2526utm_term%253Dfeed-title&amp;t=15-Year+Photo+Project%3A+Construction+of+a+150-Year+Bridge"><img src="http://res3.feedsportal.com/social/facebook.png" border="0"></a>&nbsp;<a href="http://share.feedsportal.com/share/linkedin/?u=http%3A%2F%2Fweburbanist.com%2F2013%2F08%2F27%2F15-year-photo-project-construction-of-a-150-year-bridge%2F%253Futm_source%253Dmediafed%2526utm_medium%253Dfeed%2526utm_campaign%253Dfeed-main%2526utm_content%253Dunknown%2526utm_term%253Dfeed-title&amp;t=15-Year+Photo+Project%3A+Construction+of+a+150-Year+Bridge"><img src="http://res3.feedsportal.com/social/linkedin.png" border="0"></a>&nbsp;<a href="http://share.feedsportal.com/share/gplus/?u=http%3A%2F%2Fweburbanist.com%2F2013%2F08%2F27%2F15-year-photo-project-construction-of-a-150-year-bridge%2F%253Futm_source%253Dmediafed%2526utm_medium%253Dfeed%2526utm_campaign%253Dfeed-main%2526utm_content%253Dunknown%2526utm_term%253Dfeed-title&amp;t=15-Year+Photo+Project%3A+Construction+of+a+150-Year+Bridge"><img src="http://res3.feedsportal.com/social/googleplus.png" border="0"></a>&nbsp;<a href="http://share.feedsportal.com/share/email/?u=http%3A%2F%2Fweburbanist.com%2F2013%2F08%2F27%2F15-year-photo-project-construction-of-a-150-year-bridge%2F%253Futm_source%253Dmediafed%2526utm_medium%253Dfeed%2526utm_campaign%253Dfeed-main%2526utm_content%253Dunknown%2526utm_term%253Dfeed-title&amp;t=15-Year+Photo+Project%3A+Construction+of+a+150-Year+Bridge"><img src="http://res3.feedsportal.com/social/email.png" border="0"></a></td><td valign="middle"></td></tr></table></div><br><br><a href="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/1/rc.htm"><img src="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/1/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/2/rc.htm"><img src="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/2/rc.img" border="0"></a><br><a href="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/3/rc.htm"><img src="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/sc/4/rc/3/rc.img" border="0"></a><br><br><a href="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/a2.htm"><img src="http://da.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/a2.img" border="0"></a><img width="1" height="1" src="http://pi.feedsportal.com/r/173953091598/u/49/f/637598/c/34699/s/30764834/a2t.img" border="0"><img src="http://feeds.feedburner.com/~r/WebUrbanist/~4/YWELNSLQ61U" height="1" width="1">
funcs.ads_clear = function(s) {
	s = (''+s);

    s = s.replace(/<div[^>]+class="feedflare">[^<]*<a[^>]+href="[^"]+feeds\.feedburner\.com.*?<\/div>\s*<img[^>]+src="[^"]+feeds\.feedburner\.com[^"]+"[^>]*>/igm, '');
    s = s.replace(/<img[^>]+src="[^"]+feedsportal\.com[^"]+"[^>]*>.*?<div\s+class="mf-viral">.*?<table.*?<\/table>.*?<\/div>.*?<br>.*?<br>.*?<a[^>]+>.*?<img[^>]+>.*?<\/a>.*?<img[^>]+>/igm, '');

    return s;
}

funcs.html_clear = function(s) {
	s = (''+s);

	//!!! не резать внутри pre
    //s = s.replace(/>[\r\n\t]{1,}</igm, '><');

    //режем скрипты
    s = s.replace(/<script.*?<\/script>/igm, '');
    //режем стили
    s = s.replace(/<style.*?<\/style>/igm, '');
    s = s.replace(/<(link|figure)[^>]+>/igm, '');

    s = s.replace(/(<a.*?)(\s+target=".*?"\s*)(.*?>)/igm, '$1 $3');

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

funcs.textlinks2ankers = function(s, picToHref) {
    //s = s.replace(/<iframe /img, '<iframe sandbox="allow-scripts allow-same-origin" ');
    s = s.replace(/<a([^>]+)href="([^"]+)"([^>]*)>/img, '<a$1href="$2" title="$2" target="_blank" $3>');
    return s;

    /*
	if (typeof picToHref == 'undefined') picToHref = false;
	s = s+'';

	//s = text_remove_stars(s);

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
    */
}

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
