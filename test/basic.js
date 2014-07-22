var gscli = require('../lib/gscli'),
	username = 'andres_gcarmona',
	password = 'angyco830508';

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
