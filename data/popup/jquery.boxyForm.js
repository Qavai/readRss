jQuery.fn.boxyForm = function(options) {
    options = options || {};
    options['successDefault'] = function(data) {

       if (isset(data['actionClose']) && data['actionClose'] && (window.BOXYFORM['HISTORY'] && window.BOXYFORM['HISTORY'].length < 2))
       {
        window.BOXYFORM['HISTORY'].pop();
        window.BOXYFORM['HISTORY_CURRENT']--;
        this.hideAndUnload();
       }
       else
       {

        if (isset(data['location']) && data['location'])
        {
         if (isset(data['ajaxLocation']) && data['ajaxLocation']) {
            $('<a class="dn">go</a>').attr('href', data['ajaxLocation']).appendTo('body').boxyForm({useCache:options.useCache}).trigger('click');
            return false;
         }
         else {
            window.location.href = data['location'];
         }
        }
        else
        {
         if (data['html'])
         {
          this.setContent('<div>'+data['html']+'<div>');
         }

         if (data['html_'])
         {
          this.setContent($(data['html_'].replace(/&lt;/ig, '<').replace(/&gt;/ig, '>')));
         }

        }

       }

    }
    options['errorDefault'] = function(data) {
        if (data['html'])
        {
         this.setContent('<div>'+data['html']+'<div>');
        }

        if (data['html_'])
        {
         var tableOld = $('#cropPicture').parents('form').find('table');
         var table = $(data['html_'].replace(/&lt;/ig, '<').replace(/&gt;/ig, '>'));
         tableOld.replaceWith(table.find('table'));
         bansEditInit();
        }

    }

    options = $.extend({useCache:true}, options);

    return this.each(function() {
        var node = this.nodeName.toLowerCase(), self = this;
        if (node == 'a') {
            jQuery(this).click(function() {
                    var href = this.getAttribute('href');

                    var behaviours = function() {
                              var boxy = this;
                              var content = boxy.getContent();

                              var rootEl = $('.boxy-content');
                              if (!rootEl.length) return false;

                              var bbEls = $('.boxyButton', rootEl);
                              if (bbEls.length) {
                                bbEls.boxyForm();
                              }

                              var bbElsnc = $('.boxyButtonNoCache', rootEl);
                              if (bbElsnc.length) {
                                bbElsnc.boxyForm({ useCache:false });
                              }

                              $('.boxyButton_editLink').boxyForm({ 'ready':function() {
                                editLink_boxyInit();
                              } });


                              $('.boxyButtonConfirm', rootEl).confirmButton({'success': function(data) {
                                     if (isset(data['location']) && data['location']) {
                                         if (isset(data['ajaxLocation']) && data['ajaxLocation']) {
								            $('<a class="dn">go</a>').attr('href', data['ajaxLocation']).appendTo('body').boxyForm({useCache:options.useCache}).trigger('click');
                                            return false;
                                         }
                                         else {
                                            window.location.href = data['location'];
                                         }
                                     }
                               }
                              });

                              $('.boxyButtonEditValue', rootEl).each(function(index, item) {
                             	$(item)
                                  .boxyForm({
                                  	"useCache"	: false,
                                  	"innerUse"	: 1,
                                  	"success"	: function(data) {
                                         if (isset(data['editedVal']) && isset(data['edited']) && data['edited']) {
                                             if (isset(data['location']) && data['location']) {
                                                 if (isset(data['ajaxLocation']) && data['ajaxLocation']) {
        								            $('<a class="dn">go</a>').attr('href', data['ajaxLocation']).appendTo('body').boxyForm({useCache:options.useCache}).trigger('click');
                                                    return false;
                                                 }
                                                 else {
                                                    window.location.href = data['location'];
                                                 }
                                             }
                                         }
                                   	}
                                  });
                              });


                              $('input[name=cancel]').click(function() {
                                boxy.hide();
                                return false;
                              });

                              if (tinyMCE)
                              {
                               tinyMCE.init(tinyMCE_init_object);
                              }
                              boxy.center();
                              window.window_resize();

                              var ifsEls = $('input[name=picture]:file', rootEl);
                              var ifsEls2 = $('input[name=file]:file', rootEl);
                              if (ifsEls.length || ifsEls2.length) {
                                  inputFileStyling(boxy);
                              }

                              Imgs_jcarousel_init();

                              Imgs_order_change_init();

                              metaButton_boxyInit();

                              tagsActions_init();

                              toggleInit();

                              cropInit();

                              $('.boxyButton_bubble').boxyForm({ 'useCache':false,
                                                                 'ready':function() {
                                                                             bubbleEdit_init();
                                                                         }
                                                            });


                              //------------- calendar -----------
                              var date = new Date();

                              var sdb = $('.calendar');
                              if (sdb.length)
                              {
                               sdb.calendar({dateFormat:'YMD-', timeSeparators:[], minDate:new Date(date.getFullYear()-10, date.getMonth(), date.getDate()), maxDate:new Date(date.getFullYear()+10, date.getMonth(), date.getDate()) });
                              }
                              //--------------------

                              var hrefCurrent = boxy['hrefCurrent'];
                              if (isset(hrefCurrent) && isset(window.BOXYFORM['READY'][hrefCurrent]))
                              {
                               if (!content.html().match(/wait\.gif/i))
                               {
                                boxy.center();
                                window.BOXYFORM['READY'][hrefCurrent].call(boxy);
                               }
                              }

                              var form = $(content).find('form:first');

                              form.ajaxForm({
                               success: function(data) {
                                if (!data['errors'].length)
                                {
                                 options['successDefault'].call(boxy, data);
                                 if (isset(options['success']))
                                 {
                                  options['success'].call(boxy, data);
                                 }
                                }
                                else
                                {
                                 options['errorDefault'].call(boxy, data);
                                 if (isset(options['error']))
                                 {
                                  options['error'].call(boxy, data);
                                 }
                                }
                               },
                               error: function(data) {
                                 options['errorDefault'].call(boxy, data);
                                 if (isset(options['error']))
                                 {
                                  options['error'].call(boxy, data);
                                 }
                               }
                              })
                              .append('<input type="hidden" value="1" name="ajax" />')
                              .append('<input type="hidden" value="1" name="needHtml" />')
                              .append('<input type="hidden" value="'+window.location.href+'" name="referer" />');
                             };

                    if (!isset(window.BOXYFORM)) window.BOXYFORM = {};

                    var isPages = href.match(/\/pages\//i);

                    var sizes = (!isPages) ? '' : ' width:'+($(window).width()-300)+'px; height:'+($(window).height()-150)+'px; ';

                    var boxy = window.BOXYFORM['GLOBAL'] = window.BOXYFORM['GLOBAL'] ||
                                                           new Boxy('<div style="'+sizes+'text-align:center;"><img src="/images/admin/wait.gif" /></div>',
                                                                     { behaviours : behaviours,
                                                                       title:'загружаю, подождите...',
                                                                       closeText:'закрыть',
                                                                       draggable:false,
                                                                       modal:true,
                                                                       unloadOnHide:true,
                                                                       beforeUnload: function() { window.BOXYFORM['GLOBAL'] = null; },
                                                                       HistoryBack: function() {
                                                                        var c = window.BOXYFORM['HISTORY_CURRENT'];
                                                                        var l = window.BOXYFORM['HISTORY'];
                                                                        if (c > 0 && l.length > 1) {
                                                                            c--;
                                                                            window.BOXYFORM['HISTORY_CURRENT'] = c;

                                                                            var href = window.BOXYFORM['HISTORY'][c];

                                                                            ankerSuccess(window.BOXYFORM['CACHE'][href], true);
                                                                        }

                                                                       }
                                                                      });

                    if (isPages) {
                        $('.boxy-wrapper').css({width: $(window).width()-250, height: $(window).height()-100});
                    }

                    var anker = this;
                    var ankerSuccess = function(data, noTouchHistory) {
                        noTouchHistory = noTouchHistory || false;

                        if ( !isset(data)) {
                             $.ajax({dataType:'json',
                                     type: 'get',
                                     url: href,
                                     data: {'ajax':1, 'referer':window.location.href, 'needHtml':1},
                                     success: function(data) {
                                       if (options['useCache']){
                                            window.BOXYFORM['CACHE'][href] = data;
                                       }
                                       ankerSuccess(data, noTouchHistory);
                                     }
                             });
                        } else {
                            boxy['hrefCurrent'] = href;

                            if (1||!noTouchHistory) {
                                window.BOXYFORM['HISTORY'].push(href);
                                window.BOXYFORM['HISTORY_CURRENT']++;
                            }

                            boxy.setTitle(data['page']['title']);

                            boxy.setContent('<div>'+data['html']+'<div>');

                            $('.boxy-wrapper').css({height: 'auto'});
                        }
                    }

                    if (!isset(window.BOXYFORM['CACHE'])) window.BOXYFORM['CACHE'] = {};
                    if (!isset(window.BOXYFORM['READY'])) window.BOXYFORM['READY'] = {};

                    if (!isset(window.BOXYFORM['HISTORY'])) window.BOXYFORM['HISTORY'] = []; //added 20100601
                    if (!isset(window.BOXYFORM['HISTORY_CURRENT'])) window.BOXYFORM['HISTORY_CURRENT'] = -1;

                    if (isset(options['ready'])) {
                        window.BOXYFORM['READY'][href] = options['ready'];
                    }

                    ankerSuccess(window.BOXYFORM['CACHE'][href]);

                    return false;

            });
        }
    });
};
