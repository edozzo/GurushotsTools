const output = document.querySelector('.analysis-output');
/*
chrome.devtools.network.onRequestFinished.addListener(request => {
	output.innerHTML="asasas";
});
*/

function appendHtml(dataToAppend, color) {
	var p_block = document.createElement("p"); 
	p_block.style.color = "red";
	p_block.innerText = dataToAppend;
	
	output.append(p_block);
}

chrome.devtools.network.onRequestFinished.addListener(request => {
	if (request.request && request.request.url) {
			request.getContent((body) => {
				if (request.request.url.includes('gurushots.com/rest/get_member_joined_active_challenges')) {	
					appendHtml(request.request.url, 'red');
					//appendHtml(body);
					
					var act_ch_obj = JSON.parse(body);
					
				}
			});
		
	}
  
});