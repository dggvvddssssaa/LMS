const { Client } = require('pg');
const connectionString = 'postgresql://postgres:0989221782@localhost:5432/postgres'; // Use 'postgres' db to skip 'lms_db does not exist' error

const client = new Client({ connectionString });

console.log('Testing connection to:', connectionString.replace(':0989221782@', ':***@'));

client.connect()
    .then(() => {
        console.log('✅ Connection SUCCESSFUL!');
        console.log('Password is correct.');
        client.end();
    })
    .catch(e => {
        console.error('❌ Connection FAILED:');
        console.error(e.message);
        if (e.message.includes('password authentication failed')) {
            console.log('=> The password provided is INCORRECT.');
        } else if (e.message.includes('does not exist')) {
            console.log('=> Database does not exist (but password is correct).');
        }
        client.end();
    });
