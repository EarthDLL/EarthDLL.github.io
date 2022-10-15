var url = "ws://45.125.44.23:10067";
var Name;var QQ;var Key;

var emoji_count=65;
var pic_count = 25;
var can_send_pic = true;

var server_conn = false;
var Server;

function login(){
	login_tip("连接中");
	if(server_conn === true){
	login2()
	}
	else{
	Server = new WebSocket(url);
	Server.onopen = function()
    {
    server_conn = true;
	login2();
    }
	Server.onclose = function()
	{
	show_system_message("断开连接，请重新登录");
	login_tip("服务器正在挂机");
	}
	Server.onmessage = function(event){
		Recived(event)
	}
	}
	
}
function login2(){
	if (document.getElementById("login_key").value === ""){
		if(document.getElementById("login_name").value !== "" && document.getElementById("login_pass").value !== ""){
			login_by_password();
		}
		else{
		login_tip("你没填就登录是吧?");
		}
	}
	else{
	login_by_key()
	}
}

function login_tip(text){
	document.getElementById("login_btn").innerHTML = text
}

function login_by_password(){
	var mess = JSON.stringify({
		"event":"login",
		"type":"password",
		"qq":document.getElementById('login_name').value,
		"pass":document.getElementById('login_pass').value,
	});
	Server.send(mess)
}

function login_by_key(){
	var mess = JSON.stringify(
	{
		"event":"login",
		"type":"key",
		"key":document.getElementById("login_key").value
	})
	send(mess);
}
function login_by_pass(){}


function Recived(event){
	var mess = JSON.parse(event.data);
	console.log(mess);
	switch(mess.event){
		case "login_successed":
			Name = mess.name;
			Id = mess.Id;
			QQ = mess.qq;
			Key = mess.key;
			login_successed();
			set_cookie(mess.key);
			break;
		case "system_message":
			if(typeof(mess.online === "string")){
				show_system_message(mess.mess,mess.online);
			}
			else{
				show_system_message(mess.mess);
			}
			break;
		case "chat":
			if(mess.type === "text"){
				show_chat(mess.name,mess.mess,mess.head,mess.time,"text");
			}
			if(mess.type === "pic"){
				show_chat(mess.name,mess.mess,mess.head,mess.time,"pic");
			}
			break;
		case "login_refuse":
			if(mess.type === "password"){
			document.getElementById('login_btn').innerHTML = "自己检查密码去";
			}
			if(mess.type === "ban"){
			document.getElementById('login_btn').innerHTML = "你已被封";
			}
			break;
		case "changed":
			switch(mess.type){
				case "key":
				document.getElementById('key').innerHTML = mess.key;
				document.getElementById('change_key_btn').innerHTML = "成功";
				break;
				case "name":
				document.getElementById('change_name_btn').innerHTML = "成功";
				break;
				case "pass":
				document.getElementById('change_pass_btn').innerHTML = "成功";
				break;
				case "qq":
				document.getElementById('change_qq_btn').innerHTML = "成功";
				break;
			}
		case "unchat":
			if(mess.type === "left_time"){
				left_time = parseInt(mess.time)/10*600;
				show_left_time();
			}
	}
}

var left_time;
function show_left_time(){
	document.getElementById('input_bar').placeholder = "禁言剩余时间:"+left_time/10+"s";
	left_time--;
	if(left_time > 0){
	setTimeout(show_left_time,100);
	}
	if(left_time === 0){
		document.getElementById('input_bar').placeholder = "在此处键入聊天信息吧";
	}
}
function send(mess){
	Server.send(mess)
}

function login_successed(){
	document.getElementById('login_page').style.display = "none";
	document.getElementById('key').innerHTML = Key;
	document.getElementById('new_qq').value = QQ;
	document.getElementById('new_name').value = Name;
}

function show_system_message(message,online = false){
	var mess ='<div style="margin-top:10px;width:100%;overflow:hidden;"><div class="sys_mess_bg  text_out" style="display:block">'+message+'</div></div>';
	setTimeout("clear_out()",250);
	document.getElementById('text_page').innerHTML += mess;
	if(online !== false){
		document.getElementById('people_count').innerHTML = "人数:" + online;
	}
}

function send_chat(){
	var mess = document.getElementById('input_bar').value;
	if(mess !== ""){
	document.getElementById('input_bar').value = ""
	send(JSON.stringify({
		"event":"chat",
		"mess":mess,
		"type":"text"
	}))
	}
}

