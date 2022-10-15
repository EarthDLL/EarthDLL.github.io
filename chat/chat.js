const ws = require("nodejs-websocket");
//引入websocket模块
const fs = require("fs");
//引入fs文件管理系统nodejs自带
const http = require("http");
//引入http模块
const path = require("path");
//引入路径管理系统nodejs自带
const url = require("url");

var Players = [];
var conns = [];
var op_password = "409yyds";
var history_mess = new Array();
var max_words = 600;
var api_key = "b371d2d0018ec1fd7b59caa4999acb94"

setTimeout(less_time,6000)
function less_time(){
	for(var cf=0;cf<Players.length;cf++){
		if(Players[cf].left_time > 0){
			Players[cf].left_time = Players[cf].left_time - 1
		}
		if(Players[cf].left_time == 0){
			Players[cf].left_time = -1
			can_chat(cf)
		}
	}
	save_config(false);
	setTimeout(less_time,6000)
}
function date(type = "object"){
	var date = new Date;
	if (type == "string"){
		var the_date = '['+date.getFullYear()+' '+(date.getMonth()+1)+' '+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+"]";
	return the_date;
	}
	else{
		var the_date = {
			"month":date.getMonth()+1,
			"day":date.getDate(),
			"hour":date.getHours(),
			"minute":date.getMinutes(),
			"second":date.getSeconds()
		}
		return the_date
	}
}
var Uers_File;
	Uers_File = fs.open("Users.ini","r",function(err,fd){
		if(err){
			log("No User File!Made New One!");
			var New_File = fs.open("Users.ini","w",function(err,fd2){
			fs.close(fd2,function(err){});});
		}
		else{
			fs.close(fd,function(err){})
			read_config();
		}
	})
/*
	用户信息:
	1.id(从1开始的ID)int
	2.name(昵称)String
	3.password(密码)16进制
	4.key(免登key)String
	5.qq(QQ号码)string
	6.头像url String
	7.是否被ban()Boolean
*/
var port = 10067;

function send_to_all(text){
	server.connections.forEach((conn)=>{
		if(typeof(conn.qq)==="string" && Players[conn.index].is_ban === false){
			conn.send(text)
		}
	});
}

function get_people(){
	var people = 0;
	server.connections.forEach((conn)=>{
		if(typeof(conn.qq)==="string"){
			people++;
		}
	});
	return people.toString();
}


function can_chat(index){
	send_to_all(JSON.stringify({
		"event":"system_message",
		"mess":Players[parseInt(index)].name+"被解禁"
	}));
	Players[parseInt(index)].is_chat = true;
}
	

