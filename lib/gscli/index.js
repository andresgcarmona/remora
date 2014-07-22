//Requirements
var fs 		= require('fs'),
	canvas  = require('clivas'),
	request = require('request'),
	spawn 	= require('child_process').spawn,
	inspect = require('util').inspect,
	md5 = require('md5'),
	crypto = require('crypto');

//Globals
var key = 'fun_carmona',
	secret = 'baaab103ab9c0867452d79abd3cc20a7',
	tinySongKey = 'bafe9c9ae18f6b0233c7ac63f568e73f',
	userAgent = 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36',
	token = '1febd4d31578bdd4f0324e4ce2b3f05c52c759d8b278b6',
	uuid = 'D7098F20-3A9B-48F0-839F-F1B6C9B62153';

var gsCli = function(){
	this.sessionID = null;
	this.streamServer = null;
};

gsCli.API_HOST = 'api.grooveshark.com';
gsCli.API_ENDPOINT = '/ws3.php';
gsCli.GROOVESHARK_URL = 'http://grooveshark.com/more.php';
gsCli.CLIENT = {
	'client': 'htmlshark',
	'clientRevision': '20130520.15',
	'privacy': 0,
};

gsCli.COUNTRY = {
	'CC1': 0,
	'CC2': 0,
	'CC3': 8388608,
	'CC4': 0,
	'DMA': 0,
	'ID': 152,
	'IPR': 0,
};

module.exports = gsCli;

gsCli.prototype.startSession = function(callback){
	var gs = this,
		options = {
			'method': 'startSession',
			'https': true
		};

	this.makeRequest(options, function(err, res, body){
		if(callback){
			gs.sessionID = body.result.sessionID;
			callback(err, body.result.sessionID);
		}
	});
};

gsCli.prototype.getSessionId = function(){
	return this.sessionID;
}

gsCli.prototype.authenticate = function(username, password, callback){
	if(username && password){
		var options = {
			'method': 'authenticate',
			'params': {
				'login': username,
				'password': crypto.createHash('md5').update(password).digest("hex")
			},
			'https': true
		};
		
		this.makeRequest(options, function(err, res, body){
			if(!body.result.UserID) callback(err, {});
			else callback(body.result);
		});
	}
	else{
		callback(false);
	}
};

gsCli.prototype.getUserTopArtists = function(userID){
	
};

gsCli.prototype.sampleRequest = function(){
	var options = {
		'method': 'getStreamKeyStreamServer',
		'params': {
			'songID': 2357801,
			'country': gsCli.COUNTRY
		}
	}, gs = this;

	this.makeRequest(options, function(err, res, body){
		gs.streamServer = body.result;
		gs.startStream();
	});
};

gsCli.prototype.startStream = function(){
	if(this.streamServer){
		var options = {
			'method': 'POST',
			'url': this.streamServer.url
		}, gs = this;
		
		//var file = fs.createWriteStream('./output');
		//var r =	request(options).pipe(file);
		var process = spawn('mplayer', [this.streamServer.url]);
		process.on('exit', function(code, sign){
			if(code !== null && sign === null){
				console.log(sign);	
			}
		});
		
		process.stdout.setEncoding('utf8');
		process.stdout.on('data', function(data){
			console.log(data);
		});

		setTimeout(function(){
			gs.mark30Seconds();
		}, 29000);
	}
};

gsCli.prototype.mark30Seconds = function(){
	var options = {
		'method': 'markStreamKeyOver30Secs',
		'params': {
			'streamKey': this.streamServer.StreamKey,
			'streamServerID': this.streamServer.StreamServerID,
			'sessionID': this.sessionID
		}
	};

	this.makeRequest(options, function(err, res, body){
		console.log(inspect(body));
	});
};

gsCli.prototype.getSongURLFromSongID = function(){
	var options = {
		'method': 'getSongURLFromSongID',
		'params': {
			'songID': 2357801
		}
	}, gs = this;

	this.makeRequest(options, function(err, res, body){
		gs.streamServer = body.result;
	});
};

gsCli.prototype.getStreamKeyFromSongIDEx = function(){
	var options = {
		'method': 'getStreamKeyFromSongIDEx',
		'params': {
			'country': gsCli.COUNTRY,
			'mobile': false,
			'prefetch': false,
			'songID': 2357801,
			'type': 257
		},
		'url': 'http://grooveshark.com/more.php',
		'headers': {
			'client': 'jsqueue',
			'clientRevision': gsCli.CLIENT.clientRevision,
			'country': gsCli.COUNTRY,
			'session': this.sessionID,
			'token': 'a4f607124b01ba3850194b0a8343b09fdf4d4ced05816d',
			'uuid': uuid
		}
	}, gs = this;

	this.makeRequest(options, function(err, res, body){
	});
};

gsCli.prototype.getSongsInfo = function(){
	var options = {
		'method': 'getSongsInfo',
		'params': {
			'songIDs': [2357801]
		}
	};

	this.makeRequest(options, function(err, res, body){
		console.log(body.result.songs);
	});
};

gsCli.prototype.makeRequest = function(options, callback){
	var https = options.https || false,
		params = options.params || {};
		requestMethod = options.requestMethod || 'POST',
		sig = null;

	var data = {
		'method': options.method,
		'parameters': params,
		'header': {
			'wsKey': key
		}
	};

	if(this.sessionID){
		data.header.sessionID = this.sessionID;
	}

	sig = createMessageSign(JSON.stringify(data), secret);

	var requestOptions = {
		'method': requestMethod
	};

	if(!options.url){
		requestOptions.url = (https ? 'https://' : 'http://') + gsCli.API_HOST + gsCli.API_ENDPOINT + '?sig=' + sig;
	}
	else{
		requestOptions.url = options.url;
	}

	if(options.headers) requestOptions.headers = options.headers;

	if(!options.requestType){
		requestOptions.json = data;
	}
	else{
		requestOptions[requestType] = data;
	}

	console.log(inspect(requestOptions));
	
	//Make the request
	request(requestOptions, function(err, res, body){
		if(err) throw err;
		
		console.log(inspect({
			'err': err,
			'res': {
				'statusCode': res.statusCode,
				'headers': res.headers
			},
			'body': body
		}));
		
		if(!body || !body.result){
			console.log(inspect(body.errors));
			throw new Error('Errors in result');
		}
		else{
			if(callback) callback(err, res, body);
		}
	});
};

function createMessageSign(params, secret){
	return crypto.createHmac('md5', secret).update(params).digest('hex');
}
