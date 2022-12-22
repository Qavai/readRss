var Core = {
    name: 'Core browser extention',
    version: 1.102,
    copyright: '(c) Eugene Ivanov, 2013...now e-ivanov.ru/projects/core-for-browser-extentions/ eugene.ivanov@gmail.com',

    icon_counts: false,

    messages_callbacks: [],

    activeTabFeedList: [],
    activeTabUrl: '',

    isChrome: true,

    cron_timer: null,
    cron_timer_value: 15,
    cron_timeAdd2tryCount: {
        0: 60 * 60 * 24 * 7,
        1: 60 * 60 * 24 * 5,
        2: 60 * 60 * 24 * 3,
        3: 60 * 60 * 24 * 3,
        4: 60 * 60 * 24 * 3,
        5: 60 * 60 * 24,
        6: 60 * 60 * 12,
        7: 60 * 60,
        8: 60 * 10,
        9: 60
    },
    cron_lock: false,
    cron_lock_timer: null,

    clearFromOldThingsTime: 24 * 60 * 60, // удаление от старых элементов в БД, 1 раз в день

    requestTimeout: 20000,

    Storage: null,
    icon_may_draw: 0,
    icon_state: 0,
    icon_current: '?',
    icon_list: ['rss'],
    icon_colors: { '': [0, 0, 0, 0], 'rss': [113, 184, 65, 255] },
    img_notLoggedInSrc: "not_logged_in",
    img_noNewSrc: "no_new",
    img_newSrc: "new_",
    iconFormat: ".png",
    iconHave: "_have",
    browserAction: { icon: {} },

    redraw_icon_timer: null,

    timeToLoad_rss: 25 * 60,
    timeToClear: 24 * 60 * 60,

    timeToStatistic: 24 * 60 * 60,

    notify_opened: [],

    sounds: [],

    optionsList: [
        {
            "type": "checkbox",
            "title": "По щелчку на desktop событие открывать ссылку и закрывать окошко",
            "help": "",
            "group": "general",
            "def": 1,
            "name": "notify_click_open_and_close"
        }

        , {
            "type": "checkbox",
            "title": "Звук включен",
            "help": "Вкл/выкл звук по приходу новых сообщений",
            "name": "is_sound_on",
            "group": "general",
            "def": 0
        }

        , {
            "type": "checkbox",
            "title": "Всплывающие окошки включены",
            "help": "Вкл/выкл всплывающие окошки по приходу новых сообщений",
            "name": "is_notify_on",
            "group": "general",
            "def": 0
        }

    ],

    get_el_by_field: function (arr, f, v) {
        for (var i = 0, m = arr.length; i < m; i++) if (typeof arr[i] != 'undefined' && arr[i][f] == v) return i; return -1;
    },

    getCurrentTime: function () {
        return Math.round((new Date).getTime() / 1000);
    },

    func_send_message: function (msg, value) {
        var that = this;
        that.connect = this.port_sendMessage({ "doing": 'answer_' + msg.doing, "func": msg.func, "field": msg.field, "value": value, "type": msg.type, "under_type": msg.under_type }, that.connect);
    },

    func_sendMessage: function (func, field, value, callback) {
        var that = this;

        this.messages_callbacks.push({
            "func": func,
            "field": field,
            "value": value,
            "callback": callback
        });

        that.connect = this.port_sendMessage({ "doing": "function", "func": func, "field": field, "value": value }, that.connect);
    },

    port_sendMessage: function (data, port) {
        var that = this;

        var port_;
        if (typeof this.FF.panel == 'undefined') {
            port_ = port || chrome.runtime.connect({ name: "ei_core" });
            port_.postMessage(data, "*");
        } else {
            port_ = port || this.FF.panel.port;
            port_.emit("message", data);
        }


        return port_;
    },

    preInit: function (Storage) {
        var that = this;

        function urlX(u) {
            return u;
        }
        function idX(id) {
            //return id; // вырезаем id и классы
        }

        if (typeof Quo != 'undefined') {
            this.funcs = window;
            this.FF = {};
            this.isFF = false;

            this.sanitize = function (string) {
                //that.funcs.mprint(string);
                html4.ATTRIBS['iframe::src'] = 0;
                html4.ATTRIBS['iframe::allowfullscreen'] = 0;
                html4.ATTRIBS['iframe::frameborder'] = 0;
                html4.ATTRIBS['iframe::scrolling'] = 0;
                html4.ATTRIBS['iframe::*'] = 0;
                html4.ATTRIBS['*::style'] = 1;
                //html4.ATTRIBS[''] = 0;
                string = window.sanitize(string, urlX, idX);
                //that.funcs.mprint(string);
                return string;
            }

            this.xml2json = window.xml2json;
            this.hex_md5 = window.hex_md5;

            this.timer = window;
            this.isChrome = true;

            this.$ = Quo;
            this.$.ajaxSettings.timeout = this.requestTimeout;
        } else {
            var chrome = require("chrome");
            var Cc = chrome.Cc;
            var Ci = chrome.Ci;

            this.funcs = require("funcs");

            var sanitizer = require("sanitizer");
            this.sanitize = function (string) {
                return sanitizer.sanitize(string, urlX, idX);
            }

            var xml2json = require("xml2json");
            this.xml2json = xml2json.xml2json;
            this.hex_md5 = ""; //!!!!

            var change_sql_js = require("change_sql");
            this.change_sql_list = change_sql_js.change_sql_list;

            this.timer = require("sdk/timers");
            this.FF = {};

            this.isFF = true;

            this.$ = {};

            var request = require("sdk/request");
            this.parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);

            this.$.ajax = function (options) {
                var type = options.type.toLowerCase();

                var content = [];
                var data = options.data || {};
                for (var i in data) {
                    content.push(i + '=' + data[i]);
                }

                if (!content.length) {
                    content = "";
                } else {
                    content = '&' + content.join('&');
                }

                var xmlPrepare = function (str) {
                    var xml_delim = new RegExp('<|>', 'g')
                    var replace = str.match(/"(.*?)"/g);

                    for (var i = 0; i < replace.length; i++) {
                        str = str.replace(new RegExp(replace[i]), replace[i].replace(xml_delim, ''));
                    }
                    return str;
                };

                var requestOptions = {
                    url: options.url,
                    content: content,
                    contentType: options.contentType || "application/x-www-form-urlencoded",
                    onComplete: function (response) {
                        var status = response.status;
                        var text = response.text;

                        if (status == 200) {

                            if (options.dataType == 'xml') {
                                text = that.parser.parseFromString(xmlPrepare(text), "application/xml");
                            }

                            options.success(text);
                        } else {
                            options.error(text);
                        }
                    }
                };

                if (options.dataType == 'xml') {
                    requestOptions['overrideMimeType'] = "text/xml";
                }

                var req = request.Request(requestOptions);

                /*
                    var request = new require("xhr").XMLHttpRequest();
                    request.open('GET', 'https://to-the-api.com', true);
                    request.onreadystatechange = function (aEvt) {
                      if (request.readyState == 4) {
                            //request.responseXML;
                      }
                    };
                    request.send(null);
                */

                if (type == 'get') {
                    req.get();
                }

                if (type == 'post') {
                    req.post();
                }
            }
        }

        this.Storage = new Storage();
        this.Storage.connect();



        this.rss = Rss;
        this.rss.init(this);



        this.rr = ReadRss;
        this.rr.init(this);





        this.reset();

        if (this.isFF) {
            that.FF.data = require("sdk/self").data;

            that.panelCreate(false);
            that.buttonCreate();
            that.pageMod_init();
        }

        that.onLoad();



        /*
        var d = {
            "url" : "http://images.adsttc.com/media/images/572c/8dfc/e58e/ce74/ca00/0045/medium_jpg/3_160202_Manning_Road_House_1093_1096.jpg?1462537709",
            "LastModified" : false,
            "Etag" : false,
            "eventKey" : 8167
        }
        that.rr.img_load(d, function() {});
        */



        /*
        var imgPrimaryKey = 444;
        var img = {
            "width" : 222,
            "height" : 111
        };

        var url = 'http://ic.pics.livejournal.com/avatarakali/2159308/1760039/1760039_600.jpg';
        var re = new RegExp('\\s+src="'+url+'"', 'igm');
        var t = 'Январь пролетел как пара часов: тренировки, работа, социальные мероприятия, самообучение, некоторые перемены в плане мест жительства - всего было столько много, что записывать я просто не успевала. Надеюсь продолжить традицию обзора тренировок за месяц<br><br>Короткой строкой за январь по поводу не-тренировок:<br><ul><br><li><b> Про INSTAGRAM</b> Купила андроидо-Блекберри - <b>BlackBerry Priv </b>- и у меня теперь есть <b>Instagram</b>. В инстаграме меня зовут, как это ни удивительно - <b>avatarakali </b>=)</li><br><li> <b>Про работу: </b>моих 30 человек поделили на 5 групп и я теперь больше не вешаюсь , а работа с 5ю всего - это просто тааакое огромное пространство-время для деятельности открывается</li><br><li> <b>Про работу еще раз</b> - У меня появилась перспектива отдельного интересного занятия кроме тактических разруливаний текущих процессов . Не могу детали пока рассказать.</li><br><li> <b>Про PMP - Project Management Professional Exam </b>Я собрала документы по ВСЕМ своим проектам за последние 2 года, прочистила, перебрала, отправила на аудит в PMI - и мне дали добро на сдачу экзаменов!</li><br><li> <b>Про питание:</b> по прежнему в стиле авокадо-салаты-орехи-миндальное масло. Но! Стала употреблять <a href="https://myvega.com/products/vega-one-nutritional-shake/">VEGA Nutritional Shake </a></li><br><br><br></ul><b>По поводу тренировок </b><br><a href="https://myvega.com/products/vega-one-nutritional-shake/">VEGA Nutritional Shake </a> - это единственный способ заставить меня что-то внутрь залить, когда аппетит полнотстью отрубается из-за роста нагрузок. Я развожу shake огромным количеством воды, как разведеное молоко, немного солю - получается легкий суп. С июня прошлого года я не употребляю никаких гелей, тренируюсь на UCAN, ем предельно малое количество углеводов. Побочный эффект - совершенное не могу ощущать ничего сладкого. Большинство современных видов спортивного питания для меня - просто невозможно сладкие. Этот Vega-суп - это мой выход.<br><br><b>Я продолжаю работать с тренером:</b> <a href="https://avatarakali.wordpress.com/2015/10/10/haley/">Хейли </a> невероятно меня поддерживает в достижении моих целей. Ее вывереный подход к составлению расписания для меня, постоянный контакт с ней, баланс плавания-бега-велосипеда в зависимости от ближайших мероприятий - все это вместе выводит меня на совсем новый для меня уровень развития. И я знаю - она проведет меня через нужные для этого года нагрузки так, что я не травмируюсь и буду способна еще и нормально фунционировать во всех остальных своих сферах деятельности.<br><br><br><b><u>Неделя 1 </u></b>- продолжение декабря 2015го: с заплывом на 7км в бассейне - <b>16 часов</b> тренировок получилось вместо планированых 14ти, но там не было особо ограничений по времени, я могла добавить нагрузку самостоятельно<br><u><b>Неделя 2 </b>-</u> Полу-айронмен во Флориде , тейпер и отдых после - <b>9 часов </b><br><b><u>Неделя 3 -</u></b> Первая неделя более-менее нагрузочного бега, силовых , 1я неделя подготовки к забегу на 50 миль <b>9 часов</b><br><b><u>Неделя 4 - </u></b>Легкий набор нагрузки , первая пробежка в этом году в стиле <b>&quot;2 в день&quot;:</b> 1) утром на 17 миль на беговой дорожке. 2) вечером на улице. Всего в неделю <b>13 часов</b> ,<br><b><u>Неделя 5 -</u></b> Самая сложная. И силовые усиленные, и забеги в горки, и, вот, выходные , вчера - 20 миль по тропам с ощутимым &nbsp;в набором высоты, и вечером на 8.<br><br><br><div style="text-align: center"><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1757914/1757914_original.jpg"><img alt="j1" src="http://ic.pics.livejournal.com/avatarakali/2159308/1757914/1757914_600.jpg" title="j1"></a><span style="line-height: 1.4"> </span><br><br>Неделя 1 - 17 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1757973/1757973_original.jpg"><img alt="j2" src="http://ic.pics.livejournal.com/avatarakali/2159308/1757973/1757973_600.jpg" title="j2"></a><br>Неделя 2 - 9 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758397/1758397_original.jpg"><img alt="j3" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758397/1758397_600.jpg" title="j3"></a><br>Неделя 3 - 9 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758573/1758573_original.jpg"><img alt="j4" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758573/1758573_600.jpg" title="j4"></a><br>Неделя 4 - 13 часов тренировок<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758878/1758878_original.jpg"><img alt="j5" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758878/1758878_600.jpg" title="j5"></a><br><span style="line-height: 17.8182px">Неделя 5 - 17 часов тренировок (2 на веле еще предстоят) </span><br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758999/1758999_original.jpg"><img alt="Janlj" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758999/1758999_600.jpg" title="Janlj"></a><br>Всего получается как-то так - видно уровень нагрузки в разные недели<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1759823/1759823_original.jpg"><img alt="sw" src="http://ic.pics.livejournal.com/avatarakali/2159308/1759823/1759823_600.jpg" title="sw"></a><br>Мне график набора/ сброса высоты понравился<br>4 раза туда-сюда =)</div><div>Вечерняя пробежка под звездами на 8 миль, после утренних 20ти миль - 5ти часов по горкам: это был один из самых сложных тренировочных дней в этом году.<br>Вытащить тело из дома, заставить его бежать: первые 30 минут я переходила на шаг. П потом нашла круг в 1 км в микрорайоне и....<br><br><span style="line-height: 17.8182px">Я впервые, наверное, с прошлого года, почувствовала опять свою способность бежать почти бесконечно. Это выверенное милями движение.<br><br><b>Звезды над головой, клочок асфальта в свете моего фонарика под ногами</b>. И ровный ритм бега. И так - 1,5 часа. Это был тот момент, когда я поняла , что смогу таким образом подготовиться к Leadville. Что это - только начало моих тренировок. </span></div><div style="text-align: center"><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1759287/1759287_original.jpg"><img alt="Admiral" src="http://ic.pics.livejournal.com/avatarakali/2159308/1759287/1759287_600.jpg" title="Admiral"></a></div><b>Чему учит бег по тропам</b><br>За всего одну пробежку на 20 миль по тропам я успела заметить несколько важных вещей:<br>1) Я раз сто прокляла тот день, когда начала курить в глупой молодости. Когда сипела бронхами, отзывающимися болью так, как будто я бегала впервые в жизни, пока я забегала в горку. Все остальные мои тренировки не давали столь ясной картины того, насколько у меня не развиты легкие в целом.<br>2) Я упала , грациозно, и ничего не повредилось. Упала потому, что посмотрела на часы. Ничто так не учит тренировке присутствия в данный момент, как каменистые извилистые тропы.<br>3) После 3х часов бега у меня иногда сводило стопы при забеге на горку. Научилась наступать так, чтобы не сводило.<br>4) После 4х часов включила mp3-player , и греческая музыка - это чудесно! &nbsp;=)))<br><br><br>Через 2 недели - <a href="http://avatarakali.livejournal.com/806114.html">50 миль по песку во Флориде </a><br><a></a> <br><div style="text-align: center"><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1760039/1760039_original.jpg"><img alt="red" src="http://ic.pics.livejournal.com/avatarakali/2159308/1760039/1760039_600.jpg" title="red"></a><br><span style="line-height: 1.4">Рассвет в алом на тропе вокруг Sawnee Mountan</span></div>';

        t = t.replace(re, ' width="'+img['width']+'" height="'+img['height']+'" data-src="'+url+'" data-image-id="'+imgPrimaryKey+'" src="../images/file.png"');

        console.log(t);
        */











        //!!=======================test

        if (0) {

            var c = [];
            c.push({
                primaryKey: 72298,
                textImg: 'Январь пролетел как пара часов: тренировки, работа, социальные мероприятия, самообучение, некоторые перемены в плане мест жительства - всего было столько много, что записывать я просто не успевала. Надеюсь продолжить традицию обзора тренировок за месяц<br><br>Короткой строкой за январь по поводу не-тренировок:<br><ul><br><li><b> Про INSTAGRAM</b> Купила андроидо-Блекберри - <b>BlackBerry Priv </b>- и у меня теперь есть <b>Instagram</b>. В инстаграме меня зовут, как это ни удивительно - <b>avatarakali </b>=)</li><br><li> <b>Про работу: </b>моих 30 человек поделили на 5 групп и я теперь больше не вешаюсь , а работа с 5ю всего - это просто тааакое огромное пространство-время для деятельности открывается</li><br><li> <b>Про работу еще раз</b> - У меня появилась перспектива отдельного интересного занятия кроме тактических разруливаний текущих процессов . Не могу детали пока рассказать.</li><br><li> <b>Про PMP - Project Management Professional Exam </b>Я собрала документы по ВСЕМ своим проектам за последние 2 года, прочистила, перебрала, отправила на аудит в PMI - и мне дали добро на сдачу экзаменов!</li><br><li> <b>Про питание:</b> по прежнему в стиле авокадо-салаты-орехи-миндальное масло. Но! Стала употреблять <a href="https://myvega.com/products/vega-one-nutritional-shake/">VEGA Nutritional Shake </a></li><br><br><br></ul><b>По поводу тренировок </b><br><a href="https://myvega.com/products/vega-one-nutritional-shake/">VEGA Nutritional Shake </a> - это единственный способ заставить меня что-то внутрь залить, когда аппетит полнотстью отрубается из-за роста нагрузок. Я развожу shake огромным количеством воды, как разведеное молоко, немного солю - получается легкий суп. С июня прошлого года я не употребляю никаких гелей, тренируюсь на UCAN, ем предельно малое количество углеводов. Побочный эффект - совершенное не могу ощущать ничего сладкого. Большинство современных видов спортивного питания для меня - просто невозможно сладкие. Этот Vega-суп - это мой выход.<br><br><b>Я продолжаю работать с тренером:</b> <a href="https://avatarakali.wordpress.com/2015/10/10/haley/">Хейли </a> невероятно меня поддерживает в достижении моих целей. Ее вывереный подход к составлению расписания для меня, постоянный контакт с ней, баланс плавания-бега-велосипеда в зависимости от ближайших мероприятий - все это вместе выводит меня на совсем новый для меня уровень развития. И я знаю - она проведет меня через нужные для этого года нагрузки так, что я не травмируюсь и буду способна еще и нормально фунционировать во всех остальных своих сферах деятельности.<br><br><br><b><u>Неделя 1 </u></b>- продолжение декабря 2015го: с заплывом на 7км в бассейне - <b>16 часов</b> тренировок получилось вместо планированых 14ти, но там не было особо ограничений по времени, я могла добавить нагрузку самостоятельно<br><u><b>Неделя 2 </b>-</u> Полу-айронмен во Флориде , тейпер и отдых после - <b>9 часов </b><br><b><u>Неделя 3 -</u></b> Первая неделя более-менее нагрузочного бега, силовых , 1я неделя подготовки к забегу на 50 миль <b>9 часов</b><br><b><u>Неделя 4 - </u></b>Легкий набор нагрузки , первая пробежка в этом году в стиле <b>&quot;2 в день&quot;:</b> 1) утром на 17 миль на беговой дорожке. 2) вечером на улице. Всего в неделю <b>13 часов</b> ,<br><b><u>Неделя 5 -</u></b> Самая сложная. И силовые усиленные, и забеги в горки, и, вот, выходные , вчера - 20 миль по тропам с ощутимым &nbsp;в набором высоты, и вечером на 8.<br><br><br><div style="text-align: center"><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1757914/1757914_original.jpg"><img alt="j1" src="http://ic.pics.livejournal.com/avatarakali/2159308/1757914/1757914_600.jpg" title="j1"></a><span style="line-height: 1.4"> </span><br><br>Неделя 1 - 17 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1757973/1757973_original.jpg"><img alt="j2" src="http://ic.pics.livejournal.com/avatarakali/2159308/1757973/1757973_600.jpg" title="j2"></a><br>Неделя 2 - 9 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758397/1758397_original.jpg"><img alt="j3" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758397/1758397_600.jpg" title="j3"></a><br>Неделя 3 - 9 часов<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758573/1758573_original.jpg"><img alt="j4" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758573/1758573_600.jpg" title="j4"></a><br>Неделя 4 - 13 часов тренировок<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758878/1758878_original.jpg"><img alt="j5" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758878/1758878_600.jpg" title="j5"></a><br><span style="line-height: 17.8182px">Неделя 5 - 17 часов тренировок (2 на веле еще предстоят) </span><br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1758999/1758999_original.jpg"><img alt="Janlj" src="http://ic.pics.livejournal.com/avatarakali/2159308/1758999/1758999_600.jpg" title="Janlj"></a><br>Всего получается как-то так - видно уровень нагрузки в разные недели<br><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1759823/1759823_original.jpg"><img alt="sw" src="http://ic.pics.livejournal.com/avatarakali/2159308/1759823/1759823_600.jpg" title="sw"></a><br>Мне график набора/ сброса высоты понравился<br>4 раза туда-сюда =)</div><div>Вечерняя пробежка под звездами на 8 миль, после утренних 20ти миль - 5ти часов по горкам: это был один из самых сложных тренировочных дней в этом году.<br>Вытащить тело из дома, заставить его бежать: первые 30 минут я переходила на шаг. П потом нашла круг в 1 км в микрорайоне и....<br><br><span style="line-height: 17.8182px">Я впервые, наверное, с прошлого года, почувствовала опять свою способность бежать почти бесконечно. Это выверенное милями движение.<br><br><b>Звезды над головой, клочок асфальта в свете моего фонарика под ногами</b>. И ровный ритм бега. И так - 1,5 часа. Это был тот момент, когда я поняла , что смогу таким образом подготовиться к Leadville. Что это - только начало моих тренировок. </span></div><div style="text-align: center"><br><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1759287/1759287_original.jpg"><img alt="Admiral" src="http://ic.pics.livejournal.com/avatarakali/2159308/1759287/1759287_600.jpg" title="Admiral"></a></div><b>Чему учит бег по тропам</b><br>За всего одну пробежку на 20 миль по тропам я успела заметить несколько важных вещей:<br>1) Я раз сто прокляла тот день, когда начала курить в глупой молодости. Когда сипела бронхами, отзывающимися болью так, как будто я бегала впервые в жизни, пока я забегала в горку. Все остальные мои тренировки не давали столь ясной картины того, насколько у меня не развиты легкие в целом.<br>2) Я упала , грациозно, и ничего не повредилось. Упала потому, что посмотрела на часы. Ничто так не учит тренировке присутствия в данный момент, как каменистые извилистые тропы.<br>3) После 3х часов бега у меня иногда сводило стопы при забеге на горку. Научилась наступать так, чтобы не сводило.<br>4) После 4х часов включила mp3-player , и греческая музыка - это чудесно! &nbsp;=)))<br><br><br>Через 2 недели - <a href="http://avatarakali.livejournal.com/806114.html">50 миль по песку во Флориде </a><br><a></a> <br><div style="text-align: center"><a href="http://ic.pics.livejournal.com/avatarakali/2159308/1760039/1760039_original.jpg"><img alt="red" src="http://ic.pics.livejournal.com/avatarakali/2159308/1760039/1760039_600.jpg" title="red"></a><br><span style="line-height: 1.4">Рассвет в алом на тропе вокруг Sawnee Mountan</span></div>'
            });
            /*
            c.push({
                primaryKey : 4,
                textImg : '<div>Воркшоп прошёл почти 4 месяца назад, в декабре, ещё 15-го года. Но сейчас у нас нашлась минутка собрать фотоотчёты с него в один большой пост! Смотрим эти фотки и нарадоваться не можем, что всё это на самом деле произошло :)</div><div><br><br><a href="https://medium.com/pastry-stuff/%D0%BB%D0%B8%D1%81%D0%B0-%D0%BD%D0%B0-%D0%B2%D0%B5%D1%80%D1%82%D0%B5%D0%BB%D0%B5-%D0%B2-%D0%BC%D0%B8%D0%BD%D1%81%D0%BA%D0%B5-2-65bf455572be#.3pjpoh90m"><img alt="" height="700" src="https://cdn-images-1.medium.com/max/800/1*I_aF7M4P_l2hh3X4s2T_cw.jpeg" width="463"></a><br></div><div><a href="https://medium.com/pastry-stuff/%D0%BB%D0%B8%D1%81%D0%B0-%D0%BD%D0%B0-%D0%B2%D0%B5%D1%80%D1%82%D0%B5%D0%BB%D0%B5-%D0%B2-%D0%BC%D0%B8%D0%BD%D1%81%D0%BA%D0%B5-2-65bf455572be#.3pjpoh90m"><img alt="" src="https://cdn-images-1.medium.com/max/1200/1*emwbdxHEEc2-4h3vqOUFWQ.jpeg" width="800"></a></div><div><span> </span><br></div><div><a href="https://medium.com/pastry-stuff/%D0%BB%D0%B8%D1%81%D0%B0-%D0%BD%D0%B0-%D0%B2%D0%B5%D1%80%D1%82%D0%B5%D0%BB%D0%B5-%D0%B2-%D0%BC%D0%B8%D0%BD%D1%81%D0%BA%D0%B5-2-65bf455572be#.3pjpoh90m">Дальше...</a></div><div><br></div>'
            });
            c.push({
                primaryKey : 88,
                textImg : 'Друзья, три дня &quot;тишины в эфире&quot; обьясняются тем, что я... плыву. И мне хочется отдохнуть без интернета. Вначале плыл из Таллина в Хельсинки, а затем пересел на другой паром и отправился из Хельсинки в Германию. Сегодня, перед отправлением поезда Любек-Копенгаген хочу успеть рассказать о необычном морском путешествии по Балтике. Маршрутом Таллин - Хельсинки я плавал раз десять за последние годы, а вот в длительное морское путешествие в Германию отправился впервые. Это нельзя назвать круизом, поскольку Finnlines является грузовой компанией, специализирующейся на морских перевозках. Паром Хельсинки - Травемюде чрезвычайно популярен как для финнов, желающих на своей машине добраться до центральной Европы, так и для россиян (в особенности жителей Санкт-Петербурга). Сразу скажу, что тем, кто ищет именно развлекательный круиз с заходом в столицы Балтики - лучше выбрать другие варианты, а здесь скорее оптимальный, комфортный и относительно недорогой вариант попасть в Европу минуя изнурительные границы и долгую дорогу.<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1094%20Custom_zpsxsfyutyl.jpg"><br><br><br><br>А начиналсь все в Таллине, где я прокатился на скоростном пароме компании Linda Line. Никогда ранее на них не плавал и даже не знал, что они существуют. Между тем, эти ребята самые дешевые на линии и билеты Таллин - Хельсинки и обратно можно взять за скромные 25 евро. Между прочим, на заднем фоне виднеется недавнео открывшаяся для туристов таллинская тюрьма Patarei -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1049%20Custom_zpsncx7ghen.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1050%20Custom_zpsp7vkebal.jpg"><br><br>Та самая таллинская тюрьма, о которой я расскажу отдельным постом -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1048%20Custom_zpsnmosswyb.jpg"><br><br>До новых встреч, Эстония!<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1051%20Custom_zpsrunvcf9x.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1052%20Custom_zpswngstpv9.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1053%20Custom_zpsrdufox05.jpg"><br><br>Полтора часа через Финский залив и вот островная крепость Суоменлинна близ Хельсинки -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1061%20Custom_zpsjjqhxgyc.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1057%20Custom_zps3liagoyf.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1060%20Custom_zpsezujbszs.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1060%20Custom_zpsezujbszs.jpg"><br><br>Собственно, Хельсинки -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1058%20Custom_zps9avotfyp.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1062%20Custom_zpsps7iq597.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1064%20Custom_zpsvkvmzhm7.jpg"><br><br>Центр города, каким он видится с палубы входящих в гавань судов -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1065%20Custom_zpsgnnwpwo4.jpg"><br><br>В этом городе я бывал не раз, так что сейчас просто иду на вокзал, где встречаюсь с другими участниками поездки в Германию -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0162Medium_zps0a866201.jpg"><br><br>Хельсинки - интереснейший город, но интересен он по-своему и не для каждого. Тут не Париж и не Амстердам, но ничуть не менее увлекательно. Лично я просто балдею от изысков местных архитекторов-бруталистов.<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0164Medium_zps017b3db1.jpg"><br><br>Привокзальная площадь -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/Untitled_Panorama1%20Custom_zpsraqbcfdq.jpg"><br><br>Неизменные бомжи и цыгане-попрошайки, оккупировавшие все подходы к вокзалу -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0174Medium_zpse55f3a5e.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0175Medium_zps383bbafd.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0170Medium_zpsc0860c8f.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1070%20Custom_zps9kkzdwvr.jpg"><br><br>Причал для судов в Германию расположен в 17 километрах к востоку от центра города, что лишний раз подчеркивает тот факт, что это ни капли не круиз, а именно что транспортировка вас и вашей машины в Европу. Для автолюбителя очень удобно, поскольку не въезжая в забитый пробками Хельсинки, вы элементарно сворачиваете со скоростной трассы Санкт-Петербург - Хельсинки и вскоре попадаете на паром Finnlines -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1086%20Custom_zps6veczrkj.jpg"><br><br>Автомобили паркуются в несколько уровней -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1071%20Custom_zps5okt4nws.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1088%20Custom_zpst4nymvhk.jpg"><br><br>В путь!<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1090%20Custom_zpsbdtz7e3r.jpg"><br><br>Летом, думаю, на верхней палубе тишь да гладь, но сейчас, в апреле - продувной и ледяной ветер и долго тут не погуляешь -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1093%20Custom_zpsalovpndw.jpg"><br><br>Внутри судна все крайне комфортно и оптимально для 28-часового плавания: интернет, тренажерка, сауна, кафе, рестораны, магазины. Одним словом, &quot;типовой&quot; набор.<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/Untitled_Panorama3%20Custom_zpswsnvtk2u.jpg"><br><br>Сауна -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/Untitled_Panorama2%20Custom_zps6xzpbna8.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1076%20Custom_zpsiytgzc7h.jpg"><br><br>Лифты, курсирующие по всем 11 этажам громадного судна -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1111%20Custom_zps2zkkkam1.jpg"><br><br>Каюты на любой вкус и кошелек -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1072%20Custom_zpsv61adoiq.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1074%20Custom_zpsfltjjdkd.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0002%20Custom_zpsykr9gzjg.jpg"><br><br>Самые популярные это четырехместные, плавание в которых в среднем стоит около 400 евро на всех четверых пассажиров вместе с автомобилем.<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0001%20Custom_zpse23fkmq5.jpg"><br><br>Душ с туалетом всегда в каждой каюте -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/Untitled_Panorama1%202%20Custom_zpsgmfzqids.jpg"><br><br>В принципе, можно сдвинуть две кровати и спать одному, если вам повезет и не будет соседей -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1119%20Custom_zpssefp6h6s.jpg"><br><br>Можно и шикануть, заняв каюту класса-люкс за скромные тысячу евро. В кризис это сущие копейки, согласитесь! К оплате принимаются как кредитные карты с наличностью, так и духовные скрепы на вес :)))<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0004%20Custom_zps6owe0qyp.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0003%20Custom_zps3uhccokb.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0005%20Custom_zpsbtkocmnh.jpg"><br><br>Хорошо быть блогером, можно попроситься в капитанскую рубку -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1099%20Custom_zps0xnx2tmb.jpg"><br><br>Ощущение, что это гигантская кабина... пилота самолета -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1100%20Custom_zps5c0aiy6h.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_1098%20Custom_zpsw3ichqjp.jpg"><br><br>Ресторан, где за 23-25 евро можно потрапезничать. Звучит как слишком дорогое удовольствие? Тогда везите с собой будерброды. Но если серьезно, то еда тут отменная и на этом финны не экономят. Ниже заострю ваше внимание на продуктах, которые стоят весьма недешево.<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0012%20Custom_zpsaqafdxty.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0008%20Custom_zpslah87ybj.jpg"><br><br>Лично я буквально &quot;объел&quot; финнов. В то время, как другие пассажиры тратили пустоты своего желудка на поедание картофеля и салатов, ваш покорный слуга пожирал в товарных количествах сёмгу. Я не преувеличиваю, но будучи рыбным маньяком, умудрялся в день сьедать не менее полутора килограммов(!) красной рыбы. Съел бы и больше, только вот красной рыбы не было на завтраке :)<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0007%20Custom_zpsqwazodml.jpg"><br><br>А вот к сосискам я весьма спокоен -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0009%20Custom_zpsepkpufbc.jpg"><br><br>Оставшееся во мне место после поедания сёмги заполняю салатами -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0006%20Custom_zpsgufsmrta.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0011%20Custom_zpsjbcxhkkd.jpg"><br><br>Скромная трапеза. Умножайте ее на три, я делал три подхода -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0013%20Custom_zpsjj1vkqpb.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0021%20Custom_zpszfde2m85.jpg"><br><br>Вечером следующего дня прибываем в порт Травемюде, что на севере Германии и рядом с городами Любек и Гамбург -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0016%20Custom_zpsvurng9fo.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0019%20Custom_zpshgaqa1bq.jpg"><br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0020%20Custom_zpsqaf7u1mo.jpg"><br><br>Травемюда - знаменитый балтийский курорт, чьи пляжи забиты под завязку в течение всего лета. Сейчас тут еще тихо. Заметили башню отеля? Сейчас мы на нее поднимемся -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0025%20Custom_zpswawp8lrw.jpg"><br><br>Вид на Травемюде с 13 этажа отеля. Внизу виднеется старый маяк -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0022%20Custom_zpshchgkd2d.jpg"><br><br>Балтийские пляжи -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0024%20Custom_zpspsyihbld.jpg"><br><br>Затем мы едем в Любек, где я беру в прокат машину и выдвигаюсь в мини-путешествие по линии бывшей границы ГДР и ФРГ, проходившей всего в 10 километрах к востоку от города. Вот первый пункт, это КПП Lubeck - Schlutup, один из пяти автомобильных пограничных переходов между ГДР и ФРГ -<br><br><img alt="" src="http://i746.photobucket.com/albums/xx108/puerrtto/Finland/DSC_0029%20Custom_zps094i9kmx.jpg"><br><br>Ладно, о границах мы поговорим отдельно, а сейчас я бегу на поезд в Копенгаген. До связи!<br><br><a></a>'
            });
            */
            var images = that.images_find(c);
            that.rr.images_insert_to_db(images, function (ret) {

                console.log(ret);

            });

        }





        that.timer.setTimeout(function () {
            return;
            var url = "http://feedproxy.google.com/gapersblock/bookclub";
            url = "http://www.confluence.org/feed/newvisits/rss20.php";
            url = "https://picasaweb.google.com/data/feed/base/user/philippe.chappuis/albumid/5297196325809923457?alt=rss&amp;kind=photo&amp;hl=en";
            url = "";
            url = "http://api.flickr.com/services/feeds/photos_public.gne?tags=geotagged&format=rss_200&georss=1";
            url = "http://api.flickr.com/services/feeds/geo/?g=322338@N20&lang=en-us&format=feed-georss";
            url = "http://roadreport.mdt.mt.gov/rss/mdt-roadreport-segments.xml";
            url = "http://itastdevserver.tel.uva.es/sample.xml";
            url = "http://mapmentality.awardspace.com/testgeorss.xml";
            url = "http://earthquake.usgs.gov/earthquakes/catalogs/1day-M2.5.xml";
            url = "http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml";
            url = "http://triptracker.net/trip/8990/georss/";
            url = "http://feeds.frontender.info/FrontenderMagazineArticles?format=xml";
            url = "http://aspnet.4guysfromrolla.com/rss/rss.aspx";
            url = "http://ycpi.api.flickr.com/services/feeds/groups_pool.gne?id=1214156@N24&lang=en-us&format=rss_200";
            url = "http://www.gismeteo.ru/news/rss/";
            url = "http://weewonderfuls.typepad.com/wee_wonderfuls/atom.xml";
            url = "http://feeds.feedburner.com/PetaPixel?format=xml";
            url = "http://addmeto.cc/feed";
            url = "http://feeds.feedburner.com/my-chrome?format=xml";
            url = "http://feeds.hanselman.com/ScottHanselman";
            url = "https://www.webkit.org/blog/feed/";
            url = "http://www.banki.ru/xml/columnists.rss";
            url = "http://habrahabr.ru/rss/best/";
            that.rr.rss_load_parse(
                url,
                0,
                "",
                "",
                function (feedInfo, guid_index, items, LastModified, Etag, status, headers) {

                    that.funcs.mprint(feedInfo);
                    that.funcs.mprint(guid_index);
                    that.funcs.mprint(items);
                    that.funcs.mprint(LastModified);
                    that.funcs.mprint(Etag);

                }
            );

            return;

            var t = '<p>text</p>\n<p>hello</p>\n\n<i></b></em>да<div class="feedflare">\n\
<a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:yIl2AUoC8zA"><img src="http://feeds.feedburner.com/~ff/my-chrome?d=yIl2AUoC8zA" border="0"></img></a> <a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:-BTjWOF_DHI"><img src="http://feeds.feedburner.com/~ff/my-chrome?i=OSkSTzFa2eg:TyLZ-Zr0Byo:-BTjWOF_DHI" border="0"></img></a> <a href="http://feeds.feedburner.com/~ff/my-chrome?a=OSkSTzFa2eg:TyLZ-Zr0Byo:D7DqB2pKExk"><img src="http://feeds.feedburner.com/~ff/my-chrome?i=OSkSTzFa2eg:TyLZ-Zr0Byo:D7DqB2pKExk" border="0"></img></a>\n\
</div><img src="http://feeds.feedburner.com/~r/my-chrome/~4/OSkSTzFa2eg" height="1" width="1"/>';
            that.funcs.mprint(t);
            t = that.sanitize(that.funcs.ads_clear(that.funcs.html_clear(t)));
            that.funcs.mprint(t);


            var url = "http://feedproxy.google.com/gapersblock/bookclub";
            url = "http://my.opera.com/ruario/xml/rss/blog/fonts";
            //url = "http://planet.gnome.org/rss20.xml";
            //url = "http://slon.ru/rss/xml/all.xml";
            //url = "http://peter.michaux.ca/feed/atom.xml";

            //url = "http://www.developers.org.ua/feeds/sitenews.xml/";
            //url = "http://www.noinimod.ru/rss.xml";
            url = "http://feeds.webkitbits.com/Webkitbits";
            url = "http://www.consideropen.com/feed/";
            that.rr.rss_load_iframe(
                url,
                function (data) {
                    that.funcs.mprint(data);

                    if (data['url'] && data['original_url'] && data['url'] != data['original_url']) {
                        //301

                    } else {

                    }
                }
            );

            return;


        }, 2000);


    },

    pageMod_init: function () {
        var that = this;

        return;//!!!

        require("sdk/page-mod").PageMod({
            include: "*",

            attachTo: ["existing", "top"], //, "frame"

            contentScriptFile: [
                that.FF.data.url("includes/hide_topics.js")
            ],

            contentStyleFile: [
                that.FF.data.url("css/hide_topics.css")
            ],

            contentScriptWhen: 'end',

            onAttach: function (worker) {
                worker.port.on("message", function (message) {
                    that.msg_handler(message, worker.port);
                });
            }
        });
    },

    buttonCreate: function () {
        var that = this;

        that.browserAction.button = require("sdk/widget").Widget({
            id: "ei_read_rss",
            label: "readRss",
            width: 20,
            contentURL: that.FF.data.url("icons/not_logged_in.png"),
            onClick: function (view) {
                view.panel = that.FF.panel;
            }
        });
    },

    panelCreate: function (isOptions) {
        var that = this;

        var contentURL = "";

        if (!isOptions) {
            contentURL = that.FF.data.url("popup/popup.html");
        } else {
            contentURL = that.FF.data.url("options/options.html");
        }

        that.FF.panel = require("sdk/panel").Panel({
            width: 635,
            height: 520,

            contentURL: contentURL,

            contentScriptWhen: 'start',

            onShow: function () {
            },

            onHide: function () {
                if (isOptions) {
                    that.FF.panel.destroy();
                    that.panelCreate(false);
                }
            }
        });

        that.FF.panel.port.on("message", function (message) {
            that.msg_handler(message);
        });
    },

    onLoad: function () {
        var that = this;

        that.setIcon(that.img_notLoggedInSrc);
        that.setBadgeText({ color: [190, 190, 190, 255], text: "?" }, that.img_notLoggedInSrc);

        this.setHandlers();

        if (!this.isFF) { //!!!
            this.loadSound('type.wav');
        }

        that.ignition(function () { });
    },

    TabGetFeeds: function () {
        var that = this;

        var forbiddenOrigin = /(chrome\:\/\/|chrome-devtools\:\/\/)/g,
            incognito,
            url,
            tabId,
            matchForbiddenOrigin;

        chrome.tabs.getSelected(undefined, function (tab) {
            //?? incognito = tab.incognito;
            url = tab.url;
            tabId = tab.id;

            matchForbiddenOrigin = url ? url.match(forbiddenOrigin, '') : true;

            //!!! проверять,чтобы не было
            // extensions::lastError:133 Unchecked runtime.lastError while running tabs.executeScript: Cannot access a chrome-extension:// URL of different extension
            //extensions::lastError:133 Unchecked runtime.lastError while running tabs.executeScript: Cannot access contents of url "http://e-ivanov.ru/mj/". Extension manifest must request permission to access this host.

            if (!matchForbiddenOrigin) {
                chrome.tabs.executeScript({
                    file: 'includes/content.js',
                    runAt: 'document_end'
                });
            } else {
                that.activeTabFeedList = [];
            }
        });
    },

    setHandlers: function () {
        var that = this;

        //-------------------------
        if (this.isChrome) {
            chrome.runtime.onConnect.addListener(function (port) {
                if (port.name == 'ei_core') {
                    port.onMessage.addListener(function (msg) {
                        that.msg_handler(msg, port);
                    });
                }
            });

            chrome.tabs.onUpdated.addListener(function (tabId, props, tab) {
                // Prevent multiple calls
                if (props.status == "loading" && tab.selected) {
                    //console.info("onUpdated");
                    that.TabGetFeeds();
                }
            });

            chrome.tabs.onHighlighted.addListener(function () {
                //console.info("onHighlighted");
                that.TabGetFeeds();
            });

            chrome.windows.onFocusChanged.addListener(function () {
                //console.info("onFocusChanged");
                that.TabGetFeeds();
            });

            chrome.windows.getCurrent(function (win) {
                chrome.tabs.query({ 'windowId': win.id, 'active': true }, function () {
                    //console.info("getCurrent");
                    that.TabGetFeeds();
                });
            });


        }
    },

    msg_handler: function (msg, port) {
        var that = this;

        var options = that.Storage.get_element_value('options');

        if (msg.doing == 'core_answer_function') {
            var c = this.messages_callbacks;
            var j = get_el_by_fields(c, {
                "func": msg.func,
                "value": msg.field
            }
            );

            if (j != -1) {
                var callback = c.splice(j, 1);
                callback[0]['callback'].call(that, msg.value);
            }
        }

        if (msg.doing == 'popup_ignition') {
            that.connect = that.port_sendMessage({ "doing": "ignition_ok", "coreInfo": { "version": that.version, "copyright": that.copyright } }, port);
        }

        //---------
        if (msg.doing == 'options_get') {
            that.connect = that.port_sendMessage({ doing: "options_a_get", options: options }, port);
        }

        //---------
        if (msg.doing == 'storage_set_element_value') {
            that.Storage.set_element_value(msg.field, msg.value);
        }
        //---------
        if (msg.doing == 'storage_get_element_value') {
            var value = that.Storage.get_element_value(msg.field, msg.def);
            that.connect = that.port_sendMessage({ "doing": 'answer_' + msg.doing, "field": msg.field, "value": value, "type": msg.type, "under_type": msg.under_type }, port);
        }
        //---------
        if (msg.doing == 'function') {

            //---------
            if (msg.func == 'rss_feeds_please') {
                that.activeTabFeedList = msg.value['list'];
                that.activeTabUrl = msg.value['url'];

                that.redraw_icon();
            }

            //---------
            if (msg.func == 'activetab_get_feeds') {
                var value = {};
                value.activeTabFeedList = that.activeTabFeedList;
                value.activeTabUrl = that.activeTabUrl;

                that.func_send_message(msg, value);
            }

            //---------
            if (msg.func == 'calc_cache_icon_counts') {
                that.calc_cache_icon_counts(function (popup_options) {
                    that.func_send_message(msg, popup_options);
                });
            }
            //---------
            if (msg.func == 'options_close') {
                that.FF.panel.hide();
            }
            //---------
            if (msg.func == 'options_open') {
                that.FF.panel.destroy();
                that.panelCreate(true);
                that.browserAction.button.panel = that.FF.panel;
                that.FF.panel.show();
            }
            //------------
            if (msg.func == 'optionsList_get') {
                that.func_send_message(msg, that.optionsList);
            }
            //------------
            if (msg.func == 'data_get') {
                var page = msg.value['page'];
                var onPage = msg.value['onPage'];
                var filters = msg.value['filters'];
                var sortType = msg.value['sortType'];
                var sortMode = 1 ? 'ASC' : 'DESC';//msg.value['sortMode'];
                var activeMode = msg.value['activeMode'];
                var offset = msg.value['offset'];

                sortType = 'datetime';

                var activeItem = filters['activeItem'];

                var filter_sql = "";
                if (!(activeItem['type'] == 'folder' && activeItem['primaryKey'] == 1)) {
                    filter_sql += ' AND ' + (activeItem['type'] == 'folder' ? 'folder_id' : 'feed_id') + '=' + activeItem['primaryKey'];
                }

                if (activeMode == 0) {
                    filter_sql += ' AND p.New != 0';
                }
                if (activeMode == 2) {
                    filter_sql += ' AND p.star != 0';
                }

                var type_pager = true;

                that.Storage.search_msgs(
                    "events",
                    "",
                    filter_sql,
                    "ORDER BY " +
                    (sortType != 'datetime' ? '' : 'p.') + sortType + " " + sortMode +
                    (sortType == 'datetime' ? "" : ", p.datetime " + sortMode)
                    ,
                    true,
                    page,
                    onPage,
                    type_pager,
                    offset,
                    function (c, countAll) {
                        that.func_send_message(msg, { "list": c, "countAll": countAll });
                    }
                );
            }
            //------------
            if (msg.func == 'feeds_get') {
                that.Storage.folders_get(
                    '',
                    function (folders_list) {
                        that.Storage.feeds_get(
                            ' AND p.event_id = 0 AND (p.deleted = 0 OR p.countsStar != 0)',
                            function (feeds_list) {
                                var popup_options = that.Storage.get_element_value('popup_options', {});

                                var filters = popup_options['reader']['filter'];
                                var subs_filters = popup_options['subs']['filter'];

                                var forum_active_id = subs_filters['activeItem']['primaryKey'];
                                var i, j, re, e, cn, c = feeds_list, len = c.length;

                                var st = subs_filters['forum_search'];
                                if (!st) st = '';

                                var sortBy = filters['forum_sort'];
                                if (!sortBy) sortBy = 'title';

                                var sortDesc = filters['forum_sort_desc'];
                                sortDesc = (!sortDesc) ? 'asc' : 'desc';

                                var sortFunc = function (a, b) {
                                    var r = 0, c, d;
                                    if (sortDesc == 'desc') {
                                        c = a;
                                        d = b;

                                        a = d;
                                        b = c;
                                    }
                                    if (['timeAdd'].indexOf(sortBy) != -1) {
                                        r = b[sortBy] - a[sortBy];
                                    } else {
                                        r = that.a1Sort(a[sortBy], b[sortBy]);
                                    }
                                    return r;
                                }

                                // фильтрую дочерние
                                if (st) {
                                    cn = [];
                                    re = new RegExp(st, 'i');

                                    for (i = 0; i < len; i++) {
                                        e = c[i];
                                        if ((e.root_id && (

                                            re.test(e.title)
                                            || re.test(e.title_original)
                                            || re.test(e.description)
                                            || re.test(e.link)
                                            || re.test(e.link_301)

                                        )

                                        ) || !e.root_id) {
                                            cn.push(c[i]);
                                        }
                                    }
                                    feeds_list = cn;
                                }
                                //------
                                // фильтрую корни
                                if (st) {
                                    c = feeds_list;
                                    len = c.length;
                                    cn = [];

                                    for (i = 0; i < len; i++) {
                                        e = c[i];
                                        if (e.primaryKey == forum_active_id || e.innerList

                                            || re.test(e.title)
                                            || re.test(e.title_original)
                                            || re.test(e.description)
                                            || re.test(e.link)
                                            || re.test(e.link_301)

                                        ) {
                                            cn.push(e);
                                        }
                                    }
                                    feeds_list = cn;
                                }
                                //------
                                c = folders_list;
                                len = c.length;
                                for (i = 0; i < len; i++) {
                                    e = c[i];

                                    if (typeof e.innerList == 'undefined') {
                                        e.innerList = [];
                                    }

                                    for (j = 0; j < feeds_list.length; j++) {
                                        if (feeds_list[j]['folder_id'] == e.primaryKey) {
                                            e.innerList.push(feeds_list[j]);
                                        }
                                        if (e.primaryKey == -1) {
                                            e.innerList.push(feeds_list[j]);
                                        }
                                    }
                                }
                                that.func_send_message(msg, { "list": folders_list, "forum_active_id": forum_active_id });
                            }
                        );
                    }
                );
            }
            //------------
            if (msg.func == 'folder_add') {
                var folder_item = msg.value;

                that.Storage.table_max_get('groups', function (primaryKey) {
                    primaryKey++;

                    folder_item['primaryKey'] = primaryKey;
                    folder_item['orderBy'] = primaryKey;
                    folder_item['timeUpdate'] = that.getCurrentTime();
                    folder_item['activePage'] = 1;
                    folder_item['counts'] = 0;
                    folder_item['is_active'] = 0;
                    folder_item['href'] = '';
                    folder_item['logolink'] = '';
                    folder_item['logo'] = '';
                    folder_item['mission'] = '';
                    folder_item['descr'] = '';

                    that.Storage.insert_msgs('groups', [folder_item], function (results) {
                        that.Storage.insert_msgs('groups_rel_user', [folder_item], function (results) {
                            that.func_send_message(msg, folder_item);
                        });
                    });
                });
            }
            //------------
            if (msg.func == 'feed_add') {
                var feed_url = msg.value["list"][0];
                var time_store_limit = msg.value["time_store_limit"];

                that.rr.rss_import('`~`', feed_url, false, time_store_limit, function (data) {
                    var items = data['items'];
                    var feedInfo = data['feedInfo'];

                    if (data['status'] == 'ok') {
                        if (items.length) {
                            var o = that.Storage.get_element_value("popup_options", {});
                            o["reader"]["filter"]['activeItem'] = { "type": "feed", "primaryKey": feedInfo["primaryKey"], "folder_id": feedInfo["folder_id"] };
                            that.Storage.set_element_value("popup_options", o);
                            that.connect = that.port_sendMessage({ "doing": "popUp_Refresh", "type": "rss", "sub_type": "read", "filter": o["reader"]["filter"] }, port);
                        }
                        that.func_send_message(msg, data);
                    } else {
                        that.func_send_message(msg, data);
                    }
                });
            }
            //------------
            if (msg.func == 'feeds_import') {
                var feeds_list = msg.value["list"];
                var time_store_limit = msg.value["time_store_limit"];

                var currTime = that.getCurrentTime();

                var cronList = [];

                var l = feeds_list.length, e;
                for (i = 0; i < l; i++) {
                    e = feeds_list[i];

                    cronList.push({
                        "eventKey": 0,
                        "msgType": "rss_import",
                        "objectType": 0,
                        "timeNextUpdate": currTime - 3600 + i,
                        "tryCount": 10,
                        "priority": 8,
                        "url": e,
                        "datetime": time_store_limit
                    });
                }

                that.Storage.cron_update(cronList, function (results) {
                    that.cron();
                });
                that.func_send_message(msg, feeds_list);
            }
            //------------
            if (msg.func == 'opml_import') {
                var opml = msg.value["file"];
                var time_store_limit = msg.value["time_store_limit"];

                var xml = that.rss.parseXml(opml);
                opml = null;
                var o = that.xml2json(xml, '');
                xml = null;

                var i, l, c, e, text;
                var currTime = that.getCurrentTime();
                var cronList = [];

                var body = o['body'];

                if (typeof body != 'undefined') {
                    body = body['outline'];
                    if (typeof body != 'undefined') {

                        var parse_outline_array = function (s, folder) {
                            if (typeof s == 'object' && !s.length) {
                                s = [s];
                            }

                            var i, l, c, e, text = [];
                            var currTime = that.getCurrentTime();
                            var cronList = [];

                            l = s.length;
                            if (l) {
                                for (i = 0; i < l; i++) {
                                    e = s[i];

                                    if (typeof e['outline'] != 'undefined') {
                                        cronList = cronList.concat(parse_outline_array(e['outline'], that.rss.xml_get_text(e['@title'])));
                                    } else {
                                        text = [];
                                        text.push(folder);
                                        text.push(that.rss.xml_get_text(e['@xmlUrl']));
                                        text.push(that.rss.xml_get_text(e['@title']));

                                        cronList.push({
                                            "eventKey": 0,
                                            "msgType": "opml_import",
                                            "objectType": 0,
                                            "timeNextUpdate": currTime - 3600 + i,
                                            "tryCount": 10,
                                            "priority": 9,
                                            "url": JSON.stringify(text),
                                            "datetime": time_store_limit
                                        });
                                    }
                                }
                            }

                            return cronList;
                        }

                        cronList = parse_outline_array(body, '`~`');
                    }
                }

                that.Storage.cron_update(cronList, function (results) {
                    that.func_send_message(msg, cronList);
                    that.cron();
                });
            }
            //------------
            if (msg.func == 'folder_edit') {
                var folder_item = msg.value;

                that.Storage.update_msgs('groups', [folder_item], true);
                that.func_send_message(msg, folder_item);
            }
            //------------
            if (msg.func == 'page_update') {
                var o = that.Storage.get_element_value("popup_options", {});
                o["reader"]['page'] = msg.value;
                that.Storage.set_element_value("popup_options", o);
            }
            //------------
            if (msg.func == 'subs_page_update') {
                var listUpdate = [{
                    'primaryKey': msg.field,
                    'activePage': msg.value
                }];

                var fields = ["activePage"];
                that.Storage.table_update(listUpdate, 'folders', true, fields, "primaryKey", function () { });
            }
            //------------
            if (msg.func == 'storage_get_element_value') {
                var value = that.Storage.get_element_value(msg.field, msg.value);
                that.func_send_message(msg, value);
            }
            //------------
            if (msg.func == 'storage_set_element_value') {
                that.Storage.set_element_value(msg.field, msg.value);
                that.func_send_message(msg, msg.value);
            }
            //------------
            if (msg.func == 'image_get_content') {
                that.Storage.get_list(
                    'imgs',
                    " AND primaryKey = " + msg.value,
                    false,
                    function (imgs_db) {
                        if (imgs_db.length == 1) {

                            var img = imgs_db[0];

                            //var b = 'data:image/jpeg;base64,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';
                            var b = img.content;

                            that.func_send_message(msg, b);
                        } else {
                            that.func_send_message(msg, null);
                        }
                    }
                );
            }
            //------------
            if (msg.func == 'folder_delete') {
                var array = msg.value;

                that.Storage.delete_msgs('groups', array, true, ["primaryKey"], function (result) {
                    var i, len = array.length;
                    for (i = 0; i < len; i++) {
                        array[i]['group_id'] = array[i]['primaryKey'];
                    }
                    that.Storage.delete_msgs('groups_rel_user', array, true, ["primaryKey"], function () { });
                    that.Storage.delete_msgs('groups4user', array, true, ["group_id"], function () { });

                    that.func_send_message(msg, array);
                });
            }
            //------------
            if (msg.func == 'array_undo_notify') {
                var array = msg.value['array'];
                var is_not_full_array = msg.value['is_not_full_array'];

                var i, len = array.length;
                var array_new = [];
                if (["star"].indexOf(msg.under_type) != -1) {
                    if (!is_not_full_array) {
                        for (i = 0; i < len; i++) {
                            array[i]['star'] = 0;
                            if (array[i]['New'] != 0) {
                                array_new.push(array[i]);
                            }
                        }
                        that.Storage.update_msgs('events', array, true);
                    } else {
                        that.Storage.set_msgs('events', true, { "star": 0 }, "");
                        //!!! array_new ?
                    }
                    that.calc_cache_icon_counts();
                    that.func_send_message(msg, []);
                }
            }
            //------------
            if (msg.func == 'array_update_notify') {
                var array = msg.value['array'];
                var is_not_full_array = msg.value['is_not_full_array'];

                if (["new", "all", "star"].indexOf(msg.under_type) != -1) {
                    if (!is_not_full_array) {

                        that.Storage.update_msgs('events', array, true, false, function () {
                            that.calc_cache_icon_counts();
                        });
                    } else {
                        if (is_not_full_array == 'mark_all_read') {

                            that.Storage.set_msgs('events', true, { "New": 0, "notifyWasViewed": 1 }, "", function () {
                                that.calc_cache_icon_counts();
                            });
                        }
                    }
                    that.func_send_message(msg, []);
                }

                if (msg.type == "rss" && msg.under_type == "list") {
                    var fields = that.Storage.fields2indexArray(that.Storage.tblFields['folders']);
                    that.Storage.table_update(array, 'folders', true, fields, "primaryKey", function () {
                        that.func_send_message(msg, []);
                    });
                }
            }
            //------------
            if (msg.func == 'feeds_delete') {
                var array = msg.value['array'];

                var o = that.Storage.get_element_value("popup_options", {});
                var activeItemNew = o["reader"]["filter"]['activeItem'];
                var is_was_active_in_deleted_new = false;

                var folder_id = array[0]['folder_id'];

                var countsAll = 0;
                var countsNew = 0;

                var feed_ids = [];
                var i, e, len = array.length;
                for (i = 0; i < len; i++) {
                    e = array[i];

                    e['deleted'] = that.getCurrentTime();
                    e['timeUpdate'] = 0;

                    countsAll += e['counts'] - e['countsStar'];
                    countsNew += e['countsNew'] - e['countsStar'];

                    e['counts'] = e['countsStar'];
                    e['countsNew'] = e['countsStar']; //!!!

                    feed_ids.push(e['primaryKey']);

                    if (activeItemNew['type'] == 'feed' && activeItemNew['primaryKey'] == e['primaryKey']) {
                        is_was_active_in_deleted_new = true;
                    }
                }

                that.Storage.counts_change("folders", -countsAll, -countsNew, 0, " AND primaryKey = " + folder_id, true, function () { });
                if (folder_id != 1) {
                    that.Storage.counts_change("folders", -countsAll, -countsNew, 0, " AND primaryKey = 1", true, function () { });
                }

                if (is_was_active_in_deleted_new) {
                    activeItemNew = { "type": "folder", "primaryKey": 1, "folder_id": 1 };
                    o["reader"]["filter"]['activeItem'] = activeItemNew;
                }
                that.Storage.set_element_value("popup_options", o);

                that.Storage.update_msgs('feeds', array, true, false, function () {
                    that.Storage.table_delete("events", " AND star = 0 AND feed_id IN(" + feed_ids.join(',') + ")", true, function () {
                        that.Storage.table_delete("cron", " AND msgType = 'rss_load' AND eventKey IN(" + feed_ids.join(',') + ")", true, function () {
                            that.calc_cache_icon_counts(function () {
                                that.connect = that.port_sendMessage({ "doing": "popUp_Refresh", "type": "rss", "filter": o["reader"]["filter"] }, port);
                                that.func_send_message(msg, array);
                            });
                        });
                    });

                });
            }
            //------------
            if (msg.func == 'feeds_edit') {
                var item = msg.value['item'];

                that.Storage.update_msgs('feeds', [item], true, false, function () {

                    let cronItem = { "msgType": "rss_load", "eventKey": item.primaryKey };

                    if (typeof item["link"] != 'undefined') {
                        cronItem["url"] = item["link"];
                    }
                    if (typeof item["link_301"] != 'undefined') {
                        cronItem["url_301"] = item["link_301"];
                    }

                    cronItem['timeNextUpdate'] = 1;

                    var keyFields = that.cron_getKeyFields(cronItem);

                    that.Storage.update_msgs('cron', [cronItem], true, keyFields, function (result) {
                        that.func_send_message(msg, [item]);
                    });
                });
            }
            //------------
            if (msg.func == 'sub_star') {
                var item = msg.value['item'];

                var folder_id = item['folder_id'];
                var feed_id = item['feed_id'];

                var countsStar = !item['star'] ? -1 : 1;

                that.Storage.counts_change("folders", 0, 0, countsStar, " AND primaryKey = " + folder_id, true, function () { });
                if (folder_id != 1) {
                    that.Storage.counts_change("folders", 0, 0, countsStar, " AND primaryKey = 1", true, function () { });
                }
                that.Storage.counts_change("feeds", 0, 0, countsStar, " AND primaryKey = " + feed_id, true, function () { });

                that.Storage.update_msgs('events', [item], true, false, function () {
                    that.calc_cache_icon_counts(function () {
                        that.func_send_message(msg, item);
                    });
                });

            }

            //------------
            if (msg.func == 'new_counts_change') {
                var item = msg.value['item'];
                var countsNew = !item['New'] ? -1 : 1;

                var folder_id = item['folder_id'];
                var feed_id = item['feed_id'];

                that.Storage.counts_change("folders", 0, countsNew, 0, " AND primaryKey = " + folder_id, true, function () { });
                if (folder_id != 1) {
                    that.Storage.counts_change("folders", 0, countsNew, 0, " AND primaryKey = 1", true, function () { });
                }
                that.Storage.counts_change("feeds", 0, countsNew, 0, " AND primaryKey = " + feed_id, true, function () { });


                var cronList = [];

                cronList.push({
                    "eventKey": item.primaryKey,
                    "msgType": "event_del",
                    "objectType": 0,
                    "timeNextUpdate": that.getCurrentTime() + 7 * 24 * 3600,
                    "tryCount": 2,
                    "priority": 7,
                    "url": '',
                    "datetime": 0
                });

                if (!item['New']) {
                    that.Storage.cron_update(cronList, function () {
                    });

                } else {
                    that.Storage.delete_msgs('cron', cronList, true, ['eventKey', 'msgType'], function (result) {
                    });
                }

                that.Storage.update_msgs('events', [item], true, false, function () {
                    that.calc_cache_icon_counts(function () {
                        that.func_send_message(msg, item);
                    });
                });
            }

            //------------
            if (msg.func == 'mark_read') {
                var item = msg.value['item'];

                var type = item['type'];
                var primaryKey = item['primaryKey'];

                if (type == 'feed') {
                    that.Storage.table_get("feeds", " AND primaryKey = " + primaryKey, function (data) {
                        if (data && data.length) {
                            data = data[0];
                            var countsNew = data["countsNew"];
                            var folder_id = data["folder_id"];

                            that.Storage.events_new_zero(" AND feed_id = " + primaryKey, true, function () {
                                that.Storage.counts_change("feeds", 0, -countsNew, 0, " AND primaryKey = " + primaryKey, true, function () {
                                    that.Storage.counts_change("folders", 0, -countsNew, 0, " AND primaryKey = " + folder_id, true, function () {
                                        that.Storage.counts_change("folders", 0, -countsNew, 0, " AND primaryKey = 1", true, function () {
                                            that.calc_cache_icon_counts(function () {
                                                that.func_send_message(msg, item);
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                } else {
                    that.Storage.table_get("folders", " AND primaryKey = " + primaryKey, function (data) {
                        if (data && data.length) {
                            data = data[0];
                            var countsNew = data["countsNew"];

                            that.Storage.events_new_zero(" AND folder_id = " + primaryKey, true, function () {
                                that.Storage.counts_change("folders", 0, -countsNew, 0, " AND primaryKey = " + primaryKey, true, function () {
                                    that.Storage.counts_change("folders", 0, -countsNew, 0, " AND primaryKey = 1", true, function () {
                                        that.Storage.feeds_new_zero(" AND folder_id = " + primaryKey, true, function () {
                                            that.calc_cache_icon_counts(function () {
                                                that.func_send_message(msg, item);
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            }

            //------------
            if (msg.func == 'mode_set') {
                var item = msg.value['item'];
                var activeMode = msg.value['activeMode'];

                var type = item['type'];
                var primaryKey = item['primaryKey'];

                var listUpdate = [{
                    'primaryKey': primaryKey,
                    'activeMode': activeMode
                }];
                var fields = ["activeMode"];

                if (type == 'feed') {
                    that.Storage.update_msgs('feeds', listUpdate, true, false, function () {
                        that.func_send_message(msg, item);
                    });
                } else {
                    that.Storage.update_msgs('folders', listUpdate, true, false, function () {
                        that.func_send_message(msg, item);
                    });
                }
            }

            if (msg.func == 'cron_update') {
                var cronList = msg.value;
                that.Storage.cron_update(cronList, function () {
                    that.func_send_message(msg, []);
                });
            }
            //------------
        }
    },

    a1Sort: function (a, b) {
        var cnt = 0, tem;
        a = String(a).toLowerCase();
        b = String(b).toLowerCase();
        if (a == b) return 0;
        if (/\d/.test(a) || /\d/.test(b)) {
            var Rx = /^\d+(\.\d+)?/;
            while (a.charAt(cnt) === b.charAt(cnt) &&
                !Rx.test(a.substring(cnt))) {
                cnt++;
            }
            a = a.substring(cnt);
            b = b.substring(cnt);
            if (Rx.test(a) || Rx.test(b)) {
                if (!Rx.test(a)) return a ? 1 : -1;
                if (!Rx.test(b)) return b ? -1 : 1;
                tem = parseFloat(a) - parseFloat(b);
                if (tem != 0) return tem;
                a = a.replace(Rx, '');
                b = b.replace(Rx, '');
                if (/\d/.test(a) || /\d/.test(b)) {
                    return this.a1Sort(a, b);
                }
            }
        }
        if (a == b) return 0;
        return a > b ? 1 : -1;
    },

    reset: function () {
        this.icon_counts = false;
    },

    ignition: function (callback) {
        var that = this;
        var i, j;

        var popup_options = that.Storage.get_element_value('popup_options');
        if (typeof popup_options.reader == 'undefined') {
            that.popup_options_set_default();
        }

        that.createSql(function () {
            that.changeSql(function () {

                //----- ставлю настройки по умолчанию, если ещё не было установлено
                var options = that.Storage.get_element_value('options');
                if (!options) options = {};

                var i, c = that.optionsList, len = c.length, e;
                for (i = 0; i < len; i++) {
                    e = c[i];
                    if (typeof options[e.name] != 'undefined') continue;
                    if (e.type == 'checkbox') {
                        options[e.name] = e.def;
                    }
                    if (e.type == 'text') {
                        options[e.name] = e.def;
                    }
                }
                that.Storage.set_element_value('options', options);

                that.load_some_elements(function (is_loaded_needed_elements) {
                    that.redraw_icon();
                    that.sendStatistic();

                    if (that.cron_timer) {
                        that.timer.clearInterval(that.cron_timer);
                        that.cron_timer = null;
                    }

                    that.cron_timer = that.timer.setInterval(function () {
                        that.cron();
                    }, that.cron_timer_value * 1000);

                    that.cron();


                    if (0) {

                        that.Storage.folders_get(
                            '',
                            function (folders_list) {
                                that.Storage.feeds_get(
                                    ' AND p.event_id = 0 AND p.deleted = 0',
                                    function (c) {

                                        var i, e, l = c.length;
                                        for (i = 0; i < l; i++) {
                                            e = c[i];

                                            var feed_id = e['primaryKey'];

                                            (function (feed_id) {
                                                that.Storage.get_list(
                                                    'events',
                                                    " AND feed_id = " + feed_id,
                                                    true,
                                                    function (c) {
                                                        var countsNew = 0;
                                                        for (var j = 0; j < c.length; j++) {
                                                            countsNew += c[j]['New'];
                                                        }

                                                        var listUpdate = [{
                                                            'primaryKey': feed_id,
                                                            'counts': c.length,
                                                            "countsNew": countsNew
                                                        }];

                                                        var fields = ["counts", "countsNew"];
                                                        that.Storage.table_update(listUpdate, 'feeds', true, fields, "primaryKey", function () { });
                                                    }
                                                );

                                            })(feed_id);

                                        }
                                    }
                                );
                            }
                        );

                    }

                    if (0) {

                        that.Storage.folders_get(
                            '',
                            function (c) {
                                that.Storage.feeds_get(
                                    ' AND p.event_id = 0 AND p.deleted = 0',
                                    function (fc) {

                                        var countsAll = 0;
                                        var countsNew = 0;

                                        var fcountsAll, fcountsNew;

                                        var listUpdate = [];

                                        var i, e, l = c.length;
                                        for (i = 0; i < l; i++) {
                                            e = c[i];

                                            var folder_id = e['primaryKey'];

                                            fcountsAll = 0;
                                            fcountsNew = 0;

                                            for (var j = 0; j < fc.length; j++) {
                                                if (fc[j]['folder_id'] == folder_id) {
                                                    fcountsAll += fc[j]['counts'];
                                                    fcountsNew += fc[j]['countsNew'];
                                                }
                                            }
                                            countsAll += fcountsAll;
                                            countsNew += fcountsNew;

                                            if (e['root_id']) {
                                                listUpdate.push({
                                                    'primaryKey': folder_id,
                                                    'counts': fcountsAll,
                                                    "countsNew": fcountsNew
                                                });
                                            }

                                        }

                                        listUpdate.push({
                                            'primaryKey': 1,
                                            'counts': countsAll,
                                            "countsNew": countsNew
                                        });

                                        var fields = ["counts", "countsNew"];
                                        that.Storage.table_update(listUpdate, 'folders', true, fields, "primaryKey", function () { });
                                    }
                                );
                            }
                        );

                    }










                    //callback();
                });
            });
        });

        that.icon_may_draw = 1;
    },

    load_some_elements: function (callback) {
        var that = this;

        var cronList = [];

        var is_loaded_needed_elements = that.Storage.get_element_value('is_loaded_needed_elements');
        if (!is_loaded_needed_elements) {

            var initFolders = [
                {
                    "primaryKey": -1,
                    "root_id": 0,
                    "title": "All feeds",
                    "feed_counts": 0,
                    "counts": 0,
                    "countsNew": 0,
                    "type": 0,
                    "activePage": 1,
                    "subscribe": 1,
                    "is_close": 0,
                    "orderBy": 0,
                    "timeAdd": that.getCurrentTime(),
                    "timeUpdate": 0
                },

                {
                    "primaryKey": 1,
                    "root_id": 0,
                    "title": "Folders",
                    "feed_counts": 3,
                    "counts": 0,
                    "countsNew": 0,
                    "type": 0,
                    "activePage": 1,
                    "subscribe": 1,
                    "is_close": 0,
                    "orderBy": 0,
                    "timeAdd": that.getCurrentTime(),
                    "timeUpdate": 0
                }
                /*
              , {
                  "primaryKey" : 2,
                  "root_id" : 1,
                  "title" : "Internet",
                  "feed_counts" : 1,
                  "counts" : 0,
                  "countsNew" : 0,
                  "type" : 0,
                  "activePage" : 1,
                  "subscribe" : 1,
                  "is_close" : 0,
                  "orderBy" : 1,
                  "timeAdd" : that.getCurrentTime(),
                  "timeUpdate" : 0
              }
              */
            ];
            that.Storage.insert_msgs('folders', initFolders, function (results) { });

            var initFeeds = [];

            /*[
                {
                    "link" : "http://habrahabr.ru/rss/best/",
                    "folder" : "Internet",
                    "title" : "Habrahabr - best"
                },
                {
                    "link" : "http://roem.ru/rss/group/news/",
                    "folder" : "`~`",
                    "title" : "Roem - news"
                },

                {
                    "link" : "http://www.gismeteo.ru/news/rss/",
                    "folder" : "`~`",
                    "title" : "Weather news"
                },

                {
                    "link" : "http://feeds.feedburner.com/GoogleOperatingSystem",
                    "folder" : "Internet",
                    "title" : ""
                },

                {
                    "link" : "http://kgyeong.co.vu/rss",
                    "folder" : "Internet",
                    "title" : ""
                },

                {
                    "link" : "http://slon.ru/rss/xml/all.xml",
                    "folder" : "Internet",
                    "title" : ""
                }
            ];
            */

            var i, e, text;
            for (i = 0; i < initFeeds.length; i++) {
                e = initFeeds[i];

                text = [];
                text.push(e.folder);
                text.push(e.link);
                text.push(e.title);

                cronList.push({
                    "eventKey": 0,
                    "msgType": "opml_import",
                    "objectType": 0,
                    "timeNextUpdate": that.getCurrentTime() - 5,
                    "tryCount": 10,
                    "priority": 10,
                    "url": JSON.stringify(text),
                    "datetime": 3600 * 24 * 6
                });
            }

            var install_time = that.Storage.get_element_time('install_time');
            if (!install_time) {
                that.Storage.set_element_time('install_time', that.getCurrentTime());
            }
            that.Storage.set_element_value('is_loaded_needed_elements', 1);
        } else {
        }

        cronList.push({
            "eventKey": 0,
            "msgType": "clear",
            "objectType": 0,
            "timeNextUpdate": that.getCurrentTime() + that.clearFromOldThingsTime,
            "tryCount": 10,
            "priority": 10,
            "url": '',
            "datetime": 0
        });

        that.Storage.cron_update(cronList, function () {
            callback(is_loaded_needed_elements);
        });
    },

    cron_lock_clear: function (onlyTimer) {
        onlyTimer = onlyTimer || false;

        var that = this;
        if (that.cron_lock_timer) {
            that.timer.clearTimeout(that.cron_lock_timer);
            that.cron_lock_timer = null;
        }
        if (!onlyTimer) {
            that.cron_lock = false;
        }
    },

    //!!! вводить параметр, которые запросы работают с паузой, а которые нет
    cron_params: {
        "clear": {
            "notify": 0,
            "popup": 0,
            "next": 1
        },

        "rss_load": {
            "notify": 1,
            "popup": 1,
            "next": 1
        },

        "img_load": {
            "notify": 0,
            "popup": 0,
            "next": 0
        },

        "event_del": {
            "notify": 0,
            "popup": 0,
            "next": 0
        },

        "img_del": {
            "notify": 0,
            "popup": 0,
            "next": 0
        },

        "rss_import": {
            "notify": 1,
            "popup": 1,
            "next": 0
        },

        "opml_import": {
            "notify": 0,
            "popup": 1,
            "next": 0
        }
    },

    cron_getKeyFields: function (item) {
        var keyFields = ["msgType", "eventKey"];
        if (item.msgType == 'rss_import' || item.msgType == 'opml_import') {
            keyFields.push("url");
        }
        return keyFields;
    },

    cron_ok_next: function (item, is_need_next) {
        var that = this;

        var keyFields = this.cron_getKeyFields(item);

        var o = this.cron_params[item.msgType];

        if (o.popup) {
            //that.port_sendMessage({"doing": "popUp_Refresh", "type" : item.msgType, "eventKey" : item.eventKey, "item" : item});
        }

        if (o.notify) {
            //that.notify_add(item.msgType);
        }

        if (o.next) {
            var cronList = [];

            var timeNextUpdate4msgType = {
                "clear": that.clearFromOldThingsTime,
                "rss_load": that.timeToLoad_rss,
                "rss_import": 1,
                "opml_import": 1
            };

            var timeNextUpdate = timeNextUpdate4msgType[item.msgType];
            if (timeNextUpdate && item.timeNextUpdate + timeNextUpdate < that.getCurrentTime() + timeNextUpdate - that.cron_timer_value) {
                timeNextUpdate += that.getCurrentTime();
            } else {
                timeNextUpdate += item.timeNextUpdate;
            }
            item.timeNextUpdate = Math.round(timeNextUpdate);

            if (typeof item['timeNextUpdate_set'] != 'undefined' && item['timeNextUpdate_set']) {
                item['timeNextUpdate'] = item['timeNextUpdate_set'];
            }

            cronList.push(item);

            that.Storage.update_msgs('cron', cronList, true, keyFields, function (result) {
                that.cron_lock_clear();
                that.cron();
            });

        } else {
            delete item.objectKey;

            that.Storage.delete_msgs('cron', [item], true, keyFields, function (result) {
                that.cron_lock_clear();
                that.cron();
            });
        }
    },

    cron_ok: function (item, is_need_next) {
        var that = this;
        that.cron_ok_next(item, is_need_next);
    },

    cron_error: function (item, deleteItem) {
        var that = this;
        deleteItem = deleteItem || false;

        var o = this.cron_params[item.msgType];

        var keyFields = this.cron_getKeyFields(item);

        if (!o.next) { //!!!?
            item.tryCount--;
        }

        if ((deleteItem || item.tryCount < 0) && !o.next) {

            this.Storage.delete_msgs('cron', [item], true, keyFields, function () {
                that.cron_lock_clear();
                that.cron();
            });

            return;
        }

        if (item.tryCount < 0) {
            item.tryCount = 0;
        }

        var timeAdd = (1 || !o.next) ? this.cron_timeAdd2tryCount[item.tryCount] : this.cron_timeAdd2tryCount[9];
        item.timeNextUpdate = that.getCurrentTime() + timeAdd;

        delete item.primaryKey;

        this.Storage.update_msgs('cron', [item], true, keyFields, function (result) {
            that.cron_lock_clear();
            that.cron();
        });
    },

    cron: function () {
        var that = this;

        if (that.cron_lock) return;

        that.cron_lock = true;

        this.Storage.search_msgs(
            "cron",
            "",
            " AND (strftime('%s','now')-timeNextUpdate > 0) ", //!!! AND msgType = 'img_load'
            " ORDER BY p.timeNextUpdate DESC, p.priority ASC",
            true,
            1, 1,
            true,
            0,
            function (c) {

                if (c.length) {
                    var item = c[0];

                    that.funcs.mprint(item);

                    that.cron_lock_clear(true);

                    that.cron_lock_timer = that.timer.setTimeout(function () {
                        that.cron_lock = false;
                    }, 180000);

                    //-------> очистка от мусора
                    if (item.msgType == 'clear') {
                        that.clear_and_move_functions();
                        that.cron_ok(item);
                    }
                    //--------
                    if (item.msgType == 'rss_load') {

                        if (that.onLine() && !that.isPause()) {

                            that.rr.rss_load(item, function (feedInfo, p2, p3, p4, LastModified, Etag, http_status, headers, responseURL) {
                                item["http_status"] = http_status;

                                if (LastModified) {
                                    item['LastModified'] = LastModified;
                                }
                                if (Etag) {
                                    item['Etag'] = Etag;
                                }
                                if (responseURL && item['url'] != responseURL) {
                                    item['url_301'] = responseURL;

                                    feedInfo['link_301'] = responseURL;
                                    var fields = that.Storage.fields2indexArray(that.Storage.tblFields['feeds']);
                                    that.Storage.table_update([feedInfo], 'feeds', true, fields, "primaryKey", function () { });

                                }

                                if (http_status >= 400 && http_status < 600) {

                                    if (0 && http_status >= 400 && http_status < 500) {
                                        item["timeNextUpdate_set"] = that.getCurrentTime() + 3600 * 24 * 30 * 12;
                                        return that.cron_ok(item);
                                    }

                                    that.cron_error(item);
                                } else {
                                    //если нет интернета или т.п., то ставим след. время на 1 час вперёд
                                    if (http_status > 0) {
                                        item["timeNextUpdate_set"] = that.rr.calc_next_load_time(feedInfo, LastModified, Etag, http_status);


                                    } else {
                                        // проверять, существует ли сайт

                                        item["timeNextUpdate_set"] = that.getCurrentTime() + 3600;
                                    }

                                    that.cron_ok(item);
                                }

                            });
                        }
                    }
                    //--------
                    if (item.msgType == 'event_del') {
                        that.rr.event_del(item, function () {
                            that.cron_ok(item);
                        });
                    }
                    //--------
                    if (item.msgType == 'img_del') {
                        that.rr.img_del(item, function () {
                            that.cron_ok(item);
                        });
                    }
                    //--------
                    if (item.msgType == 'img_load') {

                        if (that.onLine() && !that.isPause()) {
                            that.rr.img_load(item, function (imgInfo, LastModified, Etag, http_status) {
                                item["http_status"] = http_status;

                                if (LastModified) {
                                    item['LastModified'] = LastModified;
                                }
                                if (Etag) {
                                    item['Etag'] = Etag;
                                }

                                //если нет интернета или т.п., то ставим след. время на 1 час вперёд
                                if (http_status > 0) {
                                    item["timeNextUpdate_set"] = that.getCurrentTime() + 3600 * 24 * 3;

                                    that.cron_ok(item);

                                } else {
                                    item["timeNextUpdate_set"] = that.getCurrentTime() + 3600;

                                    item["http_status"] = http_status;

                                    that.cron_error(item);
                                }

                            });
                        }
                    }
                    //--------
                    if (item.msgType == 'rss_import') {
                        that.rr.rss_import('`~`', item.url, false, item.datetime, function (data) {
                            if (data['status'] == 'ok') {
                                that.connect = that.port_sendMessage({ "doing": "popUp_Refresh", "type": "rss", "sub_type": "list" }, that.connect);
                                item["timeNextUpdate_set"] = that.rr.calc_next_load_time(data['feedInfo'], data['LastModified'], data['Etag'], data["http_status"]);
                                item["http_status"] = data["http_status"];
                                that.cron_ok(item);
                            } else {
                                item["http_status"] = data["http_status"];
                                that.cron_error(item);
                            }
                        });
                    }
                    //--------
                    if (item.msgType == 'opml_import') {
                        var parsed = JSON.parse(item.url);

                        //temporary fix bug. fix in create in db row
                        if (!parsed[1]) {
                            that.cron_error(item);//!!!
                        } else {
                            that.rr.rss_import(parsed[0], parsed[1], parsed[2], item.datetime, function (data) {
                                if (data['status'] == 'ok') {

                                    //!!! that.connect = that.port_sendMessage({"doing": "popUp_Refresh_counts", "type" : "rss"}, that.connect);

                                    item["timeNextUpdate_set"] = that.rr.calc_next_load_time(data['feedInfo'], data['LastModified'], data['Etag'], data["http_status"]);
                                    item["http_status"] = data["http_status"];

                                    that.cron_ok(item);

                                } else if (data['status'] == 'import') {
                                    that.funcs.mprint(data['html_feed_list']);

                                    that.cron_error(item);//!!!

                                    //that.cron_ok(item);
                                } else {
                                    item["http_status"] = data["http_status"];
                                    that.cron_error(item);
                                }
                            });
                        }
                    }

                    c = null;
                } else {
                    c = null;
                    //del that.cron_lock = false;
                    that.cron_lock_clear();
                }
            });

    },

    notify_add: function (objectType) {
        var that = this;

        that.funcs.mprint('notify_add objectType=' + objectType);

        if (that.isNotifyMute()) {
            return;
        }

        var tbl = "events";
        var typeSql = "";

        //---------------
        var popup_update_set_read = function (primaryKey) {
            that.Storage.search_msgs(
                tbl,
                objectType,
                typeSql + " AND p.primaryKey=" + primaryKey,
                "",
                true,
                0, 0,
                true,
                0,
                function (c) {
                    if (c.length == 1) {

                        if (!c[0]['New']) return;
                        c[0]['New'] = 0;

                        that.Storage.update_msgs(tbl, c, true, null, function (result) {
                            that.calc_cache_icon_counts();
                            that.connect = that.port_sendMessage({ "doing": "popUp_Refresh", "type": objectType }, that.connect);//!!!
                        });
                    }
                    c = null;
                }
            );
        }

        if (that.notify_opened.length >= 3) return;
        var options = that.Storage.get_element_value('options');

        //------> выводим desktop notification
        this.Storage.search_msgs(
            tbl,
            objectType,
            typeSql + " AND p.notifyWasViewed = 0 AND p.New != 0 AND p.deleted = 0",
            "",
            true,
            1, 3,
            true,
            0,
            function (c) {
                if (c.length) {

                    var i, len = c.length;
                    for (i = 0; i < len; i++) {
                        if (that.notify_opened.length < 3) {

                            that.notify_opened.push(c[i]['primaryKey']);

                            (function () {
                                var params = '';

                                var objectType_ = objectType;

                                var ci = c[i];

                                var title = "";
                                var message = "";
                                var messageLong = "";
                                var iconUrl = "";

                                if (objectType == 'events') {

                                    //'&date='+encodeURIComponent(ci['datetime'])+
                                    //'&url_file='+encodeURIComponent(!ci['gallery_file_url'] ? '' : ci['gallery_file_url'])+
                                    //'&href='+encodeURIComponent(ci['href'])+

                                    title = ci['us_name'];
                                    iconUrl = ci['gallery_item_url'];
                                    message = ci['text'];
                                    messageLong = ci['full_text'];
                                }

                                var primaryKey = ci['primaryKey'];
                                var notifyOptions = {
                                    title: title,
                                    iconUrl: iconUrl,

                                    type: "basic", //Chrome
                                    message: message,
                                    priority: 1,
                                    expandedMessage: messageLong,

                                    text: message, //FF
                                    data: primaryKey
                                };

                                that.funcs.mprint(notifyOptions);

                                if (!that.isFF) {
                                    that.funcs.mprint('CREATE NOTIFY');
                                    chrome.notifications.create(primaryKey, notifyOptions, function (id) {
                                        that.funcs.mprint('CREATED ID = ' + id);
                                    });

                                    /*
                                    var notify_display_timer = null;
                                    var notify_pop = function() {
                                        var j = that.notify_opened.indexOf(primaryKey);
                                        if (j != -1) {
                                            that.notify_opened.splice(j, 1);
                                        }
                                    }

                                    notify.ondisplay = function() {
                                        notify_display_timer = that.timer.setTimeout(function() {
                                            notify.onclose = null;
                                            notify_pop();
                                            notify.cancel();
                                            that.notify_add(objectType_);
                                        }, 15000);
                                    }

                                    notify.onclose = function() {
                                        popup_update_set_read(primaryKey);
                                        notify_pop();
                                        that.notify_add(objectType_);
                                    }

                                    notify.onclick = function() {
                                        if (notify_display_timer) {
                                            that.timer.clearTimeout(notify_display_timer);
                                            notify_display_timer = null;
                                        }

                                        if (options.notify_click_open_and_close) {
                                            notify.cancel();
                                            chrome.tabs.create({url: ci['href']});
                                        }
                                    }

                                    notify.show();
                                    */
                                } else {
                                    notifyOptions['onClick'] = function (id) { };

                                    var notifications = require("sdk/notifications");
                                    notifications.notify(notifyOptions);
                                }
                            })();

                            c[i]['notifyWasViewed'] = 1;
                        }
                    }

                    that.Storage.update_msgs(tbl, c, true, null, function () { });
                }
                c = null;
            }
        );
    },

    loadSound: function (file) {
        var that = this;

        var c = that.sounds;
        var i = this.get_el_by_field(c, "id", file);

        if (i == -1) {
            audio = new Audio();
            audio.id = file;

            audio.onerror = function () {
                console.log("sound not loaded: " + JSON.stringify(audio.error));
            };

            audio.src = "/data/sound/" + file;
            audio.load();

            c.push({
                "id": file,
                "audio": audio
            });

        } else {

        }

    },

    playSound: function (file) {
        var that = this;

        if (that.isSoundMute()) {
            return;
        }

        var c = that.sounds;
        var i = that.get_el_by_field(c, "id", file);

        if (i != -1) {
            var audio = c[i]['audio'];

            if (audio.currentTime > 0) {
                audio.pause();
                audio.currentTime = 0;
            }
            audio.play();
        }
    },

    // отправляю раз в день комментарий к файлу, для статистики
    sendStatistic: function () {
        var that = this;

        return; //!!!

        var time = that.Storage.get_element_time('timeToStatistic');

        if (!time) { //!(time > 0 && that.getCurrentTime() - time < that.timeToStatistic)
            var href = '';
            var element = {
                "href": href
            };

            var text = 'Ver: ' + that.version;
            if (!that.isFF) {
                text += ', UA: ' + navigator.userAgent;
            } else {
                var system = require("sdk/system");
                text += ', US: ' + system.name + '; ' + system.platform +
                    ', ' + system.architecture +
                    ', ' + system.build +
                    ', ' + system.version +
                    ', ' + system.vendor;
            }

            that.sendMessage(element, text, function () {
                that.Storage.set_element_time('timeToStatistic', that.getCurrentTime());
            }, function () { });
        }
    },











    /**
     * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
     * headers according to the format described here:
     * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
     * This method parses that string into a user-friendly key/value pair object.
     */
    parseResponseHeaders: function (headerStr) {
        var headers = {};
        if (!headerStr) {
            return headers;
        }
        var headerPairs = headerStr.split('\u000d\u000a');
        for (var i = 0; i < headerPairs.length; i++) {
            var headerPair = headerPairs[i];
            // Can't use split() here because it does the wrong thing
            // if the header value has the string ": " in it.
            var index = headerPair.indexOf('\u003a\u0020');
            if (index > 0) {
                var key = headerPair.substring(0, index);
                key = key.toLowerCase();

                var val = headerPair.substring(index + 2);
                headers[key] = val;
            }
        }
        return headers;
    },

    http_loadBlob: function (url, LastModified, Etag, handler_ok, handler_error) {
        var that = this;

        var xhr = new XMLHttpRequest();

        if (LastModified) {
            xhr.setRequestHeader("If-Modified-Since", LastModified);
        }
        if (Etag) {
            xhr.setRequestHeader("If-None-Match", Etag);
        }

        xhr.responseType = 'blob';
        xhr.onload = function () {
            handler_ok(xhr.response, xhr.getResponseHeader('Last-Modified'), xhr.getResponseHeader('Etag'), xhr.status || 0, that.parseResponseHeaders(xhr.getAllResponseHeaders()));
        };
        xhr.onerror = function () {
            handler_error();
        };

        try {
            xhr.open('GET', url);
            xhr.send();
        } catch (e) {
            handler_error();
        }
    },

    httpLoad: function (url, dataType, responseType, LastModified, Etag, handler_ok, handler_error) {
        var that = this;

        var ajaxData = {
            'url': url,
            'type': 'GET',
            "dataType": dataType,
            "responseType": responseType,
            'success': function (res, xhr) {
                //!!!!
                if (res instanceof XMLHttpRequest) { //perhaps this feature of quo
                    res = res.responseText;
                }

                if (dataType == 'html' && res) {
                    res = ('' + res).replace(/[\r\n\t]+/igm, '');
                }

                handler_ok(
                    res,
                    xhr.getResponseHeader('Last-Modified'),
                    xhr.getResponseHeader('Etag'),
                    xhr.status || 0,
                    that.parseResponseHeaders(xhr.getAllResponseHeaders()),
                    xhr.responseURL
                );
            },

            'error': function (res, xhr) {
                var status = 0;

                if (xhr) {
                    status = xhr.status;
                }

                handler_error(status);
            }
        };

        ajaxData['headers'] = {};
        if (LastModified) {
            ajaxData['headers']['If-Modified-Since'] = LastModified;
        }
        if (Etag) {
            ajaxData['headers']['If-None-Match'] = Etag;
        }

        this.$.ajax(ajaxData);
    },






    cron_insert: function (arr, callback) {
        var that = this;

        this.Storage.search_msgs(
            "cron",
            " ",
            " ",
            " ",
            true,
            0, 0,
            true,
            0,
            function (c) {
                var cAdded = [], isAdd, i, e, clen = c.length, len = arr.length;

                if (clen) {
                    for (i = 0; i < len; i++) {
                        e = arr[i];

                        if (e['msgType'] == 'users' && e['eventKey'] == 0) {
                            fields = { "msgType": e['msgType'], "objectType": e['objectType'], "url": e['url'] };
                        } else {
                            fields = { "msgType": e['msgType'], "objectType": e['objectType'], "eventKey": e['eventKey'] };
                        }

                        if (e['msgType'] == 'forums_rating') {
                            delete fields.eventKey;
                        }

                        isAdd = that.funcs.get_el_by_fields(c, fields);
                        if (isAdd == -1) {
                            cAdded.push(e);
                        }
                    }

                } else {
                    cAdded = arr;
                }

                len = cAdded.length;
                if (len) {
                    that.Storage.insert_msgs('cron', cAdded, function (results) { });
                }

                callback();
            }
        );
    },

    clear_and_move_functions: function () {
        var that = this;

        var c,
            i,
            j,
            cache,
            cache_len,
            len;

        //---> вычищать то что старше 30 дней и прочитанное
        var cur_time = that.getCurrentTime();


        var useOwn = true;

        /*
        that.Storage.folders_get(
            '',
            function(folders_list) {
                that.Storage.feeds_get(
                    ' AND p.event_id = 0 AND p.deleted = 0',
                    function(c) {

                        var i, e, l = c.length;
                        for (i=0; i < l; i++) {
                            e = c[i];

                            var feed_id = e['primaryKey'];

                            (function(feed_id){
                                that.Storage.get_list(
                                    'events',
                                    " AND feed_id = "+feed_id,
                                    true,
                                    function(c) {
                                        var countsNew = 0;
                                        for (var j=0; j < c.length; j++) {
                                            countsNew += c[j]['New'];
                                        }

                                        var listUpdate = [{
                                            'primaryKey' : feed_id,
                                            'counts' : c.length,
                                            "countsNew" : countsNew
                                        }];

                                        var fields = ["counts", "countsNew"];
                                        that.Storage.table_update(listUpdate, 'feeds', true, fields, "primaryKey", function(){});
                                    }
                                );

                            })(feed_id);
                        }


                        that.Storage.folders_get(
                            '',
                            function(c) {
                                that.Storage.feeds_get(
                                    ' AND p.event_id = 0 AND p.deleted = 0',
                                    function(fc) {

                                        var countsAll = 0;
                                        var countsNew = 0;

                                        var fcountsAll, fcountsNew;

                                        var listUpdate = [];

                                        var i, e, l = c.length;
                                        for (i=0; i < l; i++) {
                                            e = c[i];

                                            var folder_id = e['primaryKey'];

                                            fcountsAll = 0;
                                            fcountsNew = 0;

                                            for (var j=0; j < fc.length; j++) {
                                                if (fc[j]['folder_id'] == folder_id) {
                                                    fcountsAll += fc[j]['counts'];
                                                    fcountsNew += fc[j]['countsNew'];
                                                }
                                            }
                                            countsAll += fcountsAll;
                                            countsNew += fcountsNew;

                                            if (e['root_id']) {
                                                listUpdate.push({
                                                    'primaryKey' : folder_id,
                                                    'counts' : fcountsAll,
                                                    "countsNew" : fcountsNew
                                                });
                                            }

                                        }

                                        listUpdate.push({
                                            'primaryKey' : 1,
                                            'counts' : countsAll,
                                            "countsNew" : countsNew
                                        });

                                        var fields = ["counts", "countsNew"];
                                        that.Storage.table_update(listUpdate, 'folders', true, fields, "primaryKey", function(){});
                                    }
                                );
                            }
                        );


                    }
                );
            }
        );
        */

    },

    popup_options_set_default: function () {
        var popup_options = {
            "activeTab": "reader",

            "reader": {
                "show_updates_only": 1,
                "page": 1,
                "sort": "datetime",
                "filter": {
                    "activeItem": { "type": "folder", "primaryKey": 1, "folder_id": 1 }
                },
                "count": 0
            },

            "subs": {
                "page": 1,
                "sort": "time_load",
                "filter": {
                    "activeItem": { "type": "folder", "primaryKey": 1, "folder_id": 1 }
                },
                "count": 0
            }
        };

        this.Storage.set_element_value('popup_options', popup_options);
    },

    calc_cache_icon_counts: function (callback, ret) {
        var that = this;

        that.funcs.mprint('--------------- calc_cache_icon_counts ----------------------');

        var o = that.Storage.get_element_value('popup_options', {});
        if (typeof o['reader'] == 'undefined') return;

        that.Storage.get_all_counts(
            function (c) {
                var o = that.Storage.get_element_value('popup_options');

                var i, j, e, t;
                for (i in o) {
                    e = o[i];
                    for (j in e) {
                        t = e[j];
                        t['count'] = c[i + '_' + j];
                    }
                }

                that.Storage.set_element_value('popup_options', o);

                if (typeof callback != 'undefined') {
                    callback(o);
                }
            }
        );

        that.Storage.get_msgs_count_new(
            function (counts) {
                that.icon_counts = counts;
            }
        );
    },

    getIcon_fullPath: function (iconName) {
        return "/data/icons/" + iconName + this.iconFormat;
    },

    setIcon: function (iconName) {
        var that = this;

        if (iconName == that.icon_old) {
            return false;
        }

        var fullPath = that.getIcon_fullPath(iconName);

        if (this.isChrome) {
            chrome.browserAction.setIcon({ path: fullPath });
        }

        if (this.isFF) {
            //that.browserAction.button.content = '<img src="'+that.FF.data.url(fullPath.substr(6))+'" />';
        }

        that.icon_old = iconName;
    },

    setBadgeText: function (data, iconName) {
        var that = this;

        if (data.text == that.text_old && data.color == that.text_color_old) {
            return false;
        }

        var text = data.text;
        if (text >= 1000) {
            text = '999+';
        }

        if (this.isChrome) {
            chrome.browserAction.setBadgeBackgroundColor({ color: data.color });
            chrome.browserAction.setBadgeText({ text: text });
        }

        if (this.isFF) {
            var width = 20;
            var fullPath = that.getIcon_fullPath(iconName);
            var colors = [data.color[0], data.color[1], data.color[2]];
            var content = [];
            content.push('<img src="' + that.FF.data.url(fullPath.substr(6)) + '" style="width:19px; display:inline-block;" />');
            if (text) {
                content.push('<b style="display:inline-block;position:relative; top:-5px; left:1px; font-size: 10px; color:#ffffff; background:rgb(' + colors.join(',') + '); box-shadow: inset 0 1px rgba(255, 255, 255, 0.3), 0 1px 1px rgba(0, 0, 0, 0.08); text-shadow: 0 1px rgba(0, 0, 0, 0.25); padding:0 3px; border-radius:4px;">' + text + '</b>');
            }
            width += 24;
            that.browserAction.button.content = '<div style="position:relative; top:-2px; cursor:default; white-space:nowrap;">' + content.join('') + '</div>';
            that.browserAction.button.width = width;
        }

        that.text_old = data.text;
        that.text_color_old = data.color;
    },

    setBadgeTitle: function (title) {
        var that = this;

        if (title == that.badge_title_old) {
            return false;
        }

        title = title + '';

        if (this.isChrome) {
            chrome.browserAction.setTitle({ title: title });
        }

        if (this.isFF) {
            that.browserAction.button.tooltip = title;
        }

        that.badge_title_old = title;
    },

    isPause: function () {
        var isPause = false;

        isPause = this.Storage.get_element_value('isPause');

        var curdate = new Date();
        var ch = curdate.getHours();
        var cm = curdate.getMinutes();

        if (!(ch >= 0 && ch < 7)) {
            //!!! isPause = true;
        }


        return isPause;
    },

    isSoundMute: function () {
        var that = this;
        var options = that.Storage.get_element_value('options');

        return !parseInt(options['is_sound_on']);
    },

    isNotifyMute: function () {
        var that = this;
        var options = that.Storage.get_element_value('options');

        return !parseInt(options['is_notify_on']);
    },

    redraw_icon: function () {
        var that = this;

        var c, len, i, icon;

        var options = this.Storage.get_element_value('options');

        if (that.icon_may_draw) {

            if (1 || !that.isPause()) { //!!! not logged, change

                var counts = that.icon_counts;

                if (!counts) {
                    that.calc_cache_icon_counts(function () { }, true);
                } else {
                    var title = "";
                    var text = "";

                    var new_msgs_count_rss = counts['rssCount'];

                    if (new_msgs_count_rss > 0) {

                        if (new_msgs_count_rss == 1) {
                            title += '1 новое событие';
                        } else {
                            title += '' + new_msgs_count_rss + ' новых событий';
                        }

                    } else {
                        //title += 'Нет новых личных сообщений';
                    }
                    var new_msgs_count = {
                        '': (!new_msgs_count_rss ? 0 : 1),
                        'rss': new_msgs_count_rss
                    };

                    var iconSet = '';
                    if (
                        new_msgs_count[iconSet] == 1
                    ) {

                        if (!that.icon_current) {
                            iconSet = '';
                        } else {
                            var j, k;

                            j = that.icon_list.indexOf(that.icon_current);
                            k = j;

                            while (1) {
                                j++;
                                if (j >= that.icon_list.length) {
                                    j = 0;
                                }

                                if (new_msgs_count[that.icon_list[j]] > 0) {
                                    iconSet = that.icon_list[j];
                                    break;
                                }
                                if (k == j) break;
                            }
                        }

                        that.icon_current = iconSet;
                    }

                    icon = (!iconSet) ? that.img_noNewSrc : that.img_newSrc + iconSet;

                    if (that.activeTabFeedList.length) {
                        icon += that.iconHave;
                    }

                    text = (!that.icon_state || !iconSet) ? (new_msgs_count[iconSet] ? new_msgs_count[iconSet] : '') : new_msgs_count[iconSet];
                    that.icon_state = 1 - that.icon_state;

                    that.setIcon(icon);
                    that.setBadgeText({ color: that.icon_colors[iconSet], text: '' + text }, icon);
                    that.setBadgeTitle(title);
                }
            } else {

                that.setIcon(that.img_notLoggedInSrc);

                if (!that.isPause()) {
                    that.setBadgeText({ color: [190, 190, 190, 255], text: "" }, that.img_notLoggedInSrc);
                    that.setBadgeTitle("Неактивный режим, запросов к серверу не будет");
                }
            }
        }

        that.icon_may_draw = true;

        c = null;

        if (that.redraw_icon_timer) {
            that.timer.clearTimeout(that.redraw_icon_timer);
            that.redraw_icon_timer = null;
        }

        that.redraw_icon_timer = that.timer.setTimeout(
            function () {
                that.redraw_icon();
            }
            , (!that.icon_state) ? 2000 : 1000);
    },


    isArray: Array.isArray,

    type: function (obj) {
        var class2type = {};

        if (obj == null) {
            return String(obj);
        }
        // Support: Safari <= 5.1 (functionish RegExp)
        return typeof obj === "object" || typeof obj === "function" ?
            class2type[this.core_toString.call(obj)] || "object" :
            typeof obj;
    },

    isWindow: function (obj) {
        return obj != null && obj === obj.window;
    },

    core_hasOwn: {}.hasOwnProperty,
    core_toString: {}.toString,

    isPlainObject: function (obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (this.type(obj) !== "object" || obj.nodeType || this.isWindow(obj)) {
            return false;
        }

        // Support: Firefox <20
        // The try/catch suppresses exceptions thrown when attempting to access
        // the "constructor" property of certain host objects, ie. |window.location|
        // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
        try {
            if (obj.constructor &&
                !this.core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
        } catch (e) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    },

    isFunction: function (obj) {
        return this.type(obj) === "function";
    },

    extend: function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !this.isFunction(target)) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (this.isPlainObject(copy) || (copyIsArray = this.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && this.isArray(src) ? src : [];

                        } else {
                            clone = src && this.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = this.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },

    createSql: function (callback) {
        var that = this;

        var tblCreated = that.Storage.get_element_value('tblCreated');
        tblCreated = (tblCreated + '').split(/,/i);
        if (!tblCreated[0]) tblCreated.shift();

        //---> создаю таблицы
        that.Storage.db.transaction(
            function (tx) {

                var tbl, tblFields, i, len, e;
                var tblFieldsAll = that.Storage.tblFields;

                for (tbl in tblFieldsAll) {
                    if (tblCreated.indexOf(tbl) != -1) continue;

                    tblFields = tblFieldsAll[tbl];

                    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + tbl + ' (' + that.Storage.sql_fields_for_create_get(tblFields) + ');');

                    //------- создаю индексы
                    len = tblFields.length;
                    for (i = 0; i < len; i++) {
                        e = tblFields[i];
                        if (typeof e.index == 'undefined') continue;
                        tx.executeSql('CREATE INDEX IF NOT EXISTS ' + tbl + '_' + e.name + ' ON ' + tbl + '(' + e.name + ');');
                    }

                    tblCreated.push(tbl);
                }

                that.Storage.set_element_value('tblCreated', tblCreated.join(','));
                return callback();
            }
        );
    },

    onLine: function () {
        return navigator.onLine;
    },

    changeSql: function (callback) {
        var that = this;

        var OwnUserId = 0;

        //---> меняю таблицы в зависимости от номеров версии
        var versionDB = parseFloat(that.Storage.getVersion());
        if (versionDB && that.version != versionDB) {

            var version, sqlArr, sql, i, tbl, val, tbl_tmp, tblFields;
            var tblFieldsAll = that.Storage.tblFields;

            for (version in that.change_sql_list) {
                sqlArr = that.change_sql_list[version];

                version = parseFloat(version);
                if (version > versionDB && sqlArr.length) {
                    for (i = 0; i < sqlArr.length; i++) {

                        (function () {
                            var sql = sqlArr[i];

                            sql = sql.replace(/\{\$OwnUserId\}/ig, OwnUserId);

                            that.Storage.db.transaction(
                                function (tx) {
                                    var len, i, e;

                                    if (sql.indexOf('RECREATE ') != -1) {
                                        tbl = sql.match(/^\s*RECREATE\s+(.*?)\s*$/i);
                                        if (tbl && tbl[1]) {
                                            tbl = tbl[1];

                                            tbl_tmp = tbl + that.getCurrentTime();

                                            tx.executeSql("ALTER TABLE " + tbl + " RENAME TO " + tbl_tmp + "");

                                            tblFields = tblFieldsAll[tbl];

                                            tx.executeSql('CREATE TABLE IF NOT EXISTS ' + tbl + ' (' + that.Storage.sql_fields_for_create_get(tblFields) + ');');

                                            len = tblFields.length;
                                            for (i = 0; i < len; i++) {
                                                e = tblFields[i];
                                                if (typeof e.index == 'undefined') continue;
                                                tx.executeSql('CREATE INDEX IF NOT EXISTS ' + tbl + '_' + e.name + ' ON ' + tbl + '(' + e.name + ');');
                                            }

                                            tx.executeSql("INSERT INTO " + tbl + " SELECT " + that.Storage.sql_fields_for_insert_get(tblFields) + " FROM " + tbl_tmp + ";");
                                            tx.executeSql("DROP TABLE " + tbl_tmp + ";");
                                        }
                                    } else if (sql.indexOf('RECREATEINDEX ') != -1) {
                                        tbl = sql.match(/^\s*RECREATEINDEX\s+(.*?)\s*$/i);
                                        if (tbl && tbl[1]) {
                                            tbl = tbl[1];

                                            tblFields = tblFieldsAll[tbl];

                                            len = tblFields.length;
                                            for (i = 0; i < len; i++) {
                                                e = tblFields[i];
                                                if (typeof e.index == 'undefined') continue;
                                                tx.executeSql('CREATE INDEX IF NOT EXISTS ' + tbl + '_' + e.name + ' ON ' + tbl + '(' + e.name + ');');
                                            }

                                        }

                                    } else if (sql.indexOf('SETFLAG ') != -1) {
                                        tbl = sql.match(/^\s*SETFLAG\s+(.*?)\s+(\d+)\s*$/i);
                                        if (tbl && tbl[1]) {
                                            val = parseInt(tbl[2]);
                                            tbl = tbl[1];
                                            that.Storage.set_element_value(tbl, val);
                                        }

                                    } else {
                                        tx.executeSql(sql);
                                    }

                                }
                            );
                        })();

                    }
                }
            }

            that.Storage.setVersion(that.version);
            return callback();

        } else {
            that.Storage.setVersion(that.version);
            callback();
        }
    }
};

if (typeof chrome != 'undefined') {
    Core.preInit(chrome.extension.getBackgroundPage().Storage);
}


if (typeof exports != 'undefined') {
    exports.init = function () {
        return Core;
    };
}
