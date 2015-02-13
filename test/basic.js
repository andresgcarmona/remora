var gscli = require('../lib/gscli'),
	username = 'username',
	password = 'password';

var player = new gscli();

player.startSession(function(err, session){
	if(session){
		player.authenticate(username, password, function(user){
			if(user && user.success){
				player.sampleRequest();
			}
		});
	}
});
