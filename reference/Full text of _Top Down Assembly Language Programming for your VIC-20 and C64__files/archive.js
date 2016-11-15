
(function( $ ) {
  var TILE_WIDTH       = 180; // NOTE: needs to stay in sync w/ archive.less
  var TILE_WIDTH_SMALL = 150; // NOTE: needs to stay in sync w/ archive.less

  var ua=navigator.userAgent;
  // (global) variable memnonic: Archive JS
  window.AJS = {
    ios:(ua.indexOf('iPhone')>0  ||
         ua.indexOf('iPad')>0  ||
         ua.indexOf('iPod')>0)
  };


  // convenient, no?
  // Stateless function, global to all methods
  var log = function(){
    if (typeof(console)=='undefined')
      return;
    if (location.host.substr(0,4)!='www-')
      return;
    console.log(arguments);
  };


  AJS.tvAD = function(elm){
    var in_show = $(elm).parents('.shows');

    if (in_show.length){
      // see if we've already gotten and displayed the "Air date" section...
      var opened = $(elm).parent().find('.shows');
      if (opened.length){
        // ... yes, simply close/open it
        opened.toggle();
        return false;
      }
      var chan = in_show.attr('data-chan');
      var show = $(elm).text();
    }
    else{
      var chan = $(elm).text();
      var id = 'menu-chan-'+chan;
      var div = $('#'+id);
      if (div.length){
        div.toggle();
        return false;
      }
    }

    var url = location.href + '?channel='+chan;
    if (in_show.length)
      url += '&program='+encodeURIComponent(show);
    log(url);

    $.get(url, function(htm){
      if (in_show.length)
        $(elm).parent().append('<div data-chan="'+chan+'" class="shows"><h5>Air date</h5><div>'+htm+'</div></div>');
      else
        $(elm).parent().append('<div id="'+id+'" data-chan="'+chan+'" class="shows"><h4>Show</h4><div>'+htm+'</div></div>');
    });

    return false;
  };


  AJS._check_results_for_dupe = function(){
    var n=0;
    var map={};
    $('.ikind.in  .results:visible  .item-ia').each(function(k,v){
      n++;
      var id=$(v).attr('data-id');
      if (typeof(map[id])=='undefined') map[id]=1;
      else{
        map[id]++;
        log('DUPE '+id);
      }
    });
    log('CHECKED: '+n);
  };



  // UGH!  we ideally want any logged in user *without* a profile pic, who gets
  // the anon person image (/images/person.png) in their nav, to have "ghost" class
  // to gray it out and make it bright white (only) on hover).
  // However, we do *not* want that if they *do* have a (custom) profile pic.
  // Tricky to know!  So use AJAX to fetch both and compare bytes (effectively)...
  AJS.mypic = function(img){
    var $img=$(img);
    var url="/images/person.png";
    log('get '+url);

    $.get(url, function(data1){
      var url = $img.attr('src');
      log('get '+url);

      $.get(url, function(data2){
        if (data1==data2){
          log('equal');
          $img.addClass('ghost');
        }
      });
    });
  };



  AJS.nav_tophat_setup = function(){

    if (AJS.isTouchDevice())
      $('body').addClass('touch');
    else
      AJS.about();


    // TV items, TV top page, and TV 9/11 grid pages have top position:fixed div elements.
    // So, they arent compatible yet w/ the "nav tophat".
    if ($('body').hasClass('nav-tophat-over')){
      var navHT = false;
      var styles = {'#nav-tophat':'',
                    '.navbar':''};
      $('#nav-tophat').on('show.bs.collapse', function(){
        // save out any current style="..." attr in each element we gonna adjust to open nav tophat
        // so that we can revert back when nav tophat closes
        if (navHT===false){
          for (var i in styles)
            styles[i] = $(i).attr('style');
        }

        var tmp = $('#nav-tophat').css({'position':'fixed','width':'100%','z-index':10000001,'top':0}).outerHeight();
        if (navHT===false)
          navHT = tmp;
        $('.navbar').css({'position':'fixed','width':'100%','z-index':10000000,'top':0,'padding-top':navHT});
      }).on('shown.bs.collapse', function(){
        // "sm" width size *can* make some nav tophat text re-flow to 2 lines and push height down...
        var max = Math.max.apply(Math, $('#nav-tophat .fivecolumns .posrel').map(function(k,v){return $(v).height();}));
        if (max > navHT){
          //console.log('max',navHT,max);
          navHT = max;
          $('.navbar').css({'padding-top':navHT});
        }
      }).on('hide.bs.collapse', function(){
        $('.navbar').css({'padding-top':0});
      }).on('hidden.bs.collapse', function(){
        // revert each element's style attr
        for (var i in styles)
          $(i).attr('style', (typeof(styles[i])=='undefined' ? '' : styles[i]));
      });
    }


    $('#nav-tophat')
      .on('show.bs.collapse',function(){ $('#navwrap1').addClass   ('hatted'); })
      .on('hide.bs.collapse',function(){ $('#navwrap1').removeClass('hatted'); })


    $('.navbar a.navia-link').on('click', function(evt){
      // are we in "mobile nav / xs width" mode?
      var xs=($('#nav-tophat-helper:visible').length ? false : true);
      var hat_open = $('#nav-tophat').hasClass('in');
      var navlink=this;

      var mt = $(evt.target).attr('data-top-kind');//user hit text
      if (!mt)
        mt = $(evt.currentTarget).attr('data-top-kind'); //user hit icon


      if (!(xs  &&  hat_open  &&  isnow!=mt)){
        // show the links for mediatype clicked
        $('.toprow').hide();
        $('.toprow.'+mt).show();
      }


      if (!hat_open){
        $('#nav-tophat').collapse('show'); // .. top hat is *not* open.  clicked, so open tophat

        if (AJS.tophat_dont_count_first_open){
          delete AJS.tophat_dont_count_first_open;
        }
        else{
          // log that a user has opened the nav tophat, yayz
          if (typeof(archive_analytics) != "undefined") {
            archive_analytics.send_ping({
              'service':'ao_2',
              'kind':'event',
              'ec':'page_action',
              'ea':'nav_tophat_galactica',
              'el':location.pathname,
              'cache_bust':Math.random()
            });
          }
        }
      }


      var isnow = $('.navbar .dropdown-ia.hatted a').attr('data-top-kind');
      if (typeof(isnow)!='undefined')
        log('isnow '+isnow);
      log('shouldB '+mt);

      if (isnow == mt){
        // 2nd click on same mediatype dropdown -- close tophat!
        $('#nav-tophat').collapse('hide');
        return false;
      }

      if (xs  &&  hat_open  &&  isnow!=mt){
        // Mobile/xs nav and user has clicked on *another* nav/MT icon.
        // So we want to (animate) close the tophat, and when closed,
        // reopen (animate) to the right open tophat -- this is because
        // mobile/xs makes the tophat heights much more arbitrary
        // and it looks weird hard jumping to other open area at another height!
        $('#nav-tophat').one('hidden.bs.collapse', function(){
          setTimeout(function(){ $(navlink).click(); }, 100);
        });
        $('#nav-tophat').collapse('hide');
        return false;
      }



      $('.navbar .dropdown-ia').removeClass('hatted').has('.'+mt).addClass('hatted');
      $('#nav-tophat').on('hidden.bs.collapse', function(){ $('.navbar .dropdown-ia').removeClass('hatted'); });


      // any click makes tophat hide...
      $(document).one('click.tophat.nixer', function(evt){
        var $e = $(evt.target);
        //console.log($e);
        if ($e.attr('id')=='nav-wb-url')
          return; // ... except clicking on wayback machine form input
        if ($e.is('a'))
          return; // ... except clicking on a link
        if ($e.hasClass('item-img')  ||  $e.hasClass('item-ia'))
          return;


        var $hat=$('#nav-tophat');
        // THIS DOESNT QUITE WORK ACTUALLY...
        /* now see if the user clicked above or below the (now open tophat) nav
        log('eot: '+$e.offset().top);
        log($hat.offset().top + $hat.outerWidth());
        if ($e.offset().top > ($hat.offset().top + $hat.outerWidth()))
          return;
        */


        if ($hat.hasClass('in'))
          $hat.collapse('hide');
      });

      return false;
    });
  };


  AJS.isTouchDevice = function(){
    return ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
  };


  AJS.footer = function(){

    if (!AJS.isTouchDevice()  &&  typeof($)!='undefined'  &&  typeof($.fn.tooltip)!='undefined'){
      $('.navbar [data-toggle="tooltip"], .container-ia [data-toggle="tooltip"]').tooltip({});
      //$('body').addClass('glyphs-as-text');
    }
  };




  AJS.wrapdark_watcher = function(){ //no longer needed/used but has some handy techniques...
    if (!AJS.$sharedown){
      AJS.$sharedown = $('#sharedown');
      AJS.$wrapdark  = $('#wrapdark');
    }

    // every second, sigh, check/adjust for the wrapdark height
    if (!AJS.wrapdark_watcher_ptr)
      AJS.wrapdark_watcher_ptr = setInterval(AJS.wrapdark_watcher, 1000);

    if (!AJS.$sharedown.length  ||  !AJS.$wrapdark.length){
      clearInterval(AJS.wrapdark_watcher_ptr);
      return;
    }

    var wrapdarkHT = AJS.$sharedown.offset().top + AJS.$sharedown.find('.panel-heading').innerHeight();
    if (parseInt(AJS.$wrapdark.css('height'),10)!=wrapdarkHT){
      AJS.$wrapdark.css({height:wrapdarkHT}).show();
      log('       WRAPDARK-ED to '+wrapdarkHT);
    }
  };


  AJS.flash_click = function(flashy){
    if (flashy)
      $.cookie('avpref2',null,{path:'/'});
    else
      $.cookie('avpref2','flash',{path:'/'});

    window.top.location.href=location.href;
    return false;
  };


  AJS.mute_click = function(){
    var mess = typeof(JSMESS)!='undefined';
    var dos  = typeof(DOSBOX)!='undefined';

    var mutedNOW = !$.cookie('unmute');


    if (mess){
      if (!((JSMESS  &&  JSMESS.sdl_pauseaudio)  ||  typeof(_SDL_PauseAudio)!='undefined')){
        alert('This button only works once the emulation is running');
        return false;
      }
      if (mutedNOW){
        (JSMESS.sdl_pauseaudio  &&  JSMESS.sdl_pauseaudio(0))  ||  (_SDL_PauseAudio  &&  _SDL_PauseAudio(0));
      }
      else{
        (JSMESS.sdl_pauseaudio  &&  JSMESS.sdl_pauseaudio(1))  ||  (_SDL_PauseAudio  &&  _SDL_PauseAudio(1));
      }
      alert('Page requires reload for un/mute to take effect');
    }
    else if (dos){
      if (mutedNOW){
        (typeof(_SDL_PauseAudio)!='undefined'  &&  _SDL_PauseAudio(0));
      }
      else{
        (typeof(_SDL_PauseAudio)!='undefined'  &&  _SDL_PauseAudio(1));
      }
      alert('Page requires reload for un/mute to take effect');
    }
    else{
      var player = jwplayer('jw6');
      if (player){
        var volnow = player.getVolume();
        if (volnow != 0){
          AJS.mute_click_prior_volume = volnow;
          player.setVolume(0);
        }
        else{
          player.setVolume(typeof(AJS.mute_click_prior_volume)=='undefined' ? 100 : AJS.mute_click_prior_volume);
        }
      }
    }



    $('#theatre-ia .iconochive-mute, #theatre-ia .iconochive-unmute').toggle();


    if (mutedNOW){
      // sounds is off.  make it loud
      $.cookie('unmute', 1, { path:'/details', expires:30});
    }
    else{
      // sounds is on.  mute it!
      $.cookie('unmute', null, { path:'/details'});
    }


    return false;
  };


  AJS.emulate_setup = function(game){
    game.toString = function(){ return game.path; };
    AJS.emulator = new IALoader($('#canvas').get(0), game, null,
                                (game.scale ? parseFloat(game.scale) : 1),
                                (game.module.indexOf('dosbox') == 0 ? '/images/dosbox.png' : '/images/mame.png'));


    $('#theatre-ia .iconochive-unmute, #theatre-ia .iconochive-mute').hide();
    if ($.cookie('unmute'))
      $('#theatre-ia .iconochive-unmute').show();
    else
      $('#theatre-ia .iconochive-mute').show();

    AJS.theatre_controls_position();
    $(window).on('resize  orientationchange', function(evt){
      $.doTimeout('AJS.theatre_controls_position'+evt.type, 250, AJS.theatre_controls_position);
    });

  };


  AJS.emulate = function(){
    // move the virtual keyboard thing and give it a "go away!" button
    $('.ui-keyboard').prepend('<button style="position:relative;top:-5px;right:-8px;" type="button" class="close" onclick="$(\'.ui-keyboard\').removeClass(\'showing\').hide();" aria-hidden="true"><span class="iconochive-remove-circle"></span></button>').appendTo($('#emulate .posrel')).addClass('showing');

    $('#jsmessSS').fadeOut('slow');
    $('#canvasholder').css('visibility','visible');
    AJS.emulator.start();

    // setup the theatre-ia fullscreen button
    var EM = (JSMESS ? JSMESS : (DOSBOX ? DOSBOX : false));
    if (EM  &&  (canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen || canvas.requestFullScreen)){
      $('#gofullscreen').on('click', function(){ Module.requestFullScreen(1,0); });
      /**/ if ('onfullscreenchange'       in document){ document.addEventListener('fullscreenchange',       EM.fullScreenChangeHandler); }
      else if ('onmozfullscreenchange'    in document){ document.addEventListener('mozfullscreenchange',    EM.fullScreenChangeHandler); }
      else if ('onwebkitfullscreenchange' in document){ document.addEventListener('webkitfullscreenchange', EM.fullScreenChangeHandler); }
    }

    // resize embeds to "vertically center"
    if ($('body').hasClass('embedded')){
      var embed_vert_center = function(){
        var blackness = $('body').height() -  $('body.embedded #emulate').height();
        if (blackness > 1){
          //console.log('blackness');
          //console.log(blackness);
          $('body.embedded #emulate').css('margin-top', blackness/2);
        }
      };
      setTimeout(embed_vert_center, 5000);
      setTimeout(embed_vert_center,10000);
      setTimeout(embed_vert_center,20000);
    }

    setTimeout(AJS.theatre_controls_position,  100);
    setTimeout(AJS.theatre_controls_position,  500);
    setTimeout(AJS.theatre_controls_position, 3000);
    setTimeout(AJS.theatre_controls_position,10000);

    return false;
  };


  AJS.theatre_controls_position = function($selector, pegTop, width, height){
    // We have lots of callers!  video, software, texts.
    // So sort out our args and where we gonna "peg"/glue things to...
    var video = (height  &&  !$selector);
    if (!video){
      if (!$selector) $selector = $('#canvas'); //software emulation
      if (!$selector.length) return; // protect against emulated embeds and undef...
      height = $selector.height();
      width  = $selector.width();
      if (typeof(pegTop)!='undefined')
        $('#theatre-controls').offset({top:pegTop});
    }
    // Subtract out the width of the controls to get total amount of black pixels
    // to the right of the theatre object.
    // We want to position the controls in the middle of the dark pixels / right gutter!
    var right_gutter_width = Math.round(($('#theatre-ia-wrap').width() - $('#theatre-controls').width() - width)/2);
    log('width: '+width);
    log('right_gutter_width: '+right_gutter_width);


    $('#theatre-controls').css({height:height, visibility:'visible', right:Math.max(20, right_gutter_width/2)});

    // calculate difference between current top and bottom of 1st and last "mid" controls
    var controlsMidH = 0;
    var $midA=$('#theatre-controls .controls-mid:visible:first');
    var $midB=$('#theatre-controls .controls-mid:visible:last');
    if ($midB.length)
      controlsMidH = ($midB.offset().top + $midB.outerHeight(false)) - ($midA.offset().top);
    else
      return;

    // calculate difference between current top and bottom of 1st and last "top" controls
    var controlsTopH = 0;
    var $topA=$('#theatre-controls .controls-top:visible:first');
    var $topB=$('#theatre-controls .controls-top:visible:last');
    if ($topB.length)
      controlsTopH = ($topB.offset().top + $topB.outerHeight(false)) - ($topA.offset().top);

    log('controlsTopH: '+controlsTopH+'; controlsMidH: '+controlsMidH);

    // So now we can more *exactly* place the mid controls, using "margin-top" to
    // space the negative space between the "top" and "mid" controls!
    // YES! this is as the Dutch would say "ant f***er" precision/picky work --
    // but once the avail height gets very short, it starts making a *big* difference...
    var usedSpace = controlsTopH + controlsMidH/2;

    $('#theatre-controls .controls-mid').css({'margin-top':Math.max(0,Math.round(height/2 - usedSpace))});
  };



  AJS.booksize = function(){
    if (!AJS.booksize_watching){
      AJS.booksize_watching = true;
      $(window).on('resize  orientationchange', function(evt){
        $.doTimeout('AJS.booksize'+evt.type, 250, AJS.booksize);
      });
    }

    var aspect = 4/3.0;
    var metadataHeight = 100; //metadata peekaboo min height!

    var maxH=$(window).height() - $('#texty').offset().top - metadataHeight;
    var maxW=$('#texty').width();
    log('max rect avail: '+maxW+'x'+maxH);

    var vidW, vidH;
    var tries=[960,840,720,600,480,360,240,180];
    for (var idx in tries){
      vidH = tries[idx];
      vidW = Math.round(vidH * aspect);
      log('rect size try fit: '+vidW+'x'+vidH);
      if ((vidW <= maxW  &&  vidH <= maxH)  ||  vidW<=320)
        break;
    }

    // We want to vertically "center" books that are "very short" that
    // would otherwise be shorter than the new "minimum height" requirements
    // for the theatre
    var padTop = 0;
    var minH = parseInt($('#theatre-ia-wrap').css('min-height'),10);
    if (minH > vidH){
      padTop = Math.round((minH - vidH) / 2);
    }


    $("#texty iframe").css({width:vidW,height:vidH,'padding-top':padTop}); // resize bookreader


    setTimeout  (function(){ if (AJS.booksize_controls) AJS.booksize_controls();},  500);
    if (!AJS.booksize_controls_hidden){
      setTimeout(function(){ if (AJS.booksize_controls) AJS.booksize_controls();},  750);
      setTimeout(function(){ if (AJS.booksize_controls) AJS.booksize_controls();}, 1000);
      setTimeout(function(){ if (AJS.booksize_controls) AJS.booksize_controls();}, 5000);
      setTimeout(function(){ if (AJS.booksize_controls) AJS.booksize_controls();},10000);
    }
  };
  // Hides the book controls, per david!
  // Also positions the "theatre controls"
  AJS.booksize_controls = function(){

    var $iframe=$('iframe:first');
    if (!$iframe.length)
      return;
    var $iframeDOM = $($iframe.get(0).contentDocument);
    if (!$iframeDOM.length)
      return;

    if (!AJS.booksize_controls_hidden){
      if (!$iframeDOM.find('#BRnav').length){
        log('BOOK NOT READY YET');
        return;
      }

      $iframeDOM.find('#BRnav').hide();
      AJS.booksize_controls_hidden = true;
      $("#texty iframe").css('visibility','visible');
      log('BOOK CONTROLS HIDDEN!');
    }

    $iframeDOM.find('body, #BRcontainer').css('background-color','transparent');


    // now position the theatre controls
    var $book = $iframeDOM.find('#BRtwopageview');
    // find out how much vertical black padding the bookreader put in *OVER* the book,
    // inside the iframe
    var bookPadTop = $book.offset().top;
    // slide the iframe "up" that amount so that we get the wanted/intended standard
    // black padding above the book (~30px) and not more!
    log('bookPadTop: '+bookPadTop);
    if (bookPadTop > 1)
      $iframe.css({'margin-top':-1*bookPadTop, 'margin-bottom':-1*bookPadTop});
    else
      $iframe.css({'margin-top':'', 'margin-bottom':''});

    // compute where the logical top point should be for the book and for the controls
    // (which is comparable to A/V items)
    var $navbar = $('.navbar');
    // NOTE: we *do* check the nav top (almost always 0!) for rare cases we have a banner
    // *ABOVE* the navbar, eg: EOY donate banner campaign (which is above the nav)!
    var pegTop = $navbar.offset().top + $navbar.height() + parseInt($('#theatre-ia').css('padding-top'),10);
    AJS.theatre_controls_position($book, pegTop);
    log('"book" top:'+($iframe.offset().top + $book.offset().top)+' -v- pegTop:'+pegTop);

    // and now dont overflow negative margin-bottom blackness into metadata section
    $('#theatre-ia').css({'overflow':'hidden'});
  };


  AJS.pause = function(id){
    if (!id) id='jw6';
    var jw=jwplayer(id);
    if (jw  &&  jw.config  &&  jw.getState()=='PLAYING')
      jw.pause();
  };


  AJS.colplay_setup = function(){

    $('#tabby-collection .row .item-ia:not(.collection-ia) .item-img').parent().tooltip({'title':'<span class="iconochive-play"></span> Click image to Preview','placement':'bottom','html':true});


    $('#tabby-collection .row .item-ia:not(.collection-ia)').on('click', function(evt){

      var identifier = $(evt.target).parents('a').attr('href').replace(/\/details\//,'');

      $.get('/details/'+identifier+'&colplay=1', function(data){

        $('body').addClass('colplay');

        setTimeout(function(){
          $('.container-ia:first').css({'padding-top': 60 + $('.welcome').height()});

          AJS.tiler();
        },1000);


        if ($('#colplay').length){
          AJS.pause();
        }
        else{
          $('.container-ia:first').append('<div id="colplay"/>');
        }


        try{
          $('#colplay').html('<div class="colplay-exit" data-toggle="tooltip" data-placement="left" title="hide player preview"><span class="iconochive-play"></span></div>'+data);

          $('#colplay .colplay-exit').tooltip({}).click(function(){
            AJS.pause();
            $('#colplay').css({'right':'-50%'});
            setTimeout(function(){
              $('#colplay').remove();
              $('body').removeClass('colplay');
              $('.container-ia:first').css({'padding-top':''});

              AJS.tiler();
            },600);
          });

          $('#colplay .sharee[data-toggle="tooltip"]').tooltip({});

          $('#colplay').css({'right':0});
        }
        catch (e){
          log('********* EXCEPTION ******');
          log(e);
        }
      });

      return false;
    });
  };


  AJS.add2list = function(lnk){

    var selector = $(lnk).attr('data-target');
    var href=$(lnk).attr('href');
    var selectorID = selector.replace(/#/,'');

    $.get(href+'&headless=1&titlelist=' + $(lnk).text(), function(htm){
      // dynamically add modal to page (if isnt there already)
      AJS.modal_go(lnk, {title:'Add To List',
                         headerClass:'modal-header-new-list',
                         ignore_lnk:true,
                         auto_remove:true,
                         body:htm});
    });

    return false;
  };

  AJS.newlist = function(lnk){
    var selector = $(lnk).attr('data-target');
    var href=$(lnk).attr('href');
    var selectorID = selector.replace(/#/,'');

    $.get(href+'&headless=1', function(htm){
      // dynamically add modal to page (if isnt there already)
      AJS.modal_go(lnk, {title:'Create New List',
                         headerClass:'modal-header-new-list',
                         ignore_lnk:true,
                         body:htm});
    });

    return false;
  };

  AJS.newlist_submit = function(){
    // Strings with SPACE characters will be changed to "camel case".
    // For example:
    //    "my LA roadtrip"
    // will become:
    //    "MyLaRoadtrip"
    // Letters, numbers, periods (.), dashes (-), or underscores (_) are ok, but
    // other characters will be removed.
    var title=$('#new-list-form input[name=title]').val();
    if (!title.length){
      alert('Please enter a title for your List');
      return false;
    }

    // turn the title into an acceptable identifier
    var cleaned=title;
    /*
    if (title.match(/ /)){
      cleaned = title.toLowerCase();
      cleaned = cleaned.replace(/([ ]+[a-z])/g, function(v){ return v.toUpperCase().trim(); });
      cleaned = cleaned.replace(/^([a-z])/g,    function(v){ return v.toUpperCase().trim(); });
    }
    */

    // remove any "bad" chars
    cleaned = cleaned.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    // OK now trim any *leading* chars like:  - _ .
    cleaned = cleaned.replace(/^[_\-\.]+/, '');
    log(cleaned);

    if (!cleaned.length){
      alert('Please try another title that contains more alphanumeric characters');
      return false;
    }

    return true;
  };

  AJS.popover_menu = function(selector, opts){
    // setup options
    var options = {
      trigger: "hover focus click", // make accessible
      container: selector,
      content: opts.content,
      html: true
    }
    // do not overwrite values given by the 'data-' attribute
    if(opts.title)
      options.title = opts.title;
    if(opts.placement)
      options.placement = opts.placement;
    if (opts.trigger)
      options.trigger = opts.trigger;

    // setup popover
    $(selector).popover(options);

  }


  // makes the tooltip show for picking dates
  AJS.date_switcher = function(htm){
    var selector='#date_switcher';


    // make a tooltip trigger manually, on hover, but then *hold it showing*
    // until they leave area *including* tooltip itself
    $(selector).tooltip({
      html:true,
      trigger:'manual', // we gonna control hover behaviour
      placement:'bottom',
      title:htm
    }).on("mouseenter focusin", function (){
      // check first if already showing, to avoid "flickering" with "show! .. show!"
      if (!($(selector).parent().find('.tooltip').length))
        $(this).tooltip("show");
    });


    // the date_switcher lives inside bigger "sortbar".  the date changing tooltip
    // lives inside it (and hangs off it).  So what we *really* want as the trigger
    // to hide the date change tooltip is the entire sortbar itself.  nice!
    $('.sortbar').on("mouseleave", function(){
      log('not hovering sortbar anymore');
      $(selector).tooltip("hide");
    });


    $(selector).on('shown.bs.tooltip', function(){
      // make any link hit change which one is "in"
      // (just before page starts to reload)  finesse!
      $(selector).parent().find('.date_switcher').on("click", function(){
        $(this).parents('.tooltip').find('.date_switcher.in').removeClass('in');
        $(this).addClass('in');
      });
    });
  };



  // NOTE: UNUSED BUT KEPT IN CASE WE EVER GO BACK FROM NEWER/BETTER CSS-ONLY SOLUTION!
  //
  // [ Now we use CSS to (max-/)width C2 and C4 *instead* for a much better user experience
  //   AND for a more efficient / kinder to browser non-JS solution! ]
  AJS.lister = function(){
    /*
      First, allow natural HTM/CSS widths of 3 of 5 "table-cell" display type columns
       C1         C234      C5
       VIEWS  ..  DATE  ..  MT-ICON

       Compute width of "C234" - width of C3/DATE.
       Split TITLE (C2) and CREATOR (C4) max-width into
       60% / 40% split of that #pixels.
    */

    // NOTE: there can be 2+ sets of results on a page -- eg: "My Library" page!
    var selector = AJS.selector();
    var $selector = $(selector).first();
    log("lister() SELECTOR: "+selector);

    var C3   = $selector.find('.results .item-ia:first   .C3').outerWidth();
    var C234 = $selector.find('.results .item-ia:first .C234').outerWidth();

    var availWidth = C234 - C3;
    availWidth -= 20;// yah, this was empirically observed / made up -- get some science, girl!

    var C2=Math.max(80, Math.round(0.6 * availWidth));
    var C4=Math.max(80, Math.round(0.4 * availWidth));
    log('C3:  '+C3  );
    log('C234:'+C234);
    log('C2:  '+C2  );
    log('C4:  '+C4  );
    log(' ==> availWidth: '+availWidth+' ('+C2+'+'+C4+')');

    $selector.find('.results .item-ia .C2').css({'width':C2,'max-width':C2});
    $selector.find('.results .item-ia .C4').css({'width':C4,'max-width':C4});
  };


  // We moved to newer tactic Mar2015...
  // Pages are emitted by default with body classes "lists" and "showdetails".
  // We use JS to toggle/remove them and switch off details or switch to "tiles" mode.
  AJS.lists_v_tiles_setup = function(cookie_range){
    // does user have any cookied preferences?
    var defaults    = (cookie_range=='search' ? 'lists' : 'tiles');
    var prefer      = ($.cookie('view-'       +cookie_range));
    var showdetails = ($.cookie('showdetails-'+cookie_range));

    var checked = (showdetails=='showdetails'  ||  (!showdetails  &&  defaults=='lists'));

    if (prefer=='lists'  ||  (!prefer  &&  defaults=='lists')){
      if (checked)
        return; // perfect, we are already what they want
      $('body').removeClass('showdetails'); // they dont want full details right now
    }
    else{
      // switch to "tiles" mode
      $('body').removeClass('lists'+(checked?'':' showdetails')).addClass('tiles');
    }
  };


  AJS.showdetails_toggle = function(btn, cookie_range){
    var $body = $('body');

    var to = ($body.hasClass('showdetails') ? '' : 'showdetails');
    log("showdetails_toggle() going to: "+to);

    $.cookie('showdetails-'+cookie_range, to, { path:'/', expires:30, domain:'.archive.org'});

    $body.toggleClass('showdetails');
  };


  AJS.tiles_toggle = function(btn, cookie_range){
    var $body = $('body');

    var to = ($body.hasClass('tiles') ? 'lists' : 'tiles');
    log("tiles_toggle() going to: "+to);

    $body.removeClass('lists tiles').addClass(to);
    AJS.tiler();

    $.cookie('view-'+cookie_range, to, { path:'/', expires:30, domain:'.archive.org'});

    return false;
  };


  // Returns one of these, like "#ikind-[TAB]-[IKIND]"
  //
  // COLLECTION PAGES:
  //
  //   #ikind--downloads
  //   #ikind--titleSorter
  //   #ikind--publicdate
  //   #ikind--date
  //   #ikind--reviewdate
  //   #ikind--updatedate
  //   #ikind--creatorSorter
  //
  //   #ikind-downloads
  //   #ikind-titleSorter
  //   #ikind-publicdate
  //   #ikind-date
  //   #ikind-reviewdate
  //   #ikind-updatedate
  //   #ikind-creatorSorter
  //
  // ACCOUNT PAGES:
  //
  //   #ikind-collections-date-archived
  //   #ikind-collections-title
  //   #ikind-uploads-date-archived
  //   #ikind-uploads-title
  //   #ikind-loans-waiting-list
  //   #ikind-loans-on-loan
  //   #ikind-loans-history
  //
  // OTHER:
  //
  //   #ikind-search              (search)
  //
  AJS.selector = function(){
    var inTab = $('.welcome .tabby.in .tabby-text').text();
    if (inTab=='Forum'  ||  inTab=='Posts'  ||  inTab=='About')
      return false; // no tile tab is showing
    //alert(inTab);

    var selector=false;
    if (inTab){
      // We want to end up with a selector like:
      //    #ikind-collections-title
      //    #ikind--publicdate
      log('inTab: '+inTab);
      var tmp = '#tabby-'+inTab.toLowerCase();
      if (inTab=='Collection'){
        selector = '#' + $(tmp+' div.ikind.in:first').attr('id');
      }
      else{
        var ikind = $(tmp+' .ikind.stealth.in:first').text().toLowerCase().replace(/ /,'-');
        selector = '#ikind-' + (inTab.toLowerCase()) + (ikind==="" ? "" : "-" + ikind);
      }
    }
    else{
      // we want to end up with a selector like:
      //    #ikind-date
      selector = '#ikind-'+$('.ikind.stealth.in:first').text().toLowerCase().replace(/ /,'-');
      if (!$(selector).length) selector = '#ikind-search'; //xxxxxxxxx  SHORE THIS UP, GIRL!
    }

    log('SELECTOR '+selector);

    return selector;
  };




  // function that finds alternate (non-AJS.tiler()) sets of item tiles,
  // that are laid out in strips/columns and will hide entire columns
  // if they fall off the right side, in terms of fitting to browser/page width
  AJS.tilebars = function(){
    // iterate over all row classes that have at least 1 .tilebars .results div in them...
    $('.row .tilebars').find('.results').parents('.row').each(function(k,row){
      var first=false;
      $(row).find('.results').each(function(key,val){
        $(val).show().css({visibility:'hidden'});
        if (!first)
          first=$(val).offset();
        if ($(val).offset().top != first.top)
          $(val).hide();
        else
          $(val).css({visibility:'visible'});
      });
      //if (first) $(row).find('.tilebars > h4').css({'padding-left':first.left+10});
    });
  };


  // adds collection parent hovering image and text to tiles
  AJS.parent_hover = function($selector){
    $selector.find('.item-ia:not(.hov):not(.collection-ia):not(.account-ia)').addClass('hov')
      .mouseover(function(e){ $(e.currentTarget).find('.item-parent').addClass   ('hoverin'); })
      .mouseout (function(e){ $(e.currentTarget).find('.item-parent').removeClass('hoverin'); });
  };


  AJS.tiler = function(selector, noRecall){
    var tileMarginH = 30;
    var tileMarginW = 17


    // See lister() for why this is able to be commented out now!
    // $('.results .item-ia .C2, .results .item-ia .C4').css({'width':'','max-width':''});
    if (!$('body').hasClass('tiles')){
      if ($('body').hasClass('showdetails'))
        $('.sortbar input[name=showdetails]').prop('checked',true);
      // AJS.lister();
    }

    if (!selector)
      selector = AJS.selector();
    if (selector===false)
      return;


    var $selector = $(selector).first();
    var selectorID = $selector.attr('id');
    var $parentRow = $selector.parents('.row');


    if (!$('body').hasClass('tiles')){
      $parentRow.css({'padding-left':'', 'padding-right':''});
      return;
    }





    if (!AJS.tilerPREV){
      // first time tiling page!
      AJS.tilerPREV = {winW:0,
                       pad:0,
                       nPerRow:1,
                       gutter:tileMarginW,
                       tileWidth:TILE_WIDTH,
                       unsourced:{}};

      AJS.parent_hover($selector);
    }

    if ($(window).width() != AJS.tilerPREV.winW){
      // First time, or page resize/orientation change.
      // We will effectively "cache" all this adjusting computations, so multiple calls to tiler()
      // can reuse if window width hasnt changed (for efficiency, eg: many images still slowly loading..)
      $parentRow.css({'padding-left':'', 'padding-right':''}); // reset (see below)
      AJS.tilerPREV.firstLeft = 0;  // reset (see below)

      var facetsWidth = $parentRow.find('.columns-facets:visible').outerWidth()  ||  0;
      var availWidth = $parentRow.width() - facetsWidth;
      var gutter = (availWidth < 400 ? 5 : tileMarginW);
      var tileWidth = ($('.item-ia:first').outerWidth() >= TILE_WIDTH ? TILE_WIDTH : TILE_WIDTH_SMALL);
      var nPerRow = Math.max(1, Math.floor((availWidth + gutter) / (tileWidth + gutter)));
      var extra   = Math.max(0,            availWidth - (nPerRow * (tileWidth + gutter)) + gutter);

      var dbug = 'tiling '+selectorID+', parentRowW: '+$parentRow.width()+', facetsWidth: '+facetsWidth+', availWidth: '+availWidth+', number per row: '+nPerRow+'. ';
      log(dbug + 'With gutter margin: '+gutter+', had '+extra+' extra pixels');
      AJS.tilerPREV.pad = Math.round(extra/2);

      AJS.tilerPREV.winW = $(window).width();
      AJS.tilerPREV.nPerRow = nPerRow;
      AJS.tilerPREV.gutter = gutter;
      AJS.tilerPREV.tileWidth = tileWidth;
    }

    if (AJS.tilerPREV.nPerRow > 1)
      $parentRow.css({'padding-left':AJS.tilerPREV.pad, 'padding-right':AJS.tilerPREV.pad});
    else
      AJS.tilerPREV.firstLeft = AJS.tilerPREV.pad;



    var nImgZeroHeight=0;
    var nImgZeroHeightStr='';
    var maxtop=0;
    var tops={0:0};
    var lefts={0:AJS.tilerPREV.firstLeft};
    for (var i=1; i < AJS.tilerPREV.nPerRow; i++){
      lefts[i] = lefts[i-1] + AJS.tilerPREV.gutter + AJS.tilerPREV.tileWidth;
      tops[i] = 0;
    }


    // Any item tiles w/ unloaded/set src tags get updated and loaded now!
    // We only have to do this pass on a swathe of new results (1st page or infin scroll set added)
    if (!AJS.tilerPREV.unsourced[selectorID]){
      log('unsourcing '+selectorID);
      $selector.find('.item-ia img[source]').each(function(k,v){
        v=$(v);
        v.attr({src:v.attr('source')}).removeAttr('source');
      });
      AJS.tilerPREV.unsourced[selectorID]=1
    }


    // we track where previous tile was placed
    AJS.colPREV = -1;
    $selector.find('.item-ia').not('.mobile-header').css({visibility:'hidden'}).each(function(idx,val){
      var $val = $(val);
      var $valHT = $val.innerHeight();
      //log('$valHT: '+$valHT);

      var col = 0;
      // can uncomment for easier testing of "tactic"s
      //$val.find('.ttl, .collection-title a').text(' TITLE #'+idx);
      var tactic=3;
      // NOTE: regardless of tactic, always use 1st column STILL with a top == 0 first!
      if (tactic  &&  AJS.tilerPREV.nPerRow > 1  &&  idx >= AJS.tilerPREV.nPerRow){
        if (tactic==3){
          // First, cycle from last placed tile column location to "first cycled slot".
          // (That is, move "1 to right" from last placed tile column, but it's a cycle/ring
          // for final column -- go to 1st column in that case).
          // Test place new tile *there* (in "first cycled slot") UNLESS further ahead in cycle/ring
          // of other slots, the tile will fit where its BOTTOM will be above where the tile
          // TOP would be in the "first cycled slot".
          // (and pick the "first" in such a case if 2+ slots like that)
          var colTEST = ((AJS.colPREV + 1)  %  AJS.tilerPREV.nPerRow);
          col = colTEST; // fallback/default
          var cmpTEST = tops[colTEST] - $valHT; //[slightly more efficient way 2 compare]
          for (var i=0; i < AJS.tilerPREV.nPerRow; i++){
            if (i != colTEST  &&  cmpTEST > tops[i]){
              // log("BETTER COL FOR TILE #"+idx+": " + i);
              col = i;
              break;
            }
          }
        }
        else if (tactic==2){
          for (var i=AJS.tilerPREV.nPerRow-1; i >= 0; i--){
            // tactic #2: "test fit" next tile in every column.
            // pick the column where the tile TOP would be higher up than all other
            // candidate tile BOTTOM y values
            var t1 = tops[i];
            for (var e=0; e < AJS.tilerPREV.nPerRow; e++){
              if (e==i) continue;
              if ((t1 - $valHT) > tops[e])
                break; // nonideal
            }
            if (e==AJS.tilerPREV.nPerRow){
              log("BEST COL FOR #"+idx+" SO FAR: " + i);
              col = i;
            }
          }
        }
        else if (tactic==1){
          // tactic #1: "use column with highest up tops value, but dont repeat/pick same prior column"
          var mintop=Number.MAX_VALUE;
          for (var i=0; i < AJS.tilerPREV.nPerRow; i++){
            if (AJS.tilerPREV.nPerRow > 2  &&  i == AJS.colPREV) continue;
            if (tops[i] < mintop){
              mintop = tops[i];
              col = i;
            }
          }
        }
      }
      else{
        col = (idx % AJS.tilerPREV.nPerRow);
      }
      AJS.colPREV = col;


      $val.css({visibility:'visible', top:tops[col], left:lefts[col]})


      // track how many tile images are without height (either not loaded or no CSS height style set if img not loading from DB)
      var tmp=$val.find('.item-img');


      if (tmp.length  &&  !($val.find('.item-img').height())){
        nImgZeroHeight++;
        tmp = $val.attr('data-id');
        if (tmp)
          nImgZeroHeightStr += tmp+',';
      }

      // setup for next tile...
      tops[col] += ($valHT + tileMarginH);

      maxtop = Math.max(maxtop, tops[col]);
    });

    // we have to manually set the height of the "selector"
    log('maxtop: '+maxtop);
    $selector.find('.results').css({height:maxtop});


    if ($('body').hasClass('manage')){
      $('.item-ia:not(.removable)').addClass('removable').append(
        '<div class="xer" onclick="return AJS.unmanage(this)" title="remove item from being submitted to item management"></div>');
    }


    if ((nImgZeroHeight)  &&  !noRecall){
      log(nImgZeroHeight+' img (still w/o height); recall tiler('+selector+')...'+nImgZeroHeightStr);
      // recall ourselves, but not more than once every 1.5 seconds!
      $.doTimeout('tiles-img-load', 1500, function(){
        AJS.tiler(selector, 0);
      });
    }
  };


  AJS.ikind = function(lnk,id){
    log('ikind('+id+')');
    $('#'+id).parent().find('div.ikind.in').hide();
    $('#'+id).removeClass('hidden').addClass('in').show();
    $('#'+id).parents('.tabby-data').find('a.ikind').removeClass('in');

    $(lnk).addClass('in');

    AJS.tiler('#'+id);

    // now select the corresponding element in the shadowing select for mobile
    $sel = $('#'+id).parents('.tabby-data').find('select.ikind-mobile');
    var $new = $sel.find('option:contains('+($(lnk).text())+')');
    var $now = $sel.find('option:selected');
    if ($new.text() != $now.text()){
      log('changing ikind mobile now to '+$new.text());
      AJS.ikind_mobile_change_ignore_next = true;
      $new.attr('selected','selected');
      //$now.removeAttr('selected');
    }

    return false;
  };

  AJS.ikind_mobile_change = function(elm){
    if (AJS.ikind_mobile_change_ignore_next){
      AJS.ikind_mobile_change_ignore_next = false;
      return;
    }

    var $selopt = $(elm).find('option:selected');
    log("ikind mobile changed to: "+$selopt.text());
    var $ikinds = $(elm).parents('.tabby-data').find('a.ikind');
    if (!$ikinds.length){
      // NO tabby!  eg: top page or search page
      $ikinds = $('body').find('a.ikind');
    }

    if (!$ikinds.length)
      return; // uho!

    var $ikind = $ikinds.filter(function(index){ return $(this).text() === $selopt.text(); });

    var href = $ikind.attr('href');
    log('goto: '+href);

    if (href){
      if (href.substr(0,1)=='#'){
        // ACCOUNT PAGE (FOR NOW)!  (STILL USES HASH FOR NOW)
        $('a.ikind[data-id='+href.substr(1)+']').click();
      }
      else{
        location.href = href;
      }
    }
  };


  AJS.popState = function(pageType){
    // are we watching history.pushState() and history.popState() calls?
    AJS.pushState = (typeof(history.pushState) != 'undefined');
    log('popState() called, modern browser: '+(AJS.pushState ? 'y' : 'n'));

    if (pageType){
      if (pageType=='search'){
        // anything custom we need to do?
      }
      return;
    }


    var tabPick = function(hash2arg){
      var tab = AJS.arg('tab', true);
      if (tab)
        tab = '#tabby-'+tab+'-finder';
      else if (hash2arg)
        tab = '#tabby-'+hash2arg+'-finder';
      else
        tab = '.tabby-default-finder';

      if (AJS.pushState)
        log('goto tab: '+tab+' ################################################### STATE');
      AJS.tabby_no_pushState_next_click = true;
      $(tab).click();
    };

    /* not working when flip around tabs after and then do [back] ...
    var hash2arg=false;
    if (location.hash=='#forum'  &&  location.pathname.match(/^\/details\/[a-zA-Z0-9_\-]+$/))  hash2arg='forum';
    if (location.hash=='#about'  &&  location.pathname.match(/^\/details\/[a-zA-Z0-9_\-]+$/))  hash2arg='about';
    if (hash2arg){
      tabPick(hash2arg);
      return;
    }
    */

    if (AJS.pushState){
      $(window).on('popstate',function(e){ //run on page load or browser "back"
        tabPick();
      });
    }
    // else user has an older browser or Opera Mini and doesn't have pushState/popState!

    tabPick();
  };


  AJS.tabby = function(lnk,id){
    log('AJS.tabby('+id+')');
    $('.tabby-data.in').removeClass('in').hide();
    $('#'+id).removeClass('hidden').addClass('in').show();
    $('.tabby').removeClass('in');
    $(lnk).parents('.tabby').addClass('in');

    if (AJS.tabby_no_pushState_next_click){
      delete AJS.tabby_no_pushState_next_click;
    }
    else{
      if (AJS.pushState  &&  typeof(history.pushState) != 'undefined'){
        var href=$(lnk).attr('href');
        var locNOW = location.href;
        var locNEW = location.protocol +'//'+ location.host + href;
        if (locNOW != locNEW){
          log('pushState: '+href+' ################################################### STATE');
          history.pushState({}, '', locNEW);
        }
      }
    }

    var inTab=id.replace(/tabby\-/,'');
    if (inTab=='collections'  ||  inTab=='uploads'  ||  inTab=='loans'  || //account pages
        inTab=='collection'  ||  inTab=='about'){ // collection pages
      if (inTab=='about')
        AJS.grafs();
      AJS.tiler();
    }

    if (AJS.pushState)
      return false;
    else
      return true;
  };


  AJS.colclick = function(e){
    var $e=$(e);
    var id=$e.attr('data-id');

    // *NORMALLY* clicking on a collection tile goes to it.
    // BUT NOT:
    //   * in lists mode (only the identifier link does that -- not other data columns!)
    //   * if in process of removing items (eg: from favorites list)
    if (id  &&  $('body').hasClass('tiles')  &&  !$e.hasClass('removable'))
      location.href = '/details/'+id;
  };



  AJS.list_remove_item = function(xer){
    if ($('body').hasClass('lists')){
      $('.tiles-button:visible').click(); //sorry! this only works in tiles mode now...
    }


    if (!xer){
      if (!$('.item-ia .xer').length){
        // make all items editable
        $('.item-ia').addClass('removable').append('<div onclick="AJS.list_remove_item(this)" class="xer" alt="remove this item from list" title="remove this item from list"></div>');
      }
      else{
        // cancel editability
        $('.item-ia').removeClass('removable');
        $('.item-ia .xer').remove();
      }
    }
    else{
      // single item is slated for utter destruction from this list...
      var $item = $(xer).parents('.item-ia');
      var idX = $item.attr('data-id');
      var url = location.href.replace(/#.*$/,'') + '&remove_item='+idX;
      // Use the most recent update date to help uniquely identify the item!
      if ($item.attr('data-date'))
        url += '&data-date='+$item.attr('data-date');
      if (AJS.listkind)
        url += '&kind='+AJS.listkind;
      log('GET: '+url);

      $.get(url, function(htm){
        log('GOT: '+url);
        log(htm);
        $item.remove();
        AJS.tiler();
      });
    }
    return false;
  };


  // remove an element from a search results page
  AJS.unmanage = function(xer){
    xer=$(xer);
    xer.parent('.item-ia').next().remove(); // remove item list portion
    xer.parent('.item-ia').remove();        // remove item tile portion
    return false;
  };


  // submits search results items to item manager for invoking operations on the list
  AJS.manage = function(){
    // get list of all (remaining) identifiers in a search results page
    var ids = $(".item-ia[data-id]").toArray().reduce(function(a,b){
      var id=$(b).attr('data-id');
      return "" + a + (id=="__mobile_header__"?"":id+",");
    }, "");
    log('MANAGE: '+ids);

    if (ids!==""){
      // now make a form that we can POST to, with all the identifiers,
      // and post to /manage/ page
      var $form = $('<form id="manage-ids" method="POST" action="/manage/" style="visibility:hidden;position:absolute;top:0;left:0;width:1px;height:1px;"><input type="text" name="identifier" value="'+ids+'"/></form>');
      $('body').append($form); // NOTE: firefox needs it in DOM to submit
      $form.submit();
    }
    return false;
  };



  AJS.head_img_dragdrop_setup = function(identifier){
    if (AJS.head_img_dragdrop_setup_done)
      return;
    log('head_img_dragdrop_setup');
    AJS.head_img_dragdrop_setup_done = true;


    $('#file-dropper-wrap').bind('mouseenter', function(evt){
      log('enter');
      AJS.head_img_replaceable(identifier);
      $('#file-dropper').show();
    }).bind('mouseleave', function(evt){
      log('ouddie');
      if (!AJS.file_picked)
        $('#file-dropper').hide();
    });

    $('body').bind('dragover', function(evt) {
      //enable file dropping
      log('dragover');
      evt.stopPropagation();
      evt.preventDefault();

      AJS.head_img_replaceable(identifier);
      $('#file-dropper').addClass('drag_over').show();
      return false;
    });

    $('body').bind('dragleave', function(evt) {
      log('dragleave');

      // are we still over a file-dropper div/img?
      var over = ($('#file-dropper-wrap').is(':hover') ||
                  $('#file-dropper'     ).is(':hover') ||
                  $('#file-dropper-img' ).is(':hover'));
      if (!over){
        var x = evt.pageX || evt.originalEvent.pageX;
        var y = evt.pageY || evt.originalEvent.pageY;
        var e = $('#file-dropper-wrap');
        var left = e.offset().left;
        var top  = e.offset().top;
        if (x >= left  &&  x <= left + e.outerWidth()  &&
            y >= top   &&  y <= top  + e.outerHeight()){
          // still over the file drop target image area!
          over=true;
        }
        if (!over){
          e = $('#file-dropper');
          left = e.offset().left;
          top  = e.offset().top;
          if (x >= left  &&  x <= left + e.outerWidth()  &&
              y >= top   &&  y <= top  + e.outerHeight()){
            // still over the file drop target image area!
            over=true;
          }
        }
      }

      if (!over)
        $('#file-dropper').removeClass('drag_over').hide();
    });

  };

  AJS.head_img_replaceable = function(identifier){
    // helpfuls:
    //  https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    //  http://www.sitepoint.com/html5-ajax-file-upload/
    if ( $('#file-dropper').html().trim() != '' )
      return;

    var form_init = function(){
      $('#file-dropper').show().html('<div>\n\
        <button id="file-cancel" type="button" class="close" data-dismiss="alert" aria-hidden="true" title="cancel file upload" alt="cancel file upload">&times;</button>\n\
        <b><span style="font-size:40px; color:#aaa" class="iconochive-plus-circle"></span></b><br/>\n\
          <b>Drag & Drop an image file here or</b>\n\
        <button type="button" class="btn btn-info btn-xs" onclick="$(\'#file-selector\').click();">Pick image to upload</button>\n\
        <form method="POST" action="/services/post-file.php?submit=1&identifier='+identifier+'" enctype="multipart/form-data" id="poster">\n\
          <div class="hidden">\n\
            <input id="file-selector" name="file" type="file" accept="image/*"/>\n\
          </div>\n\
          <input type="hidden" name="identifier" value="'+identifier+'"/>\n\
          <input id="file-submit" type="submit" name="submit" value="SUBMIT" class="btn btn-success"/>\n\
          <div id="file-uploading">Uploading your file..</div>\n\
        </form>\n\
      </div>');
    };
    form_init();


    $('#file-cancel').bind('click',function(evt){
      AJS.cancelFile();

      evt.stopPropagation();
      evt.preventDefault();
      return false;
    });



    $.event.props.push('dataTransfer'); //if not set, dataTransfer is not sent


    var success = function(){
      log('success!');
      //AJS.cancelFile();
    };


    // upload an image (typically a collection/list header or account/person profile)  via S3
    // returns '' on success; else string w/ error/fail reason
    var uploadFile = function(){
      var fail=false;

      if (typeof(XMLHttpRequest)=='undefined')
        fail = 'browser appears to not have HTML5 functionality';

      if (!fail)
        fail = AJS.badFile();


      if (!fail){
        log(AJS.file2post);
        var xhr = new XMLHttpRequest();
        if (!xhr.upload)
          fail = 'browser submit setup failed';
      }

      if (fail)
        return fail;



      // start upload
      log("post");
      //if (navigator.userAgent.indexOf('Safari') > 0)  xhr.timeout = 10 * 60 * 1000; // 10 minutes
      xhr.open("POST",
               location.protocol +'//'+ location.host +"/services/post-file.php?submit=1&identifier="+identifier+"&fname="+encodeURIComponent(AJS.file2post.name),
               false); // block synchronously on this post!
      //if (!options.sendBoundary) xxx-xxx
      xhr.setRequestHeader("Content-Type", "multipart/form-data; charset=UTF-8");
      xhr.send(AJS.file2post);

      var reply=xhr.responseText;
      var mat=reply.match(/SUCCESS \(task_id=(\d+)\)/);
      if (mat  &&  mat.length){
        var task_id=mat[1];
        log('STALKING TASK_ID: '+task_id);

        $('#file-dropper').html('waiting for updates..');
        var stalker_ptr = false;
        var stalker = function(){
          log('STALKING...');
          $.ajax({type: "GET",
                  url: '/catalog_status.php?where=task_id='+task_id+'&rand='+Math.random(),
                  dataType: "xml",
                  success: function(xml) {
                    log(xml);
                    var x={green:parseInt($(xml).find('wait_admin0').text(),10) || 0,
                           blue :parseInt($(xml).find('wait_admin1').text(),10) || 0,
                           red  :parseInt($(xml).find('wait_admin2').text(),10) || 0};
                    log(x);
                    var nWait = x.green + x.blue + x.red;
                    $('#file-dropper').html('waiting for '+nWait+' tasks to run');
                    if (!nWait){
                      log('task(s) done!');
                      clearInterval(stalker_ptr);
                      $('#file-dropper').html('reloading page with your image');
                      location.href=location.href; // ready! reload the page!
                    }
                    else if (x.red){
                      $('#file-dropper').html('<div class="alert alert-danger">status task failure -- an admin will need to resolve</div>');
                      clearInterval(stalker_ptr);
                    }
                  }
                 });
        };

        // every 2 seconds, check for status
        stalker_ptr = setInterval(stalker, 2000);

      }
      else{
        log(reply);
      }

      log("post done");
      return '';
    };




    $('#file-selector').bind('click',function(evt){
      AJS.file_picked='selected';
    }).bind('change', function(evt){
      log('file dropdown selected!');
      $('#file-submit, #file-cancel').show();
      log(evt);
      if (evt.target  &&  evt.target.files  &&  evt.target.files.length){
        AJS.file2post = evt.target.files[0];
        AJS.previewFile();
      }
    });


    $('#file-dropper').bind('drop', function(evt) {
      // we've been dropped a file (from a drag-and-drop)!
      evt.stopPropagation();
      evt.preventDefault();

      log(evt.dataTransfer.files);
      $('#file-dropper').removeClass('drag_over');

      $('#file-submit, #file-cancel').show();


      if (evt.dataTransfer.files.length){
        AJS.file_picked='dropped';
        AJS.file2post = evt.dataTransfer.files[0];

        AJS.previewFile();
      }
    });


    $('#poster').bind('focusin',function(evt){
      log(evt.type);
      $('#file-uploading').show();
    }).bind('submit', function(evt){
      log('submit!');
      $('#file-uploading').show();

      // First try the schmancy HTML5 submit via XMLHttpRequest and FileReader.
      // If we fail, we'll fallback to form submit normal action.
      var fail = uploadFile();
      if (fail===''){
        // SUCCESS!  we are done!
        success();
        evt.stopPropagation();
        evt.preventDefault();
        return false;
      }

      if (AJS.file_picked=='dropped'){
        // we had client drag-n-drop the file -- we can't post it!
        // epic fail...
        AJS.cancelFile();
        alert('Failure: '+fail);
        evt.stopPropagation();
        evt.preventDefault();
        return false;
      }

      // OK fallback to normal (selected) file submit (and full page reload)!
      return true;
    });



    // now center file-dropper over current image
    var w1=$('#file-dropper-img').outerWidth();
    var h1=$('#file-dropper-img').outerHeight();
    var w2=$('#file-dropper').outerWidth();
    var h2=$('#file-dropper').outerHeight();
    $('#file-dropper').css({left:Math.round((w1-w2)/2),
                            top :Math.round((h1-h2)/2)});

    if (AJS.ios){
      $('#file-dropper > form > div.hidden').removeClass('hidden');
      $('#file-dropper > button').addClass('hidden');
    }
  };



  // client-side preview the image directly in the browser!  xxx-xxx catch exceptions, etc.
  AJS.previewFile = function(){
    $('#file-dropper .uppreview').remove();//remove any prior upload/preview

    if (AJS.badFile()){
      AJS.cancelFile();
      return false;
    }

    if (typeof(FileReader)=='undefined')
      return false;

    var reader = new FileReader();
    reader.onload = function (evt){
      log(evt.target);
      var im = new Image();
      im.src = evt.target.result;
      $('#file-dropper').append(im);
      $(im).addClass('uppreview');
      //$('#file-dropper').css({'background':'url(' + evt.target.result + ') no-repeat center center'});
    };

    log(AJS.file2post);
    reader.readAsDataURL(AJS.file2post);
    return true;
  };


  AJS.cancelFile = function(){
    $('#file-dropper .uppreview').remove();//remove any prior upload/preview
    $('#file-dropper, file-submit, #file-cancel, #file-uploading').hide();
    if (AJS.file_picked)
      delete AJS.file_picked;
    if (AJS.file2post)
      delete AJS.file2post;
  };


  AJS.badFile = function(){
    var fail=false;

    if (!fail  &&  !AJS.file2post)
      fail = 'file is missing';

    // php upload_max_filesize is 8M
    if (!fail  &&  AJS.file2post.size > 8000000)
      fail = 'file is over 8MB in size';

    if (!fail){
      var type=AJS.file2post.type.toLowerCase();
      if (!(type=="image/jpeg" || type=="image/png" || type=="image/gif"))
        fail = 'file not required format of JPEG or PNG or GIF';
    }

    if (fail)
      alert(fail);

    return fail;
  };



  // for microfilm books with many months of newspapers in PDF
  //
  // paginfo is a logical hashmap JSON object of:
  //   YYYYMMDD => [comma separated list of pages]
  // eg:
  //   20080129 =>  "1,2,3,11,17"
  AJS.drawPDF = function(identifier, pageinfo)
  {
    var str='';
    var lastyearmonth=666;
    var urlstart = '/download/'+identifier+
    '/'+identifier+'_pdf.zip/'+identifier+'_pdf/'+identifier+'_';

    var multi_year=false;
    var last_year =false;
    for (var key in pageinfo)
    {
      var year     = key.substr(0,4);
      if (last_year===false) last_year=year;
      if (last_year != year) {
        multi_year=true;
        break;
      }
    }

    for (var key in pageinfo)
    {
      var pages    = pageinfo[key].split(",");
      var year     = key.substr(0,4);
      var month    = key.substr(4,2);
      var day      = key.substr(6,2);
      var yearmonth= year + '-' + month;
      var skip_day = false;
      if (yearmonth != lastyearmonth)
      {
        /**/ if (month== 1) monthName=("January");
        else if (month== 2) monthName=("February");
        else if (month== 3) monthName=("March");
        else if (month== 4) monthName=("April");
        else if (month== 5) monthName=("May");
        else if (month== 6) monthName=("June");
        else if (month== 7) monthName=("July");
        else if (month== 8) monthName=("August");
        else if (month== 9) monthName=("September");
        else if (month==10) monthName=("October");
        else if (month==11) monthName=("November");
        else if (month==12) monthName=("December");
        else if (month===undefined) monthName=("Single Page PDFs");
        else /*          */ monthName=("Unknown_" + month);

        if (multi_year) monthName = year + ' ' + monthName;

        // make header/a that shows/hides a hidden div after it with the
        // month's data
        str +=
          (str == '' ? '' : '</div><!--mo--><br/>')+
          '<a href="#'+monthName+','+year+'" onclick="$(\'#m'+
          yearmonth+'\').toggle(); return false;">+<img src="/images/folder.png"/> <u>'+monthName+
          '</u></a>'+'<div class="mo" id="m'+yearmonth+'">';
      }

      // make header/a that shows/hides a hidden div after it with the page data
      if ((day===undefined)||(day=='')) skip_day=true;
      if (skip_day)
      {
        str += '<div class="day">';
      }
      else
      {
        str +=
        '<div class="day"><a href="#'+yearmonth+'-'+day+
        '" onclick="$(\'#m'+yearmonth+
        'd'+day+'\').toggle();return false;">+<img src="/images/folder.png"/> <u>'+day+
        '</u></a> <div class="pages" id="m'+yearmonth+'d'+day+'">';
      }

      // drop in the individual page links

      var offset = 1,page,pnum;
      for (j=0; j < pages.length; j++)
      {
        page = pages[j];
        if (!page)
          continue;
        if (offset>0) offset=1-page;
        pnum=parseInt(page)+offset;

        // left 0-pad to 4 digits as needed
        page = '0000'+page;
        page = page.substr(page.length-4, 4);

        var url = urlstart + page + '.pdf';
        str += '<a href="'+url+'">['+pnum+']</a> ';
      }

      if (skip_day)
        str += '</div>';
      else
        str += '</div><!--pages-->' + '</div><!--day-->';

      lastyearmonth = yearmonth;
    }

    str += '</div><!--mo-->';

    // replace the "pdfs" empty div with our hefty HTML
    var o=document.getElementById('pdfs');
    //alert(str);
    o.innerHTML = str;
    return false;
  };



  // for collection pages, [About] tab
  AJS.grafs = function(){
    var $grafs1 = $('#grafs1');
    var $grafs2 = $('#grafs2');
    if (!$grafs1.length)
      return;
    if (typeof($grafs1.attr('data-id'))=='undefined')
      return;

    var identifier = $grafs1.attr('data-id');
    $grafs1.attr('data-id',null);

    log('loading grafs');
    $grafs1.html('<i><small>loading graph <img src="/images/loading.gif"/></small></i>').show();
    $grafs2.html('<i><small>loading graph <img src="/images/loading.gif"/></small></i>').show();
    $.get('/details/'+identifier+'&grafs=1&v=2', function(htm){
      var tok="<h2>";
      var a = htm.split(tok);
      if (a.length >= 3){
        $('#activity-reviewsN').html(a[1]).parents('.activity-box').show();
        $('#activity-forumN'  ).html(a[2]).parents('.activity-box').show();
      }
      if (a.length == 5){
        $grafs1.html(tok + a[3]);
        $grafs2.html(tok + a[4]);
      }
      else{
        $grafs1.html('(graph data not available)');
        $grafs2.html('(graph data not available)');
      }
    });
  };



  AJS.quick_down = function(id, target){
    if (!$('.format-group.in').length){
      // no set of files for a single format showing... yet!
      var format = $(target).text();
      var $formatGroup = $('#'+id).parents('.format-group');

      $('.download-button').html(format + ' FILES');
      $formatGroup.addClass('in');
      // hide the other summary formats (one-liner) clickables
      $('.format-group:not(.in)').slideUp();
      $('#'+id).slideDown();
    }
    else{
      // re-open all the summary formats (one-liner) clickables
      $('.format-group').slideDown(400);
      // close the open set of single files
      setTimeout(function(){ //ftw, thx for nothing jquery
        $('.format-group.in').removeClass('in');
        $('.download-button').html('DOWNLOAD OPTIONS');
      }, 400);
      $('#'+id).slideUp();
    }

    return false;
  }


  // parse a CGI arg
  AJS.arg = function(theArgName, try_full){
    sArgs = location.search.slice(1).split('&');
    if (try_full  &&  location.search==='')
      sArgs = location.href.slice(1).split('&');

    r = '';
    for (var i=0; i < sArgs.length; i++){
      if (sArgs[i].slice(0,sArgs[i].indexOf('=')) == theArgName){
        r = sArgs[i].slice(sArgs[i].indexOf('=')+1);
        break;
      }
    }
    return (r.length > 0 ? unescape(r).split(',') : '');
  };


  AJS.search_this_list = function(url,form){
    if (url===''){
      // take the page's current url, minus any hash
      var searchlist_submit_re = new RegExp(location.hash+'$');
      url = location.href.replace(searchlist_submit_re,'');
    }

    // remove any infinite scroll "&page=N" arg
    url = url.replace(/&page=\d+/, '');

    var query=$(form).find('.searchlist').val();

    url += (query==='' ? '' : (location.search===''?'?':'&')+'and[]=' + query);

    // add back in any hash (eg: tab selected)
    url += location.hash;

    location.href = url;
    return false;
  };


  // setup trigger on 1/2 second of hovering over the nav IA logo
  AJS.about = function(lnk){

    AJS.aboutHide = function(){
      $('#internet-archive').fadeOut('slow', function(){
        $('#internet-archive').remove();
        $('#exit-er').show();
      });
      $('#nav-abouts').slideToggle(function(){
        $('#nav-abouts').remove();
      });
    };


    var mousetimer=false;

    $('.navbar-nav:first').on('mouseenter focusin', function(evt){ //axxx make sure when it opens on TAB, the about li is in the DOM *next*
       var $e=$(evt.target);
       if (!($e.is('ul')  ||  $e.hasClass('navbar-brand')  ||  $e.hasClass('iconochive-logo')  ||  $e.hasClass('about-hider')))
         return;

       // if nav search is open -- no About opening!
       if ($('#nav-search-in:visible').length)
         return;

       mousetimer = setTimeout(function(){
         if ($('#internet-archive').length){
           AJS.aboutHide();
           return;
         }

         $('#exit-er').hide(); // (gets in the way of xs/mobile!)
         $('.navbar-nav:first').prepend(
           // flank the IA logo!
           $('<div id="internet-archive" class="hidden-xs about-hider" style="position:absolute;top:10px;width:100%;text-align:center;">'+
             '<div class="topinblock about-hider" style="width:100px;padding-left:10px;"><div class="about-hider" style="display:none;width:85px;height:30px;background:transparent  -35px top no-repeat url(/images/footer.png)"> </div></div>' +
             '<div class="topinblock about-hider" style="width:35px;height:1px;"></div>' +
             '<div class="topinblock about-hider" style="width:100px;"><div class="about-hider" style="display:none;width:85px;height:30px;background:transparent -116px top no-repeat url(/images/footer.png)"> </div></div>'+
             '</div>'
            ));
         // NOTE: put this in *another* element so enter/leave events dont trigger for it -- since we're watching navbar-nav!
         $('.navbar').prepend(
           // Now add in a 2nd level IA nav
           // Poach the markup as it is in the "hamburger" / xs dropdown: copy it and slightly remake it to what we want!
           $('.nav-hamburger .navbar-nav').clone().removeClass('nav navbar-nav').attr('id','nav-abouts'));

         // both of the above divs are hidden.  now fade them in
         $('#internet-archive > div > div').fadeIn('slow');
         $('#nav-abouts').slideToggle();
       }, 100);

     }).mouseleave(function(evt){
       if (mousetimer) clearTimeout(mousetimer);
     });
  };




  AJS.scrolled = function(){
    var newtop = $(window).scrollTop();
    //log('scrolled to '+newtop);

    //var selector = AJS.selector() + ' .more_search';
    var selector = '.more_search:visible';
    var $e=$(selector);
    if (!$e.length)
      return;

    // make the edge detect for "hit bottom" 40 pixels from the bottom
    var check = $e.offset().top + $e.outerHeight() - $(window).height() - 40;
    //log('-v- check: '+check);
    if (newtop > check){
      log('hit rock bottom > '+check);
      if (!AJS.more_searching)
        $(selector+' > a').click();
    }
  };


  AJS.page_map = {};
  AJS.more_search = function(lnk, url, page_now){

    var selector = AJS.selector();
    if (selector===false)
      return false;

    var ikind = selector.replace(/#ikind-/,'');
    var tumble = false;
    if (ikind===''  &&  $('.tumbles').length){
      tumble = true;
      ikind = 'views';
      selector = 'body';//heh
    }

    var $more_search = $(selector + ' .more_search');

    // we stash a reference of what page the client has requested, so we can increment it on
    // each "more_search hit
    var pageKey = selector;
    if (typeof(AJS.page_map[pageKey])=='undefined')
      AJS.page_map[pageKey] = (page_now ? page_now : 1);

    if (AJS.page_map[pageKey] < 0){
      //$more_search.find('.more-search-all').show();
      return false; // all results showing -- no more for this ikind avail so noop/ignore
    }

    AJS.page_map[pageKey]++;
    var page = AJS.page_map[pageKey];

    $more_search.find('.more-search-fetching').show();

    AJS.more_searching = true;

    var is_account = location.pathname.match(/^\/details\/@/); // xxx BLEAH!

    url += page;
    var urlreplace = location.protocol +'//'+ location.host + url;
    url += '&scroll=1' + (is_account ? '&ikind='+ikind+'&sort='+ikind : '');

    log('url: '+url);               // url to AJAX get next page
    log('urlreplace: '+urlreplace); // url to change browser location (visually) to


    if (tumble){
      var seen='';
      $('.tumbles').each(function(k,v){ seen += $(v).attr('data-idx')+","; });
      url += '&seen=' + seen;
    }

    log('more_search(selector='+selector+', sort='+ikind+', page='+page+', url='+url+')');
    //log(AJS.page_map);


    var startTime=new Date();

    $.get(url, function(htm){
      if (htm.length < 100  &&  $(htm).find('div.no-results')){
        // no more results avail/found.  we have reached infinity!
        $more_search.find('.more-search-fetching, a.btn').hide();
        //$more_search.find('.more-search-all').show();
        AJS.page_map[pageKey] = -1; // flag to ignore future more_search attempts
        AJS.more_searching = false;
        return;
      }

      var selectorID = $(selector).attr('id');
      if (AJS.tilerPREV  &&  AJS.tilerPREV.unsourced  &&  AJS.tilerPREV.unsourced[selectorID])
        delete AJS.tilerPREV.unsourced[selectorID];

      if (tumble){
        $('.results').append(htm);
        $more_search.find('.more-search-fetching').hide();
        AJS.more_searching = false;
        return;
      }


      if (AJS.pushState  &&  typeof(history.replaceState) != 'undefined'){
        history.replaceState({}, '', urlreplace);
      }


      var $selector = $(selector+' .results');
      htm = AJS.addNotes(AJS.addingNotesKind, htm);
      $selector.append(htm);

      // re-tile and re-flow!  (the force should flow through you)
      AJS.tiler(selector);
      $more_search.find('.more-search-fetching').hide();
      AJS.more_searching = false;

      AJS.parent_hover($selector);


      // OK, this is quite a bit more subtle...  the HTM has been dropped in,
      // *and* we've done a basic re-tiling.  however, it's very likely many
      // of the images are still loading.  so listen for image "is loaded" events
      // if they trickle in, and at most re-tile every 1 second (even if they
      // likely trickling in at a faster rate than that) until they all loaded
      $(selector + ' img').on('load', function(evt){
        $.doTimeout('tiles-img-load', 1000, AJS.tiler);
      });



      if (typeof(archive_analytics) != "undefined") {
        archive_analytics.send_scroll_fetch_event(page);
      }
    });


    return false;
  };

  // when embed codes are being show, adjust their heights so they show all the content/codes!
  AJS.embed_codes_adjust = function(){
    log('showing embeds!');

    // these are found (only) on /details/ pages
    var embids={'embedcodehere':1, 'embedcodehereWP':1};
    for (var embid in embids){
      var $embid=$('#'+embid);
      $embid.removeAttr('rows').css('height','');

      var embtxt = $embid.text();

      // this is *puke* city -- since textareas are a PITA, make a shadow div w/ the
      // text we want in it, trying to be same width, same font-size, etc.
      // and *then* insert into DOM invisibily so we can calculate its overall height
      // .. and then peg the textarea height to that height
      $('body').prepend($('<div/>')
                        .attr({'id':embid+'Shadow','class':'textarea-invert-readonly roundbox5'})
                        .css({'position':'absolute',
                              'visibility':'hidden',
                              'top':60,
                              'left':10,
                              'padding':'5px 15px 5px 15px',
                              'width':$embid.width(),
                              'font-size':$embid.css('font-size')
                             })
                        .text(embtxt)
                       );
      var bestHT = $('#'+embid+'Shadow').outerHeight() + 15;
      log(embid + ' bestie height: '+bestHT + ' (for current width: '+$embid.width()+')');
      $('#'+embid+'Shadow').remove();

      $embid.height(bestHT);
    }
  };



  // dynamically adds modal to page (if isnt there already)
  AJS._modal_add = function(selector, conf){
    log(conf);

    if ($(selector).length)
      return;

    var selectorID = selector.replace(/#/,'');

    $('body').prepend('\n\
<div id="'+selectorID+'" class="modal fade" role="dialog" aria-hidden="true">\n\
  <div class="modal-dialog modal-lg">\n\
    <div class="modal-content">\n\
      <div class="modal-header '+(conf.headerClass ? conf.headerClass : 'modal-header-std')+'">\n\
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true"><span class="iconochive-remove-circle"></span></button>\n\
        <h2 class="modal-title">'+(typeof(conf.title)=='undefined'?'Confirmed':conf.title)+'</h2>\n\
      </div>\n\
      <div id="'+selectorID+'-body">\n\
        '+(typeof(conf.body)=='undefined'?'':conf.body)+'\n\
      </div>\n\
    </div>\n\
  </div>\n\
</div>\n\
');

    //$('body').addClass('blurry');//exxxxxxxxxxxxxxxperiment!
  };


  AJS.modal_beta = function(lnk, conf){//xxxn
    conf.title = '<center>Give Us Feedback!</center>';

    // Set a cookie *NOW* w/ JS -- so we can absolutely assure that if user hits
    // the exit form *WITHOUT* cookies, that they must be disabling cookies on archive.org
    // (but interestingly have JS enabled (since they are here! ;-))
    // So exit form can give them "you need to enable cookies" fail...
    $.cookie('beta-modal', 'open', { path:'/', expires:1, domain:'.archive.org'});

    var selector = $(lnk).attr('data-target');
    conf.href = location.href;
    conf.href = conf.href.replace(/&ui3=1$/,'');
    conf.href = conf.href.replace(/\/v2$/,  '');

    conf.body = '\n\
<style>#fback h4 { margin-top:30px; }</style>\n\
<div id="fback" style="padding:20px">\n\
  <a target="_blank" href="/details/v2tour20150420">\n\
   <div style="text-align:center; float:right">\n\
    <img src="/download/v2tour20150420/v2tour20150420.thumbs/April202015Tour_000375.jpg"/><br/>\n\
    TUTORIAL VIDEO\n\
   </div>\n\
  </a>\n\
<div style="font-size:18px">Please take a moment to give us feedback below.\n\
We consider these comments as we make changes to the site.</div>\n\
<h5 style="display:none"><br/><br/><br/>THANK YOU for your valuable feedback!</h5>\n\
<form id="modal_beta_form" method="POST" action="/services/exit.php">\n\
<input type="hidden" name="feedback_only" value="1"/>'+
      (!conf.feedback_only ?
       '' : '')+'<br/><h4>Feedback (details are helpful):</h4>\n\
<textarea class="form-control input-sm" name="feedback" rows="4"></textarea>\n\
\n\
<h4>May we contact you about your feedback?</h4>\n\
<input type="radio" name="contact" value="yes"/> yes, here\'s my email address:<br/>\n\
<input class="form-control input-sm" type="text" name="eml"/> <br/>\n\
<input type="radio" name="contact" value="no"/> no<br/>\n\
<hr style="border-color:black;background-color:black;color:black"/>You can use the classic version of archive.org for a limited period of time.<br/>  <a target="_blank" href="https://blog.archive.org/2014/11/05/redesign/">Learn more</a> about why archive.org changed.<br/>\n\
\n\
'+(!conf.feedback_only ?
   ('<input class="btn btn-primary" type="submit" style="margin-top:20px" value="Submit Feedback"/>\n' +
    '<input class="btn"             type="button" style="margin-top:20px" value="Exit to Classic Site" id="modal_beta_form_exit"/>\n') :
   ('<input class="btn btn-primary" type="submit" style="margin-top:20px" value="Submit"/>\n'))+
'\n\
<br/><br/><i>What\'s New?</i> [ <a target="top" href="https://blog.archive.org/2015/02/12/whats-new-with-v2/">recent changes</a> | <a target="top" href="/CHANGELOG.txt">detailed CHANGELOG</a> ]\n\
\n\
</form>\n\
</div>';


    AJS._modal_add(selector, conf);

    // in case it's not obvious, there are FOUR CASES we (have to) handle:
    //   feedback only, hit [submit] button
    //   feedback only, cancel out (no feedback given)
    //   exit beta, hit [submit] button
    //   exit beta, no feedback given
    $('#modal_beta_form_exit').on('click', function(){
      $('#modal_beta_form input[name=feedback_only]').val(0);
      conf.feedback_only = false;
      conf.exiting = true;
      $('#modal_beta_form').submit();
    });


    $('#modal_beta_form').on('submit', function(){
      log('submit clicked!');

      conf.submitted = true;
      conf.postdata = $('#modal_beta_form').serialize(); //oh, fkya!


      // we're polite
      $(selector+' h5').fadeIn('slow');
      $(selector+' form').fadeOut('slow');


      setTimeout(function(){
        // AJAX form post, keeping page where it is
        $.post('/services/exit.php', conf.postdata, function(htm){
          log('POSTED '+conf.postdata);

          if ((!conf.feedback_only  ||  conf.exiting)  &&  document.cookie==''){
            // user disables cookies, so go directly to exit form where we'll
            // give them more information about that and how we can't "stick"
            // their preference to exit beta...
            log('EXITING BUT HAS NO COOKIES!');
            location.href = '/services/exit.php';
            return;
          }

          $('body').removeClass('blurry');
          $(selector).modal('hide');
        });
      },2500);

      return false; // dont do *normal* submit of the form (and drive the page away)
    });


    $(selector).modal('show').on('hidden.bs.modal', function(evt){
      log('beta modal hidden');

      $('body').removeClass('blurry');
      if (conf.feedback_only  ||  !conf.exiting){
        $(selector).remove();
        return;
      }

      var exitFN = function(){
        if (!conf.submitted){
          // user clicked out of modal or [x] close button -- no form submit
          // but they DO want to exit beta...
          location.href = '/services/exit.php';
        }
        else{
          $(selector).remove();
          log('going to '+conf.href);
          location.href = conf.href;
        }
      };


      if (typeof(archive_analytics) != "undefined"){
        archive_analytics.send_ping({
          'service':'ao_2',
          'kind':'event',
          'ec':'in_beta',
          'ea':'exit',
          'cache_bust':Math.random()
        }, exitFN); // once analytics GIF is loaded, invoke our callback!
      }
      else{
        log('uho analytics not defined!');
        // should never happen, but just to be safe!!
        exitFN();
      }
    });
    return false;
  };


  // gives us ability to have JS intercept an href click and instead do a bootstrap modal.
  // eg: when someone Favorites a list or item - a kind of confirmation box.
  //     In that case, we want it to just say Favorited with a big black star in the middle.
  //     We don't take user to the href target.
  //     The modal disappears if the user clicks anywhere and returns to page they were on.
  //     Timeout of a few seconds to close modal if they do nothing.
  // config is a hashmap with optional keys:
  //   auto_close, auto_remove, body, center, favorite, ignore_lnk, titlen, headerClass, shown, follow_link_on_dismiss
  AJS.modal_go = function(lnk, conf){
    if (conf.favorite){
      // this flicks on a bunch of config options
      conf.center=true;
      conf.auto_close=true;
      conf.title='Favorited';
      conf.body='<center><span style="font-size:100px;" class="iconochive-favorite"></span></center>';
      conf.login=true; // must be logged in!
    }

    var selector = $(lnk).attr('data-target');
    var href     = $(lnk).attr('href');

    AJS._modal_add(selector, conf);


    if (conf.shown){
      $(selector).on('shown.bs.modal', function(evt){
        conf.shown();
      });
    }

    if (conf.follow_link_on_dismiss){
      $(selector).on('hidden.bs.modal', function(evt){
        log('modal hidden, going to '+href+'..');
        $('body').removeClass('blurry');
        location.href = href;
      });
    }


    $(selector).modal('show');



    if (conf.login  &&  $.cookie('logged-in-user')===null){
      if (location.protocol!='https:'){
        // make absolutely sure we never login with http!
        location.href = 'https://archive.org/account/login.php';
        return false;
      }
      var url='/account/login.php';
      $.get(url, function(htm){

        $(selector+' .modal-title').text('Nearly there!  Please login first');

        $(selector).modal('show');
        // this allows us to effectively rip off the header/nav and footer
        // if we are accessing a full page (eg: account login page)
        if ($(htm).find('.container-ia > div').length)
          htm = $(htm).find('.container-ia > div').get(0);

        $(selector+'-body').html(htm);

        var $form=$(selector+'-body form:has(input[type=submit])');

        if ($form.length){
          $form.on('submit',function(evt){
            evt.preventDefault();
            evt.stopPropagation();

            var keyvals={};
            $form.find('input').each(function(k,v){
              if ($(v).attr('name').length)
                keyvals[$(v).attr('name')] = $(v).val();
            });
            //log('POST: '+url);
            //console.log(keyvals);
            $.post(url, keyvals, function(htm){
              log('SUBMITTED');
              if ($.cookie('logged-in-user')!==null){
                // SUCCESS!
                // We are going to hide the login modal now, and need
                // to proceed only *after* the modal animation is done
                // and modal is gone.  So setup listener now, *then* hide.
                // Once login modal is gone, remove the modal, and
                // invoke the originally intended modal in fresh environment!
                $(selector).on('hidden.bs.modal', function(evt){
                  $(selector).remove();
                  log('SUCCESS');
                  AJS.modal_go(lnk, conf); // invoke original modal!
                });
                $('body').removeClass('blurry');
                $(selector).modal('hide');
              }
              else{
                alert('Please try logging in again');
              }
            });

            return false;
          });
        }
      });
      return false;
    }


    if (conf.auto_remove){
      conf.auto_close = true;
      $(selector).on('hidden.bs.modal', function(){ $(selector).remove();  $('body').removeClass('blurry'); });
    }


    if (!conf.ignore_lnk){
      var url=lnk.href;
      //log('submit '+url);
      $.get(url, function(htm){


        if (conf.favorite  &&  typeof(archive_analytics) != "undefined") {
          archive_analytics.send_ping({
            'service':'ao_2',
            'kind':'event',
            'ec':'page_action',
            'ea':'favorite',
            'el':location.pathname,
            'cache_bust':Math.random()
          });
        }


        $(selector).modal('show');
        if (conf.auto_close)
          setTimeout(function(){ $(selector).modal('hide'); },2000);
      });
    }
    else{
      $(selector).modal('show');
    }

    if (conf.center)
      $(selector+' .modal-dialog').center(); // vertically center

    if (conf.auto_close  &&  conf.ignore_lnk)
      setTimeout(function(){ $(selector).modal('hide'); },2000);

    return false;
  };






  // (adapted) from http://www.queness.com/code-snippet/6853/center-an-element-on-the-screen-using-jquery
  // then you can use it like:
  //      $("#gridmini").center()

  jQuery.fn.center = function () {
    var myheight = (this.height() +
                    parseInt(this.css('padding-top'),10) +
                    parseInt(this.css('padding-bottom'),10));

    log('myheight='+myheight);
    log('mywidth=' +this.width());
    log('w.height='+$(window).height()+' '+
        'w.width='+$(window).width()+' '+
        'w.scrollTop='+$(window).scrollTop()+' '+
        'w.scrollLeft='+$(window).scrollLeft()+' ');


    var top, left;
    if (AJS.ios){
      var vpW = window.innerWidth;
      var vpH = window.innerHeight;

      log('vpH: ' + vpH);
      log('vpW: ' + vpW);

      top  = (vpH - myheight     ) / 2  +  $(window).scrollTop();
      left = (vpW - this.width() ) / 2  +  $(window).scrollLeft();
    }
    else{
      top  = ($(window).height() - myheight)/2;
      left = ($(window).width()  - this.width())/2;
    }

    //for small viewports like iphone, when centering popups, ensure minimally +20px
    top  = Math.max(20, top);
    left = Math.max(20, left);

    this.css({"position":(AJS.ios?"absolute":"fixed"),
              "display":"block",
              "top":  top  +"px",
              "left": left +"px"});

    return this;
  }; // end jQuery.fn.center



  AJS.addCommas = function(nStr){
    //http://www.mredkj.com/javascript/numberFormat.html
    nStr+='';

    var x=nStr.split('.');
    var x1=x[0];
    var x2=x.length>1?'.'+x[1]:'';
    var rgx=/(\d+)(\d{3})/;
    while (rgx.test(x1))
      x1=x1.replace(rgx,'$1'+','+'$2');
    return x1+x2;
  };


  AJS.suffixFmt = function(val, axis)
  {
    if (axis.min >= 0.0  &&  axis.max <= 5){
      // give a little bit more granularity of 1 decimal point...
      return Math.round(val*10,1)/10;
    }
    else{
      if (val >= 1000000) return (val / 1000000).toFixed(0) + " M";
      if (val >=    1000) return (val /    1000).toFixed(0) + " K";
      return val.toFixed(0);
    }
  };


  AJS.suffixFmtPercent = function(val, axis)
  {
    return AJS.suffixFmt(val, axis) + '%';
  };


  AJS.descript = function(){
    var d=$('#descript').get(0);
    if (d  &&  d.offsetHeight < d.scrollHeight){
      // we overflowed the short descript at the top of the collection page.
      // so show the little MORE button..
      $('#descript-more').show();
      //$('#descript').css({'border-bottom':'1px solid #ccc'});
    }
  };


  // this allows easy setup for resize/orientation triggers for all graphs
  // on a page that use this!
  AJS.plotter = function(callback){
    if (typeof(AJS.plotters)=='undefined')
      AJS.plotters=[];

    if (callback){
      // stash a copy of the callback for resize/orientationchange triggers
      AJS.plotters.push(callback);

      // now do the actual plotting (eg: page load)
      callback();
    }
    else{
      // step through each graph and rerun them
      log("plotter() resize/orient change, "+AJS.plotters.length+" graphs to resize");
      for (var i=0; i<AJS.plotters.length; i++){
        AJS.plotters[i]();
      }
    }
  };


  AJS.plot = function(id, cfg, fmt_fn, pts, many) // for archive.org/services/views.php    and   TV graphs
  {
    if (!cfg.xaxis)
      cfg.xaxis = {'mode':'time','color':(cfg.dark?'#ccc':'#545454')};
    if (!cfg.yaxis)
      cfg.yaxis = {'color':(cfg.dark?'#ccc':'#545454')};
    cfg.series = {
      bars: {
        show: true,
        barWidth: (many && cfg.barWidth ? cfg.barWidth : (cfg.barWidth?cfg.barWidth:(cfg.dayBarsNoPoints?1:7)) * 86400 * 1000),//1day|1week
        fill: 0.6,
        color: "#385C74",
        align: "center"
      },
      color: "#385C74",
      points: { show: (cfg.dayBarsNoPoints?false:true)}
    };

    if (typeof(cfg.grid)=='undefined'){
      cfg.grid = {
        borderColor: (cfg.dark?'#333':'#aaa'),
        hoverable: true
      };
    }
    //console.log(cfg.series.bars);


    if (cfg.dark)
      cfg.grid["backgroundColor"]="#002b36";

    if (typeof(window.GraphPriorIndex)=='undefined')
      window.GraphPriorIndex = {};

    var ary = (many ? pts : (typeof(pts.data)=='undefined' ? [{data:pts}] : [pts]));
    if (cfg.dayBarsNoPoints  &&  !cfg.noLabel)
      ary[0].label = id;

    $.plot($('#'+id), ary, cfg);

    var fmt = fmt_fn;
    if (fmt)
    {
      $('#'+id).bind("plothover", function (event, pos, item){
        if (!item)
        {
          window.GraphPriorIndex[id]=-666;
          $('#gtip').remove();
          return;
        }
        if (window.GraphPriorIndex[id] != item.dataIndex)
        {
          window.GraphPriorIndex[id] = item.dataIndex;
          var str = fmt(item.datapoint[0], item.datapoint[1]);

          $('#gtip').remove();
          var $graf = $('#'+id);
          var off = $graf.offset();

          // figure out which way from the "dot"/bar in the graph the
          // tooltip should go -- left or right!
          var pegTo = ((pos.pageX -off.left) > ($graf.width() / 2) ? 'right' : 'left');
          pegTo = pegTo+':'+ (pegTo=='right' ?
                              ($graf.width() - (pos.pageX - off.left - 20)) :
                              (pos.pageX - off.left + 20)) + 'px';
          //log(pegTo);

          $('#'+id).append('<div id="gtip" class="roundbox2" style="position:absolute; top:'+(pos.pageY-off.top)+'px; '+pegTo+'; padding:2px 5px; border:1px solid gray; background-color:#D8DEDE;  color:#385C74;  -moz-opacity: 0.90; opacity:.90; filter: alpha(opacity=90); ">'+str+'</div>');
        }
      });
    }
  };




  // Use a color sampling 3rd party piece of code, to find the 1st/primary image in the "welcome" area,
  // and find the "dominant color".  (internally, uses canvas to color sample).
  // Adjust text/foreground color as well as any "selected tab" background color.
  // NOT USED ANYMORE -- GONE SERVERSIDE!
  AJS.welcome_recolor = function(e){
    if (typeof(ColorThief)=='undefined'  ||  !e.length)
      return;

    if (AJS.welcome_recolored)
      return;
    AJS.welcome_recolored = true;

    var img=$(e)[0];
    log('welcome_recolor('+(img.src)+')');

    var ct = new ColorThief();
    var palette = ct.getPalette(img, 5);
    log(palette);
    if (!palette)
      return;
    var dominantColorRGB = palette[0];//3 element array!

    if (!dominantColorRGB)
      return;
    log(dominantColorRGB);

    // if dominant color is uh, kinda in the lighter range -- txt should be black
    var avgVal = Math.round($(dominantColorRGB).map( function(idx,val){ return val; }).toArray().reduce(function(a,b){return a+b;}) / dominantColorRGB.length);
    var color = (avgVal >= 128 ? 'black' : 'white');
    log('avgVal: '+avgVal);

    $('.welcome').css({'color':color,'background-color':'rgb('+dominantColorRGB[0]+','+dominantColorRGB[1]+','+dominantColorRGB[2]+')'});
    $('.welcome .stealth:not(.tabby .stealth)').css({'color':color});
  };


  /**
   * Use the following function to make an image, div, etc focusable, and 'click'-able.
   * Function adds a tabindex for 'focus' and listens for a keydown/keypress of enter or space,
   * then triggers a click.
   *
   * var element: String used for jquery capture of non-acessible & mouse-only element.  ex: "#AmazonPayButton img"
   * Triggers 'click' on element.
   */
  AJS.makeMouseElementAccessible = function(element){
    $(element).attr("tabindex", "0").on("keypress keydown", function(e){
      if(e.type != "click"){
        var code = (e.keyCode || e.which);
        var k_space = 32; // space bar pressed
        var k_enter = 13; // enter key pressed
        if([k_space, k_enter].indexOf(code) != -1){
          $(this).click();
        }
      }
    });
  };

  /**
   * Use this global hack, by adding the class 'accessible-link' to any div or img that is a mouse-only element.
   */
  AJS.makeMouseElementAccessible(".accessible-link");


  // use something like ',' for the optional 3rd arg if you want to allow
  // for appending 2+ values into a field, etc...
  AJS.autocomplete = function(selector, options, multiValSplitChar){
    $(selector).autocomplete({
      minLength: 0,
      source: function( request, response ) {
        // delegate back to autocomplete, but extract the last term
        response( $.ui.autocomplete.filter(options, request.term.split( /,\s*/ ).pop() ));
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        if (multiValSplitChar){
          var terms = this.value.split(/,\s*/);
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( ", " );
        }
        else{
          this.value = ui.item.value;
        }
        return false;
      }
    });
  };


  AJS.addNotes = function(kind, htm){
    if (false  &&  !$('body').hasClass('devbox')) return htm;//xxxc

    // flag lists have multiple users so the "rights" there
    // is a bit to thorny right now so for simplicity and
    // the main feature to go live, skipping them...
    if (kind!='favorite'  &&  kind!='list')
      return htm;

    if (!htm  &&  $('body').hasClass('editable'))
      AJS.addingNotesKind = kind;
    if (!AJS.addingNotesKind)
      return htm;

    AJS.addNoteHTM = $('\
<div class="note">\
  <span class="edit">\
    <a href="#" onclick="return AJS.editNote(this)">Add a Note</a>\
  </span>\
</div>');



    log('addNotes');

    // Next, we are going to do a global DOM search and insert (where needed)
    // for basically the first page load.  But we're also called in "infinite scroll"
    // page 2+ mode, and in that case, we want to modify (JUST) the HTM when that's
    // for page 2+ and about to be inserted into the DOM, *instead* of another global
    // DOM search.
    if (htm){
      // (Basically we are now doing page 2+ in infinite scroll)
      // OK this is sorta wild/maybe not obvi...a
      // (Kinda like a jQuery replace_regexp()...)
      // Take the *string* of HTM we are passed, convert it to a "findable" jQuery object
      // then insertd "addNoteHTM" where needed.
      // Finally, convert back to string and return this modified version to caller.
      var $htm = $('<div>'+htm+'</div>');
      $htm.find('.details-ia .C234:not(:has(".note"))').append(AJS.addNoteHTM);
      return $htm.html();
    }
    else{
      // this is initial page load
      return $('.details-ia .C234:not(:has(".note"))').append(AJS.addNoteHTM); // NOTE: return value irrelevant here
    }
  };


  AJS.editNote = function(e){
    var $e=$(e);
    var identifier = $e.parents('.details-ia').prev().attr('data-id');
    if (!identifier)
      return false;

    var $note = $e.parents('.note');

    var val='';
    if ($e.text()=='edit'){
      val = $note.find('span:first').text();
      val = val.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    $note.hide();
    var $append = $note.parent();
    $append.append($('\
<form class="form form-horizontal note" role="form" onsubmit="AJS.editedNote(this);return false">\
  <div class="form-group">\
    <div class="col-xs-2 col-md-1 col-lg-1">\
      <b>Note:</b>\
    </div>\
    <div class="col-xs-10 col-md-6 col-lg-7">\
      <textarea class="form-control" name="comments">'+val+'</textarea>\
      <div class="clearfix visible-xs-block"></div>\
    </div>\
    <div class="clearfix visible-xs-block"></div>\
    <div class="col-xs-12 col-md-5 col-lg-4 btns">\
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-success btn-xs">Save</button>\
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-info btn-cancel btn-xs">Cancel</button>\
      <button type="button" onclick="AJS.editedNote(this)" class="btn btn-danger btn-xs'+(val?'':' hidden')+'">Remove</button>\
    </div>\
  </div>\
</form>\
'));

    return false;
  };
  AJS.editedNote = function(e){
    var $e=$(e);

    var identifier = $e.parents('.details-ia').prev().attr('data-id');
    if (!identifier)
      return;

    // if user hit [return] and submitted form, etc.
    // treat it like they hit the [Save] button
    if ($e.is('form'))
      $e = $e.find('button:contains("Save")');

    var action=$e.text();
    var $parent=$e.parents('.note');
    var $origNote = $parent.prev();

    if (action=='Save'  ||  action=='Remove'){
      var val  = (action=='Save' ? $parent.find('textarea').val() : '');
      var url='/bookmarks.php?identifier='+identifier+'&kind='+AJS.addingNotesKind+'&add_comment='+encodeURIComponent(val);
      log('get '+url);
      $.get(url, function(htmReply){
        var htm = (val ?
                   'Note: "<span>'+(val.replace(/</g,'&lt;').replace(/>/g,'&gt;'))+
                   '</span>" <span class="edit">(<a href="#" onclick="return AJS.editNote(this)">edit</a>)</span>' :
                   AJS.addNoteHTM.html());
        $origNote.html(htm).show(); // show the "Note: ..." section again (with now appropriately updated innards)
        $parent.remove(); // lose the form
      });
      return;
    }
    // else Cancel does nothing but below...

    $origNote.show(); // show the "Note: ..." section again
    $parent.remove(); // lose the form
  };


}( jQuery ));








/*********************************************************************************************
 *
 *
 *    THIRD PARTY INCLUDES WE CANT LIVE WITHOUT! 8-)
 *
 *
 *********************************************************************************************/


/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }

        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';

        if (navigator.userAgent.indexOf('MSIE 9.')>0){ // IE9 sucks and can kiss it (tracey may2012)
          domain='';
          path='';
        }

        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
        return true;
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};



/*
 * jQuery doTimeout: Like setTimeout, but better! - v1.0 - 3/3/2010
 * http://benalman.com/projects/jquery-dotimeout-plugin/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($){var a={},c="doTimeout",d=Array.prototype.slice;$[c]=function(){return b.apply(window,[0].concat(d.call(arguments)))};$.fn[c]=function(){var f=d.call(arguments),e=b.apply(this,[c+f[0]].concat(f));return typeof f[0]==="number"||typeof f[1]==="number"?this:e};function b(l){var m=this,h,k={},g=l?$.fn:$,n=arguments,i=4,f=n[1],j=n[2],p=n[3];if(typeof f!=="string"){i--;f=l=0;j=n[1];p=n[2]}if(l){h=m.eq(0);h.data(l,k=h.data(l)||{})}else{if(f){k=a[f]||(a[f]={})}}k.id&&clearTimeout(k.id);delete k.id;function e(){if(l){h.removeData(l)}else{if(f){delete a[f]}}}function o(){k.id=setTimeout(function(){k.fn()},j)}if(p){k.fn=function(q){if(typeof p==="string"){p=g[p]}p.apply(m,d.call(n,i))===true&&!q?o():e()};o()}else{if(k.fn){j===undefined?e():k.fn(j===false);return true}else{e()}}}})(jQuery);
