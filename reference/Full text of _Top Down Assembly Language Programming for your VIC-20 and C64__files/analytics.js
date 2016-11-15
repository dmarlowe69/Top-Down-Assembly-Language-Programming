var startTime = new Date();

var archive_analytics = {
  values: {},


  // 2nd param: [optional] callback to invoke once ping to analytics server is done
  // 3rd param: [optional] logical truthy -- set to true/1 to add some archive.org site-specific values
  send_ping: function(values, onload_callback, augment_for_ao_site) {
    var img_src = "//analytics.archive.org/0.gif";

    var format_ping = function(values) {
      var ret = [];
      var count = 2;
      var version = 2;
      
      for (var data in values) {
        ret.push(encodeURIComponent(data) + "=" + encodeURIComponent(values[data]));
        count = count + 1;
      }
      
      ret.push('version=' + version);
      ret.push('count=' + count);
      return ret.join("&");
    };
    
    
    if (augment_for_ao_site){
      if (!values['service']){
        var inbeta = (';'+document.cookie).match(/;[ ]*ui3=/) ? 1 : 0;
        //console.log('INBETA:'+inbeta);
        values['service'] = (inbeta ? 'ao_2' : 'ao');
      }
    }
    
    var string = format_ping(values);
    
    var loadtime_img = new Image(100,25);
    if (onload_callback  &&  typeof(onload_callback)=='function')
      loadtime_img.onload = onload_callback;
    loadtime_img.src = img_src + "?" + string;
  },
send_scroll_fetch_event: function(page) {
  var endTime = new Date();
  archive_analytics.send_ping({
    'service':'ao_2',
    'kind':'event',
    'ec':'page_action',
    'ea':'scroll_fetch',
    'el':location.pathname,
    'ev':page,//int
    'loadtime':(endTime.getTime() - startTime.getTime()),
    'cache_bust':Math.random()
  });
},
send_scroll_fetch_base_event: function() {
  var endTime = new Date();
  archive_analytics.send_ping({
    'service':'ao_2',
    'kind':'event',
    'ec':'page_action',
    'ea':'scroll_fetch_base',
    'el':location.pathname,
    'loadtime':(endTime.getTime() - startTime.getTime()),
    'cache_bust':Math.random()
  });
},
  _onload_func: function() {//logically private

    var get_locale = function() {
      if (navigator) {
        if (navigator.language)
          return navigator.language;
        
        else if (navigator.browserLanguage)
          return navigator.browserLanguage;
        
        else if (navigator.systemLanguage) 
          return navigator.systemLanguage;
        
        else if (navigator.userLanguage)
          return navigator.userLanguage;
      }
      return '';
    };
    
    
    var endTime = new Date();
    
    // Set field values    
    archive_analytics.values['kind'     ] = 'pageview';
    archive_analytics.values['loadtime' ] = endTime.getTime() - startTime.getTime();
    archive_analytics.values['timediff' ] = (new Date().getTimezoneOffset()/60)*(-1); // *timezone* diff from UTC
    archive_analytics.values['locale'   ] = get_locale();
    archive_analytics.values['referrer' ] = (document.referrer == '' ? '-' : document.referrer);
    
    archive_analytics.send_ping(archive_analytics.values);
  }
}
// FLIGHTS.

var flights = {
  url: 'https://analytics.archive.org/0.gif',
  timeout: 1000,
  values: {}
};

window['flights'] = flights;
//console.log("Loading the flights module.")

flights.flight = function (from_el) {
  return flights.experiment_data_attribute('xvar', from_el, 'production');
};

flights.experiment_name = function (from_el) {
  return flights.experiment_data_attribute('xid', from_el, 'production');
};

flights.context = function (from_el) {
  return flights.experiment_data_attribute('ec', from_el, window.location.pathname);
};

flights.anonymous_client_id = function (from_el) {
  return flights.experiment_data_attribute('cid', from_el, null);
};

flights.app_id = function (from_el) {
  return flights.experiment_data_attribute('app', from_el, null);
};

flights.conversion_data = function (from_el) {
  var data = {};
  var collect_attr = 'data-collect-id';
  var collect_attr_q = '[' + collect_attr + ']';
  var found_data_in_children = false;
  $(from_el).find(collect_attr_q).each(function (index,
    element) {
    var key = element.getAttribute(collect_attr) || element.id;
    if (key) {
      found_data_in_children = true;
      data[key] = element.value || element.getAttribute("data-collect-value");
    }
  });
  if (!found_data_in_children) {
    var siblings = $(from_el).siblings().not(from_el)
    if (siblings) {
      siblings.each(function (index, sibling) {
        var key = sibling.getAttribute(collect_attr) || sibling.id;
        if (key) {
          data[key] = sibling.value || sibling.getAttribute("data-collect-value");
        }
      });
    }
  };
  return data;
};

flights.event = function (from_el, data) {
  var cid = flights.anonymous_client_id(from_el);
  var endTime = new Date();
  if (cid) {
    data['cid'] = cid;
  }
  for (var key in flights.values) {
    data[key] = flights.values[key];
  }
  data['v'] = 1;
  data['t'] = 'event';
  data['kind'] = 'event';
  data['xid'] = flights.experiment_name(from_el);
  data['xvar'] = flights.flight(from_el);
  data['ec'] = flights.context(from_el);
  data['app'] = flights.app_id(from_el);
  data['locale'] = flights.get_locale();
  data['referrer'] = (document.referrer === '' ? '-' : document.referrer);
  data['loadtime'] = endTime.getTime() - startTime.getTime();
  data['timediff'] = (endTime.getTimezoneOffset() / 60) * (-1); // *timezone* diff from UTC
  flights.experiment_data_extra_attributes(from_el, data);
  data['count'] = 0;
  data['count'] = Object.keys(data).length;
  flights.send_ping(flights.url, data, flights.timeout, true, function (x) {
    //console.log("The ping has been sent.");
  })
};