var server = ws.createServer(function(conn){
	log("New Connect!IP:"+conn.socket.remoteAddress);
	
	function get_ip_text(index){
	var host_name = {
		host: 'opendata.baidu.com',
		path: '/api.php?query='+conn.socket.remoteAddress+'&co=&resource_id=6006&oe=utf8'
	};
	var req = http.request(host_name, function(response) {
	response.setEncoding('utf-8');
	var str = "";
	var mess = "";
	response.on('data', function (chunk) {
		str += chunk;
	});
	response.on('end', function () {
		str = JSON.parse(str);
		if(str.data.length > 0){
		mess = "人在"+str.data[0].location;
		}
		var onlinePeople = get_people();
		send_to_all(JSON.stringify({
			"event":"system_message",
			"mess":Players[index].name+" 来了啊！"+mess,
			"online":onlinePeople
		}))
	});
	});
	req.end();
	}
	
	function robot(text){
	var host_name = {
		host: 'api.qingyunke.com',
		path: '/api.php?key=free&appid=0&msg={'+encodeURI(text)+'}'
	};
	var req = http.request(host_name, function(response) {
	response.setEncoding('utf-8');
	var str = "";
	var mess = "";
	response.on('data', function (chunk) {
		str += chunk;
	});
	response.on('end', function () {
		str = JSON.parse(str);
		mess = str.content;
		send_to_all(JSON.stringify({
			"event":"chat",
			"name":"坤坤",
			"head":"https://earthdll.github.io/pic/kun.png",
			"mess":mess,
			"time":date(),
			"type":"text"
		}))
	});
	});
	req.end();
	}
	
	function English(text){
	var host_name = {
		host: 'api.a20safe.com',
		path: '/api.php?api=30&key=b371d2d0018ec1fd7b59caa4999acb94&text='+encodeURI(text)
	};
	var req = http.request(host_name, function(response) {
	response.setEncoding('utf-8');
	var str = "";
	var mess = "";
	response.on('data', function (chunk) {
		str += chunk;
	});
	response.on('end', function () {
		str = JSON.parse(str);
		
		if(str.data.length === 1){
		mess = str.data[0].result;
		send_to_all(JSON.stringify({
			"event":"chat",
			"name":"翻译官",
			"head":"https://earthdll.github.io/pic/kun.png",
			"mess":mess,
			"time":date(),
			"type":"text"
		}))
		}
	});
	});
	req.end();
	}
	
	conn.on("text", function(text) {
		var mess = JSON.parse(text);
		switch(mess.event){
			case "login":
				log("Logining...");
				if(mess.type==="key"){login(mess.type,mess.key,"none",conn)}
				if(mess.type==="password"){login(mess.type,mess.pass,mess.qq,conn)}
				break;
			case "chat":
				if(typeof(conn.qq)==="string" && Players[conn.index].is_chat === true && Players[conn.index].is_ban === false){
					if(mess.mess.length <= max_words){chat(mess);}
					else{unchat(conn.index,2,"system","疑似刷屏");}
				}
				break;
			case "op_command":
				if (mess.pass === op_password){
					var op_mess = op(mess.command);
					conn.send(JSON.stringify({
						"event":"op_command",
						"type":"info",
						"mess":op_mess
					}))
				}
				else{
					conn.send(JSON.stringify({
						"event":"op_command",
						"type":"error",
						"mess":"password is wrong"
					}))
				}
				break;
			case "change":
				var back = change(mess);
				conn.send(JSON.stringify(back));
				break;
		}
		
	});
	
	function login(type="key",password,qq,conn){
		var index = "";
		var refuse_type = "password";
	if(type === "key"){
	for(var cf=0;cf<Players.length;cf++){
		if(Players[cf].key === password ){
			if(Players[cf].is_ban == false){
			index = cf;
			}
			else{refuse_type="ban";}
	}}}
	if(type === "password"){
	for(var cf=0;cf<Players.length;cf++){
		if(Players[cf].password === password && Players[cf].qq === qq){
			if(Players[cf].is_ban == false ){
				index = cf;
			}
			else{
				refuse_type="ban";
			}
	}}}
	
	if(index !==""){
			conn.is_login = true;
			conn.index = index;
			conn.key = Players[index].key;
			conn.qq = Players[index].qq;
			conn.is_ban = Players[index].is_ban;
			conn.name = Players[index].name;
			conn.head = Players[index].head;
			conn.is_chat = true;
			conn.password = Players[index].password;
			log("Logining Successed!")
			conn.send(JSON.stringify({
				"event":"login_successed",
				"name":Players[index].name,
				"qq":Players[index].qq,
				"key":Players[index].key,
			}))
			send_histroy();
			if(Players[index].is_chat == false){
				send_unchat_time(index , Players[index].left_time);
			}
			get_ip_text(conn.index);
		}
		else{
			conn.send(JSON.stringify({
				"event":"login_refuse",
				"type":refuse_type
			}))
		}
	}
	
	function send_histroy(){
		for(var cf=0;cf<history_mess.length;cf++){
			conn.send(history_mess[cf]);
		}
	}
	
	function send_unchat_time(index , time){
		server.connections.forEach((conn)=>{
		if(conn.index === index){
			conn.send(JSON.stringify({
				"event":"unchat",
				"type":"left_time",
				"time":time
			}))
		}
		});
	}
	function unchat(index , time ,type,reason){
		Players[index].is_chat = false;
		Players[index].left_time = parseInt(time)*10;
		var mess = "";
		switch(type){
			case "admin":
				mess = Players[index].name+"被管理员禁言"+time+"分钟 理由:"+reason;
				break;
			case "system":
				mess = Players[index].name+"被系统禁言"+time+"分钟 理由:"+reason;
				break;
		}
		send_to_all(JSON.stringify({
			"event":"system_message",
			"mess":mess
		}));
		send_unchat_time(index , Players[index].left_time);
	}
	function op(command){
		var return_mess = "";
		var mand = command.split(' ');
		if(mand.length >=1){
		switch(mand[0]){
			case "new":
				if(mand.length === 2){
					new_user(mand[1]);
					return_mess = "Create New User!";
				}
				break;
			case "list":
				return_mess = JSON.stringify(Players);
				break;
			case "index":
				var back_mess = "";
				for(var cf=0;cf<Players.length;cf++){
					back_mess+="name:"+Players[cf].name+",index:"+cf.toString()+",qq:"+Players[cf].qq+";";
				}
				return_mess = back_mess;
				break;
			case "ban":
				if(Players[parseInt(mand[1])].is_ban === false){
				send_to_all(JSON.stringify({
					"event":"system_message",
					"mess":Players[parseInt(mand[1])].name+"被管理员封禁！"
				}));
				Players[parseInt(mand[1])].is_ban = true;
				return_mess = "ban sussessed!";
				}
				else{
					return_mess = "The User Have Been Ban!"
				}
				break;
			case "unban":
				if(parseInt(mand[1]) < Players.length){//判断是否有该用户,没有会出bug
				if(Players[parseInt(mand[1])].is_ban === true){
				Players[parseInt(mand[1])].is_ban = false;
				send_to_all(JSON.stringify({
					"event":"system_message",
					"mess":Players[parseInt(mand[1])].name+"被管理员解封！Welcome Back!"
				}));
				
				return_mess = "unban sussessed!";
				}
				else{
					return_mess = "The User Is Not Ban!"
				}
				}
				else{
					return_mess = "Can Not Find The User!";
				}
				break;
			case "unchat":
				if(parseInt(mand[1]) < Players.length){//判断是否有该用户,没有会出bug
				unchat(parseInt(mand[1]),parseInt(mand[2]),"admin",mand[3]);
				return_mess = "UnChat Successed!";
				}
				else{
					return_mess = "Can Not Find The User!";
				}
				break;
			case "admin":
				var mess = "";
				if (Players[parseInt(mand[1])].admin === false){
					Players[parseInt(mand[1])].admin = true;
					mess = Players[parseInt(mand[1])].name+"成为管理员";
					return_mess = "Change To Admin";
				}
				else{
					Players[parseInt(mand[1])].admin = false;
					mess = Players[parseInt(mand[1])].name+"被撤销管理员";
					return_mess = "Change To Member";
				}
				send_to_all(JSON.stringify({
					"event":"system_message",
					"mess":mess
				}));
				break;
			case "conn":
				server.connections.forEach((conn)=>{
					if(conn.is_login !== true){
						return_mess += "UnLogin;"
					}
					else{
						return_mess += "name:"+conn.name+",index"+conn.index+";"
					}
					
				});
		}
		}
		save_config();
		return return_mess;
	}
	
	function change(text){
		var message = {};
		if(conn.is_login === true){
		switch(text.type){
			case "qq":
				Players[conn.index].qq = text.qq;
				conn.qq = text.qq;
				Players[conn.index].head = "http://q.qlogo.cn/headimg_dl?dst_uin="+text.qq+"&spec=100&img_type=jpg";
				conn.head = "http://q.qlogo.cn/headimg_dl?dst_uin="+text.qq+"&spec=100&img_type=jpg";
				save_config();
				message = {"event":"changed","type":"name"};
				break;
			case "name":
				Players[conn.index].name = text.name;
				conn.name = text.name;
				save_config();
				message = {"event":"changed","type":"name"};
				break;
			case "key":
				var new_key = "";
				for(var cf=0;cf<24;cf++){
					new_key += Math.floor(Math.random()*10).toString();
				}
				Players[conn.index].key = new_key;
				conn.key = new_key;
				save_config();
				message = {"event":"changed","type":"key","key":new_key};
				break;
			case "pass":
				if(conn.password === text.old_pass){
					Players[conn.index].password = text.new_pass;
					conn.password = text.new_pass;
					save_config();
					message = {"event":"changed","type":"pass"};
				}
				break;
				
			}
			return message;
		}
	}
	
	function chat(mess){
		var chat_mess = JSON.stringify({
			"event":"chat",
			"name":conn.name,
			"head":conn.head,
			"mess":mess.mess,
			"time":date(),
			"type":mess.type
		})
		send_to_all(chat_mess);
		add_histroy(chat_mess);
		check_chat(mess.mess , conn.name);
		check_robot(mess.mess);
		if(mess.type === "pic"){
		var log_mess = date() + conn.name +'(' +conn.qq +'):Picture('+mess.mess+")\n";
		}
		else{
		var log_mess = date() + conn.name +'(' +conn.qq +'):'+mess.mess+"\n";
		}
		fs.writeFile("History.log",log_mess,{flag:"a"},(err)=>{})
	}
	
	function check_robot(text){
		if(text.includes("坤坤")){
			robot(text.replaceAll("坤坤",''))
		}
		if(text.includes("翻译官:")){
			text = text.replaceAll("翻译官:",'');
			English(text)
		}
		if(text.includes("翻译官：")){
			text = text.replaceAll("翻译官：",'');
			English(text)
		}
	}
	
	function check_chat(text , name){
		var same = 0;
		var max_for = history_mess.length-1;
		var mix_for = 0;
		if(history_mess.length > 5){mix_for = history_mess.length-5;}
		for(var cf=max_for;cf>=mix_for;cf--){
			var test = JSON.parse(history_mess[cf]);
			if(test.name === name && test.mess === text){
				same ++;
			}
		}
		if(same >= 5){
			unchat(conn.index,2,"system","刷屏");
		}
	}
	
	conn.on("close", function (code, reason) {
		if(typeof(conn.name) === "string"){
		send_to_all(JSON.stringify({
				"event":"system_message",
				"mess":conn.name+" 和坤坤玩去了",
				"online": get_people()
		}))
		}
        console.log("Connection closed")
    });
	conn.on("error", function (err) {
		log("Conn ERR!");
    });
}).listen(port , '0.0.0.0' , () =>{
log("websocket服务器建立完成！");
});
server.on("close", function (code, reason) {
     log("服务器关闭.代码:"+code+'.原因:'+reason);
    })//创建websocket服务器

