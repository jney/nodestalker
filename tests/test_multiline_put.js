var assert = require('assert');
var bs = require('../lib/beanstalk_client');

console.log('testing multiline put, peek, delete');

var port = 11333;

var net = require('net');
var mock_server = net.createServer(function(conn) {
    conn.on('data', function(data) {
        if(String(data).indexOf('put') > -1) {
            conn.write("INSERTED 10\r\n");
        }
        
        if(String(data) == 'peek 10\r\n') {
            conn.write("FOUND 10 13\r\ntest\r\nhere\r\n\r\n");
        }

        if(String(data) == "delete 10\r\n") {
            conn.write("DELETED\r\n");
            mock_server.close();
        }
    });
});
mock_server.listen(port);

var client = bs.Client('127.0.0.1:' + port);
var success = false;
var error = false;

client.put("test\r\nhere\r\n").onSuccess(function(data) {
	console.log(data);
	var test_id = data[0];
	
	client.peek(test_id).onSuccess(function(data) {
		console.log(data);
		assert.ok(data);
		assert.equal(data.id, test_id);
		assert.equal(data.data, "test\r\nhere\r\n");
		assert.equal(typeof data, 'object');
		success = true;
		
		client.deleteJob(test_id).onSuccess(function() {
			client.disconnect();
		});
	});
});

client.addListener('error', function() {
	error = true;
});

process.addListener('exit', function() {
	assert.ok(!error);
	assert.ok(success);
	console.log('test passed');
});