function send_pic(pic_id){
	if(pic_id !== "" && can_send_pic === true){
		can_send_pic = false;
		setTimeout(function(){can_send_pic = true},2500)
		document.getElementById('input_bar').value = ""
		send(JSON.stringify({
			"event":"chat",
			"mess":pic_id,
			"type":"pic"
		}))
	}
}
function clear_out(){
	var goal = document.getElementsByClassName('text_out');
	for(var cf=0; cf<goal.length;cf++){
		goal[cf].className = goal[cf].className.replace(' text_out', '');
	}
}
function show_chat(name,mess,head,date,type){
	var dis = check_time(date);
	dis = dis+'['+date.hour+':'+date.minute+']';
	
	if(type === "text"){
	var html_mess = '<div style="margin-top:10px;overflow:hidden;" class="chat_bar text_out"><div class="mess_name">'+name+" "+dis+'</div><div class="mess_bg"><img src="'+head+'" class="head_img"/></div><div class="word_bg"><div class="words">'+mess+'</div></div></div>';
	setTimeout("clear_out()",250);
	for(var cf=0;cf<mess.length;cf++){
		if(mess[cf] === "[" && mess[cf+1] === "%"){
			var start = cf;
			var finish = -1;
			var emoji_text = "";
			for(var cf1=cf;cf1<mess.length;cf1++){
				if(mess[cf1] === "%" && mess[cf1+1] === "]"){
					for(var cf2=start;cf2<=(cf1+1);cf2++){
						emoji_text += mess[cf2]
					}
					cf1 = mess.length;
					var emoji = emoji_text.replace("[%","").replace("%]","");
					html_mess = html_mess.replace(emoji_text,'<img class="emoji" src="https://earthdll.github.io/emoji/'+emoji+'.png"></img>');
				}
			}
		}
	}
	}
	if(type === "pic"){
		var html_mess = '<div style="margin-top:10px;overflow:hidden;" class="chat_bar  text_out"><div class="mess_name">'+name+" "+dis+'</div><div class="mess_bg"><img src="'+head+'" class="head_img"/></div><image src="http://earthdll.github.io/pic/'+mess+'.jpg" class="pic"/></div>';
		setTimeout("clear_out()",250);
	}
	
	document.getElementById("text_page").innerHTML += html_mess;
}
function change(type){
	switch(type){
		case "qq":
			var text = document.getElementById('new_qq').value;
			Server.send(JSON.stringify({
				"event":"change",
				"type":"qq",
				"qq":text
			}));
			break;
		case "pass":
			var old_pass = document.getElementById('old_pass').value;
			var new_pass = document.getElementById('new_pass').value;
			Server.send(JSON.stringify({
				"event":"change",
				"type":"pass",
				"new_pass":new_pass,
				"old_pass":old_pass,
			}));
			break;
		case "key":
			Server.send(JSON.stringify({
				"event":"change",
				"type":"key"
			}));
			break;
		case "name":
			var text = document.getElementById('new_name').value;
			Server.send(JSON.stringify({
				"event":"change",
				"type":"name",
				"name":text
			}));
			break;
	}
}
var emoji_show_count = 1;
var pic_show_count = 1;
function show_pic(){
	var bar = document.getElementById('pic_bar');
	var pic_info = "";
	var max_count = pic_show_count*8;
	if( max_count > pic_count){max_count = pic_count}
	for(var cf=(pic_show_count-1)*8;cf<max_count;cf++){
		pic_info +='<div class="pic_before_bar"><img src="https://earthdll.github.io/pic/'+cf.toString()+'.jpg" class="pic_in_bar" onclick="add_pic(\''+cf.toString()+'\')"/></div>';
	}
	bar.innerHTML = pic_info;
}





function show_emoji(){
	var bar = document.getElementById('emoji_bar');
	var emoji_info = "";
	var max_count = emoji_show_count*30;
	if( max_count > emoji_count){max_count = emoji_count}
	for(var cf=(emoji_show_count-1)*30;cf<max_count;cf++){
		emoji_info +='<div class="emoji_before_bar"><img src="https://earthdll.github.io/emoji/'+cf.toString()+'.png" class="emoji_in_bar" onclick="add_emoji(\''+cf.toString()+'\')"/></div>';
	}
	bar.innerHTML = emoji_info;
}
function emoji_up(){
	if(emoji_show_count > 1){
	emoji_show_count --;
	}
	show_emoji();
	
}
function emoji_down(){
	emoji_show_count ++;
	show_emoji();
}

function add_emoji(count){
	document.getElementById('input_bar').value += '[%'+count+'%]';
}
var emoji_state = false;
function open_emoji(){
	if(emoji_state === false){
		show_emoji();
		document.getElementById('emoji_all').style.display = "block";
		emoji_state = true;
	}
	else{
		document.getElementById('emoji_all').style.display = "none";
		emoji_state = false;
	}
}
var pic_state = false;
function open_pic(){
	if(pic_state === false){
		show_pic();
		document.getElementById('pic_all').style.display = "block";
		pic_state = true;
	}
	else{
		document.getElementById('pic_all').style.display = "none";
		pic_state = false;
	}
}

function pic_up(){
	if(pic_show_count > 1){
	pic_show_count --;
	}
	show_pic();
	
}
function pic_down(){
	pic_show_count ++;
	show_pic();
}

function add_pic(count){
	send_pic(count);
}

function clear_bar(){
	document.getElementById('text_page').innerHTML = "";
}


window.onerror = function(errorMessage, scriptURI, lineNumber,columnNumber,errorObj) {
   show_system_message("错误信息：" + errorMessage);
   show_system_message("出错文件：" + scriptURI);
   show_system_message("出错行号：" + lineNumber);
   show_system_message("出错列号：" + columnNumber);
   show_system_message("错误详情：" + errorObj);
}

function set_cookie(Key){
	var cook_time = new Date();
	cook_time.setTime(cook_time.getTime()+(7*24*60*60*1000));
	var expires = "expires="+cook_time.toGMTString();
	document.cookie = "Key="+Key+";"+expires;
	get_cookie();
	}

function get_cookie(){
	var cookies = document.cookie;
	if(typeof(cookies) === "string"){
		cookies = cookies.split(";");
		cookies = cookies[0].split(":");
	}
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

function check_time(the_date){
	var now_date = date()
	if(now_date.month*30+now_date.day > the_date.month*30+the_date.day ){
		var distance = now_date.month*30+now_date.day - the_date.month*30+the_date.day;
		return distanc+"天前"
	}
	else{
		var distance = now_date.hour*60*60 + now_date.minute*60 + now_date.second -the_date.hour*60*60 - the_date.minute*60 - the_date.second
		if(distance <= 5){
			return "刚刚"
		}
		if(distance < 60 ){
			return distance+"秒前"
		}
		if(distance > 60 && distance < 60*60){
			return (distance-distance%60)/60+"分钟前"
		}
		if(distance > 60*60 && distance < 60*60*24){
			return (distance-distance%60*60)/(60*60)+"小时前"
		}
	}
}