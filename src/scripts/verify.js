const { createClient } = require('C:/Users/User/.gemini/antigravity/scratch/mythos/node_modules/@supabase/supabase-js');
const fs = require('fs');

async function test() {
    console.log('Initializing Supabase client...');
    const client = createClient(
        'https://ceervzurubqpjhbyvlrw.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZXJ2enVydWJxcGpoYnl2bHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDgxNTksImV4cCI6MjEwMDEyNDE1OX0.rqm6WIrlXYjVE92Hh05Il4sG1V4wVUjRAW-VehS3cxM'
    );

    try {
        console.log('Querying users catalog table...');
        const { data, error } = await client.from('users').select('*');
        if (error) {
            console.error('Supabase query error:', error.message);
        } else {
            console.log('Query successful! Retrieved users count:', data.length);
            console.log('Users list:', data);
        }
    } catch (err) {
        console.error('Thrown query crash:', err.message, err.stack);
    }
}

test();