flights.participate = function (from_el) {
  var data = {};
  data['ea'] = 'participate';
  return flights.event(from_el, data);
};

flights.convert = function (from_el) {
  var data = flights.conversion_data(from_el);
  data['ea'] = 'convert';
  return flights.event(from_el, data);
};

/* For browers, initialize so that handlers are added based on data- attributes.
   data-participate="Experiment Name" sends a participate event on load
     for experiment "Experiment Name"
   data-convert="Experiment Name" adds an on-click handler for the the item
   data-convert-onload="Experiment" sends a convert event on load
   In all of these cases, the default 'experiment' is "production", so it
   doesn't need to be defined.
   elements with data-collect="Experiment Name" will put send data along
   with the event, getting the key name from data-collect-id and the value from data-collect-value.
   In the usual way, if a name starts with n_, it will be treated as numeric (and
   the n_ prefix will be stripped). Otherwise, it will be sent as a string value.

   Note that anchor (A) elements so decorated will also send a synchronous ping
   so the async convert has a better chance of firing.
*/
flights.init = function () {
  //console.log("Initializing...")
  //console.log("Converting data-participate nodes...")
  $("[data-participate]").each(function (index, element) {
    flights.participate(element);
    //console.log("You've participated!")
  });
  // prevent the default behavior of going to the page for anchors
  //console.log("Converting data-convert nodes ...")
  $("[data-convert]").click(function (event) {
    // this is the element the event is attached to ...
    flights.convert(this);
    //console.log("You've been converted!")
  });
  //console.log("Converting data-convert-onload nodes ...")
  $("[data-convert-onload]").each(function (index, element) {
    flights.convert(element);
    //console.log("You've been converted on load!")
  });
  //console.log("End of Initializing ...")
};

flights.send_ping = function (uri, params, timeout, is_async, callback) {
  var url = flights.ping_uri(uri, params);
  var loadtime_img = new Image(100, 25);
  if (callback && typeof (callback) === 'function')
    loadtime_img.onload = callback;
  loadtime_img.src = url;
  //console.log(loadtime_img.src)
  window.loadtime_img = loadtime_img;
};

flights.ping_uri = function (endpoint, params) {
  var query_string = [];
  var e = encodeURIComponent;
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      var vals = params[key];
      if (Object.prototype.toString.call(vals) !== '[object Array]') {
        vals = [vals];
      }
      for (var i = 0; i < vals.length; i += 1) {
        query_string.push(e(key) + '=' + e(vals[i]));
      }
    }
  }
  if (query_string.length) {
    endpoint += '?' + query_string.join('&');
  }
  return endpoint;
};
// given an attribute (like xid), and an element, return the
// value of the data-ATTRIBUTE (eg data-xid) of the closest
// ancestor of the element (including the element itself).
// if such an ancestor is *not* found, return the default value.
// used to collect data-xid, data-xvar, data-ec, data-cid
// this can be overridden by putting ATTRIBUTE=VALUE in the
// URL (for example, something.html?xid=34), in which case
// the query value is returned. This is useful for manually
// setting a flight, for example. something.html?xvar=Blue
flights.experiment_data_attribute = function (attribute, from_el, default_value) {
  var regex = new RegExp('[\\?&]' + attribute + '=([^&#]*)');
  var results = regex.exec(decodeURIComponent(window.location.search));
  if (results != null) {
    var value = decodeURIComponent(results[1].replace(/\+/g, ' '));
    return value;
  }
  var data_attribute = 'data-' + attribute;
  var data_attribute_q = '[' + data_attribute + ']';
  var closest = $(from_el).closest(data_attribute_q);
  if (closest && closest.length > 0) {
    var value = closest[0].getAttribute(data_attribute);
    return value;
  }
  return default_value;
};

// collect data-flight-X=value, and add them add them as X=value
// these can also be set via a URL attribute
// setting a flight, for example. something.html?flight-app=Groovebox
flights.experiment_data_extra_attributes = function (from_el, data) {
  var re1 = /^data-flight-(.+)$/;
  // if reverse order of all ancestors and self:
  var elements = $(from_el).parents().andSelf();
  var reversed_elements = elements.toArray().reverse();
  // get the matching nodes
  $.each(reversed_elements, function (i, elem) {
      $.each(elem.attributes, function (index, attr) {
        if (re1.test(attr.nodeName)) {
          var key = attr.nodeName.match(re1)[1];
          //console.log("data extra attributes: Setting ", key, " to ", attr.nodeValue);
          data[key] = attr.nodeValue;
        }
      })
   });

  // get, maybe overiding, data from URI
  var re2 = /[\\?&]data-flight-([^=])=([^&#]*)/;
  var result;
  var text = decodeURIComponent(window.location.search);
  while ((result = re2.exec(text)) !== null) {
    data[result[0]] = result[1];
  }
  return data;
};

flights.get_locale = function () {
  if (navigator.languages !== undefined)
    return navigator.languages[0];
  else
    return navigator.language;
};

archive_analytics.get_data_packets = function () {
  return [archive_analytics.values, flights.values];
}

$(window).load(archive_analytics._onload_func);