//
function log(text){
	console.log(date("string")+" "+text)
}

function add_histroy(text){
	if(history_mess.length === 8){
		history_mess.splice(0,1);
		history_mess[history_mess.length]=text;
	}
	else{
		history_mess[history_mess.length]=text;
	}
}


//用户资料
function read_config(){
	log("Reading Users File...");
	fs.readFile("Users.ini","utf-8",function(err,data){
	if(data !== ""){
		Players = JSON.parse(data);
		for(var cf=0;cf<Players.length;cf++){
			//检查
			if(typeof(Players[cf].admin) === "undefined"){
				Players[cf].admin = false;
			}
			if(typeof(Players[cf].left_time) === "undefined"){
				Players[cf].left_time = -1;
			}
			if(Players[cf].left_time === -1 && Players[cf].is_chat === false){
				Players[cf].is_chat = true;
			}
		}
		log("Reading Successed!");
		save_config();
	}});
	
}
function save_config(show_to_log = true){
	var text = JSON.stringify(Players);
	text = text.replaceAll(",",",\n")
	fs.writeFile("Users.ini",text,(err)=>{});
	if(show_to_log === true){
		log("config save!")
	}
}

function new_user(qq){
	Players[Players.length] = {
		"name":"新用户114514",
		"qq":qq,
		"head":"http://q.qlogo.cn/headimg_dl?dst_uin="+qq+"&spec=100&img_type=jpg",
		"password":"123456",
		"key":"",
		"is_ban":false,
		"is_chat":true,
		"admin":false,
		"left_time": -1
	}
}