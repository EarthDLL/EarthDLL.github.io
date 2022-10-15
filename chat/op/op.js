var url = "ws://45.125.44.23:10067";

var server_conn = false;
var Server = new WebSocket(url);
	Server.onopen = function()
    {
    
    }
	Server.onmessage = function(event){
		var mess = JSON.parse(event.data);
		var the_mess = mess.mess;
		for(var cf=0;cf<the_mess.length;cf++){
		the_mess = the_mess.replace(";","\n");
		}
		if(mess.event = "op_command"){
			document.getElementById("result").innerHTML = "["+mess.type+"]"+ the_mess;
		}
	}
function send(){
	var pass = document.getElementById("password").value;
	var command = document.getElementById("command").value;
	Server.send(JSON.stringify({
		"event":"op_command",
		"pass":pass,
		"command":command
	}))
}



