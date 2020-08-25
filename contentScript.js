function interceptData() {
  var xhrOverrideScript = document.createElement('script');
  xhrOverrideScript.type = 'text/javascript';
  xhrOverrideScript.innerHTML = `
  (function() {
    var XHR = XMLHttpRequest.prototype;
    var send = XHR.send;
    var open = XHR.open;
    XHR.open = function(method, url) {
        this.url = url; // the request url
        return open.apply(this, arguments);
    }
    XHR.send = function() {
        this.addEventListener('load', function() {
            if (this.url.includes('gurushots.com/rest')) {
                var dataDOMElement = document.createElement('div');
                dataDOMElement.className = '__interceptedData';
                dataDOMElement.innerText = this.response;
				dataDOMElement.setAttribute("req_url", this.url);
                dataDOMElement.style.height = 0;
                dataDOMElement.style.overflow = 'hidden';
                document.body.appendChild(dataDOMElement);
            }               
        });
        return send.apply(this, arguments);
    };
  })();
  `
  document.head.prepend(xhrOverrideScript);
}
function checkForDOM() {
  if (document.body && document.head) {
    interceptData();
  } else {
    requestIdleCallback(checkForDOM);
  }
}
requestIdleCallback(checkForDOM);
var checkIntervalRunning = false;
setInterval(function(){
    if(!checkIntervalRunning) {
        checkIntervalRunning = true;
        console.log("timer content");
        let objs = document.getElementsByClassName('__interceptedData');
        for (var i = 0; i < objs.length; i++) {
            let element = objs[i];
            let target_url = element.getAttribute('req_url');
            console.log(element);
            if (target_url.includes("get_member_joined_active_challenges")) {

                try {
                    chrome.runtime.sendMessage({type:'traffic', url: target_url, data_body: element.innerHTML}, function (response) {
                        console.log(response);
                    });
                } catch (e) {

                }
            }
            element.remove();
        }
        checkIntervalRunning = false;
    }
		
}, 5000)