import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found. Please create it first.');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[key] = value.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local');
    process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_USERS = [
    { id: '344ba8f8-b3d9-4822-ba78-56e6d1b71239', email: 'admin@mythos.org', role: 'Admin' },
    { id: '1ae09e39-2a91-49fc-9e3d-88f1dc67fe99', email: 'facilitator@mythos.org', role: 'Facilitator' },
    { id: 'e164b3ef-88df-48ad-8d9e-c8cd5b699999', email: 'participant@mythos.org', role: 'Participant' },
];

const DEFAULT_PARTICIPANTS = [
    {
        id: 'e164b3ef-88df-48ad-8d9e-c8cd5b699999',
        name: 'John Doe',
        age: 21,
        gender: 'Male',
        school: 'University of the Philippines Diliman',
        course_program: 'BS Psychology',
        hero_level: 1,
        session_points: 0,
        daily_streak: 3,
        last_active_date: new Date().toISOString().split('T')[0],
        cbt_baseline_score: 75.5,
    }
];

const DEFAULT_FACILITATORS = [
    {
        id: '1ae09e39-2a91-49fc-9e3d-88f1dc67fe99',
        name: 'Dr. Maria Clara',
        assigned_participants: ['e164b3ef-88df-48ad-8d9e-c8cd5b699999'],
    }
];

async function seed() {
    try {
        console.log('Seeding users...');
        for (const u of DEFAULT_USERS) {
            const { error } = await supabase.from('users').upsert(u);
            if (error) {
                console.error(`Failed to upsert user ${u.email}:`, error.message);
            } else {
                console.log(`Success: Upserted user ${u.email}`);
            }
        }

        console.log('Seeding participants...');
        for (const p of DEFAULT_PARTICIPANTS) {
            const { error } = await supabase.from('participants').upsert(p);
            if (error) {
                console.error(`Failed to upsert participant ${p.name}:`, error.message);
            } else {
                console.log(`Success: Upserted participant ${p.name}`);
            }
        }

        console.log('Seeding facilitators...');
        for (const f of DEFAULT_FACILITATORS) {
            const { error } = await supabase.from('facilitators').upsert(f);
            if (error) {
                console.error(`Failed to upsert facilitator ${f.name}:`, error.message);
            } else {
                console.log(`Success: Upserted facilitator ${f.name}`);
            }
        }

        console.log('Database seeding simulation finished!');
    } catch (err) {
        console.error('Seeding process error:', err);
    }
}

seed();
