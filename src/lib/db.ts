import { createClient } from '@supabase/supabase-js';

// Types representing database rows
export interface User {
  id: string;
  email: string;
  role: 'Admin' | 'Facilitator' | 'Participant';
  password?: string;
  created_at?: string;
}

export interface Participant {
  id: string;
  name: string;
  age: number;
  gender: string;
  school: string;
  course_program?: string;
  grade_section?: string;
  contact_number?: string;
  parents_name?: string;
  address?: string;
  hero_level: number;
  session_points: number;
  daily_streak: number;
  last_active_date?: string;
  cbt_baseline_score: number;
}

export interface Facilitator {
  id: string;
  name: string;
  assigned_participants: string[]; // UUIDs

  // Counselor specific fields
  employee_number?: string;
  birthdate?: string;
  address?: string;
  designation?: string;
}

export interface Session {
  id: string;
  participant_id: string;
  session_number: number;
  is_completed: boolean;
  is_locked: boolean;
  completed_at?: string;
}

export interface Activity {
  id: string;
  session_id: string;
  activity_name: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface ResponseData {
  id: string;
  participant_id: string;
  session_number: number;
  activity_name: string;
  form_data: any;
  updated_at?: string;
}

export interface MoodLog {
  id: string;
  participant_id: string;
  session_number?: number;
  rating: number;
  logged_at: string;
}

export interface Reflection {
  id: string;
  participant_id: string;
  session_number: number;
  journal_text: string;
  ai_summary?: string;
  ai_feedback?: string;
  ai_encouragement?: string;
  facilitator_feedback?: string;
  feedback_by?: string;
  created_at: string;
}

export interface TestScore {
  id: string;
  participant_id: string;
  mood_rating: number;
  self_esteem_score: number;
  hope_score: number;
  automatic_thoughts_score: number;
  reflection_score: number;
  completed_at: string;
}

export interface Certificate {
  id: string;
  participant_id: string;
  issued_at: string;
  certificate_code: string;
}

// ----------------------------------------------------
// INITIALIZE CLIENTS
// ----------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('⚡ MyTHOS DB: Connected to active Supabase production database!');
  } else {
    console.warn('⚠️ MyTHOS DB: Environment keys missing. Using client-side LocalStorage DB fallback.');
  }
}


// Mock database default seed values
const DEFAULT_USERS: User[] = [
  { id: 'usr-admin-01', email: 'admin@mythos.org', role: 'Admin' },
  { id: 'usr-fac-01', email: 'facilitator@mythos.org', role: 'Facilitator' },
  { id: 'usr-part-01', email: 'participant@mythos.org', role: 'Participant' },
];

const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    id: 'usr-part-01',
    name: 'Juan dela Cruz',
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

const DEFAULT_FACILITATORS: Facilitator[] = [
  {
    id: 'usr-fac-01',
    name: 'Dr. Maria Clara',
    assigned_participants: ['usr-part-01'],
  }
];

// Helper to interact with LocalStorage
const getLocal = (key: string, defVal: any) => {
  if (typeof window === 'undefined') return defVal;
  const val = localStorage.getItem(`mythos_${key}`);
  return val ? JSON.parse(val) : defVal;
};

const setLocal = (key: string, val: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mythos_${key}`, JSON.stringify(val));
  }
};

// Seed storage if empty
const seedDatabase = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('mythos_users')) {
    setLocal('users', DEFAULT_USERS);
    setLocal('participants', DEFAULT_PARTICIPANTS);
    setLocal('facilitators', DEFAULT_FACILITATORS);

    // Seed default session objects
    const sessions: Session[] = [];
    for (let i = 1; i <= 5; i++) {
      sessions.push({
        id: `sess-part-01-s${i}`,
        participant_id: 'usr-part-01',
        session_number: i,
        is_completed: false,
        is_locked: i > 1, // Only Session 1 is unlocked initially
      });
    }
    setLocal('sessions', sessions);
    setLocal('responses', []);
    setLocal('mood_logs', [
      { id: 'm1', participant_id: 'usr-part-01', rating: 4, logged_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
      { id: 'm2', participant_id: 'usr-part-01', rating: 5, logged_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { id: 'm3', participant_id: 'usr-part-01', rating: 6, logged_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
    ]);
    setLocal('reflections', []);
    setLocal('pretest', []);
    setLocal('posttest', []);
    setLocal('certificates', []);
  }
};

// Execute seed on file import (client-side only)
seedDatabase();

// ----------------------------------------------------
// DATABASE API INTERFACE
// ----------------------------------------------------
// Helper to generate standard RFC 4122 UUIDs
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const dbClient = {
  // --- USER AUTHENTICATION & REGISTRATION ---
  async getUserByEmail(email: string): Promise<User | null> {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (error) console.error('Supabase error', error);

      // Auto-repair: if user exists but missing participant profile, create it
      if (data && data.role === 'Participant') {
        const { data: existing } = await supabase.from('participants').select('id').eq('id', data.id).maybeSingle();
        if (!existing) {
          console.warn('Auto-repairing orphaned participant profile for:', email);
          await supabase.from('participants').insert({
            id: data.id,
            name: email, // use email as placeholder name
            age: 18,
            gender: 'Not Specified',
            school: 'Not Specified',
            course_program: 'Not Specified',
          });
          // Initialize their sessions too
          const sessRows = Array.from({ length: 5 }, (_, idx) => ({
            participant_id: data.id,
            session_number: idx + 1,
            is_completed: false,
            is_locked: idx > 0
          }));
          await supabase.from('sessions').insert(sessRows).select();
        }
      }

      return data;
    } else {
      const users: User[] = getLocal('users', []);
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async verifyLogin(email: string, password: string, role: string): Promise<User | null> {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!data || error) return null;
      if (data.role !== role) throw new Error(`Role mismatch. Registered as ${data.role}.`);
      if (data.password && data.password !== password) throw new Error('Incorrect password.');
      return data;
    } else {
      const users: User[] = getLocal('users', []);
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return null;
      if (user.role !== role) throw new Error(`Role mismatch. Registered as ${user.role}.`);
      if (user.password && user.password !== password) throw new Error('Incorrect password.');
      return user;
    }
  },

  async registerUser(email: string, role: 'Admin' | 'Facilitator' | 'Participant', name: string, details?: any, password?: string): Promise<User> {
    const id = generateUUID();
    const newUser: User = { id, email, role, password, created_at: new Date().toISOString() };

    if (supabase) {
      const { data: userD, error: userE } = await supabase.from('users').insert({ id, email, role, password }).select().single();
      if (userE) throw userE;

      if (role === 'Participant') {
        const { error: partE } = await supabase.from('participants').insert({
          id,
          name,
          age: details?.age || 18,
          gender: details?.gender || 'Not Specified',
          school: details?.school || 'Not Specified',
          course_program: details?.grade_section || details?.course_program || 'Not Specified',
        });
        if (partE) throw partE;

        // Store extra bio data (Contact, Parents, Address) in the schema-less responses table 
        // to avoid crashing the Postgres strict schema for 'participants' table without needing migrations.
        if (details?.contact_number || details?.parents_name || details?.address) {
          await supabase.from('responses').insert({
            participant_id: id,
            session_number: 1,
            activity_name: 'registration_metadata',
            form_data: {
              contact_number: details.contact_number || 'Not Specified',
              parents_name: details.parents_name || 'Not Specified',
              address: details.address || 'Not Specified'
            }
          });
        }

        // Initialize sessions
        const sessRows = Array.from({ length: 5 }, (_, idx) => ({
          participant_id: id,
          session_number: idx + 1,
          is_completed: false,
          is_locked: idx > 0
        }));
        await supabase.from('sessions').insert(sessRows);
      } else if (role === 'Facilitator') {
        await supabase.from('facilitators').insert({ id, name });
      }
      return userD;
    } else {
      const users = getLocal('users', []);
      users.push(newUser);
      setLocal('users', users);

      if (role === 'Participant') {
        const parts = getLocal('participants', []);
        const newPart: Participant = {
          id,
          name,
          age: details?.age || 18,
          gender: details?.gender || 'Not Specified',
          school: details?.school || 'Not Specified',
          course_program: details?.course_program || 'Not Specified',
          grade_section: details?.grade_section || 'Not Specified',
          contact_number: details?.contact_number || 'Not Specified',
          parents_name: details?.parents_name || 'Not Specified',
          address: details?.address || 'Not Specified',
          hero_level: 1,
          session_points: 0,
          daily_streak: 1,
          last_active_date: new Date().toISOString().split('T')[0],
          cbt_baseline_score: 50.0
        };
        parts.push(newPart);
        setLocal('participants', parts);

        // Initialize sessions
        const sessions = getLocal('sessions', []);
        for (let i = 1; i <= 5; i++) {
          sessions.push({
            id: `sess-${id}-s${i}`,
            participant_id: id,
            session_number: i,
            is_completed: false,
            is_locked: i > 1
          });
        }
        setLocal('sessions', sessions);
      } else if (role === 'Facilitator') {
        const facs = getLocal('facilitators', []);
        facs.push({
          id,
          name,
          assigned_participants: [],
          employee_number: details?.employee_number,
          birthdate: details?.birthdate,
          address: details?.address,
          designation: details?.designation
        });
        setLocal('facilitators', facs);
      }

      return newUser;
    }
  },

  // --- PARTICIPANT DETAILS ---
  async getParticipant(id: string): Promise<Participant | null> {
    if (supabase) {
      const { data, error } = await supabase.from('participants').select('*').eq('id', id).maybeSingle();
      if (error) console.error(error);
      return data;
    } else {
      const parts: Participant[] = getLocal('participants', []);
      return parts.find(p => p.id === id) || null;
    }
  },

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
    if (supabase) {
      const { data, error } = await supabase.from('participants').update(updates).eq('id', id).select().single();
      if (error) console.error(error);
      return data;
    } else {
      const parts: Participant[] = getLocal('participants', []);
      const idx = parts.findIndex(p => p.id === id);
      if (idx === -1) return null;
      parts[idx] = { ...parts[idx], ...updates };
      setLocal('participants', parts);
      return parts[idx];
    }
  },

  // --- SESSIONS ---
  async getSessions(participantId: string): Promise<Session[]> {
    if (supabase) {
      const { data, error } = await supabase.from('sessions').select('*').eq('participant_id', participantId).order('session_number', { ascending: true });
      if (error) console.error(error);
      return data || [];
    } else {
      const sessions: Session[] = getLocal('sessions', []);
      return sessions.filter(s => s.participant_id === participantId);
    }
  },

  async completeSession(participantId: string, sessionNumber: number, pointsToAdd: number = 100): Promise<void> {
    if (supabase) {
      // 1. Mark session as complete
      const { error: sessErr } = await supabase
        .from('sessions')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('participant_id', participantId)
        .eq('session_number', sessionNumber);
      if (sessErr) console.error(sessErr);

      // 2. Unlock next session
      if (sessionNumber < 5) {
        const { error: lockErr } = await supabase
          .from('sessions')
          .update({ is_locked: false })
          .eq('participant_id', participantId)
          .eq('session_number', sessionNumber + 1);
        if (lockErr) console.error(lockErr);
      }

      // 3. Update participant score/points/level
      const part = await this.getParticipant(participantId);
      if (part) {
        const newPoints = part.session_points + pointsToAdd;
        const newLevel = Math.floor(newPoints / 250) + 1; // 250 points per level

        // Streak calculation
        const todayStr = new Date().toISOString().split('T')[0];
        let streak = part.daily_streak;
        if (part.last_active_date !== todayStr) {
          if (part.last_active_date === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            streak += 1;
          } else {
            streak = 1;
          }
        }

        await this.updateParticipant(participantId, {
          session_points: newPoints,
          hero_level: newLevel,
          daily_streak: streak,
          last_active_date: todayStr
        });
      }
    } else {
      const sessions: Session[] = getLocal('sessions', []);
      const sessIdx = sessions.findIndex(s => s.participant_id === participantId && s.session_number === sessionNumber);
      if (sessIdx !== -1) {
        sessions[sessIdx].is_completed = true;
        sessions[sessIdx].completed_at = new Date().toISOString();
      }

      if (sessionNumber < 5) {
        const nextIdx = sessions.findIndex(s => s.participant_id === participantId && s.session_number === sessionNumber + 1);
        if (nextIdx !== -1) {
          sessions[nextIdx].is_locked = false;
        }
      }
      setLocal('sessions', sessions);

      // Update participant points/level
      const part = await this.getParticipant(participantId);
      if (part) {
        const newPoints = part.session_points + pointsToAdd;
        const newLevel = Math.floor(newPoints / 250) + 1;

        const todayStr = new Date().toISOString().split('T')[0];
        let streak = part.daily_streak;
        if (part.last_active_date !== todayStr) {
          if (part.last_active_date === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            streak += 1;
          } else {
            streak = 1;
          }
        }

        await this.updateParticipant(participantId, {
          session_points: newPoints,
          hero_level: newLevel,
          daily_streak: streak,
          last_active_date: todayStr
        });
      }
    }
  },

  // --- RESPONSES ---
  async saveResponse(participantId: string, sessionNumber: number, activityName: string, formData: any): Promise<void> {
    if (supabase) {
      const { data: existing } = await supabase
        .from('responses')
        .select('id')
        .eq('participant_id', participantId)
        .eq('session_number', sessionNumber)
        .eq('activity_name', activityName)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('responses')
          .update({ form_data: formData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('responses')
          .insert({
            participant_id: participantId,
            session_number: sessionNumber,
            activity_name: activityName,
            form_data: formData
          });
      }
    } else {
      const responses: ResponseData[] = getLocal('responses', []);
      const idx = responses.findIndex(r => r.participant_id === participantId && r.session_number === sessionNumber && r.activity_name === activityName);
      if (idx !== -1) {
        responses[idx].form_data = formData;
        responses[idx].updated_at = new Date().toISOString();
      } else {
        responses.push({
          id: `resp-${Math.random().toString(36).substr(2, 9)}`,
          participant_id: participantId,
          session_number: sessionNumber,
          activity_name: activityName,
          form_data: formData,
          updated_at: new Date().toISOString()
        });
      }
      setLocal('responses', responses);
    }
  },

  async getResponses(participantId: string, sessionNumber: number): Promise<ResponseData[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('participant_id', participantId)
        .eq('session_number', sessionNumber);
      if (error) console.error(error);
      return data || [];
    } else {
      const responses: ResponseData[] = getLocal('responses', []);
      return responses.filter(r => r.participant_id === participantId && r.session_number === sessionNumber);
    }
  },

  async getAllResponses(participantId: string): Promise<ResponseData[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('participant_id', participantId)
        .order('session_number', { ascending: true });
      if (error) console.error(error);
      return data || [];
    } else {
      const responses: ResponseData[] = getLocal('responses', []);
      return responses.filter(r => r.participant_id === participantId).sort((a, b) => a.session_number - b.session_number);
    }
  },

  // --- MOOD LOGS ---
  async logMood(participantId: string, sessionNumber: number | null, rating: number): Promise<void> {
    if (supabase) {
      await supabase.from('mood_logs').insert({
        participant_id: participantId,
        session_number: sessionNumber,
        rating
      });
    } else {
      const logs = getLocal('mood_logs', []);
      logs.push({
        id: `mood-${Math.random().toString(36).substr(2, 9)}`,
        participant_id: participantId,
        session_number: sessionNumber || undefined,
        rating,
        logged_at: new Date().toISOString()
      });
      setLocal('mood_logs', logs);
    }
  },

  async getMoodLogs(participantId: string): Promise<MoodLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('participant_id', participantId)
        .order('logged_at', { ascending: true });
      if (error) console.error(error);
      return data || [];
    } else {
      const logs: MoodLog[] = getLocal('mood_logs', []);
      return logs.filter(l => l.participant_id === participantId).sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    }
  },

  // --- REFLECTIONS ---
  async saveReflection(participantId: string, sessionNumber: number, journalText: string, aiOutputs?: { summary?: string, feedback?: string, encouragement?: string }): Promise<Reflection> {
    const id = `refl-${Math.random().toString(36).substr(2, 9)}`;
    const newRefl: Reflection = {
      id,
      participant_id: participantId,
      session_number: sessionNumber,
      journal_text: journalText,
      ai_summary: aiOutputs?.summary || '',
      ai_feedback: aiOutputs?.feedback || '',
      ai_encouragement: aiOutputs?.encouragement || '',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: existing } = await supabase
        .from('reflections')
        .select('id')
        .eq('participant_id', participantId)
        .eq('session_number', sessionNumber)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('reflections')
          .update({
            journal_text: journalText,
            ai_summary: aiOutputs?.summary,
            ai_feedback: aiOutputs?.feedback,
            ai_encouragement: aiOutputs?.encouragement
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('reflections').insert({
          participant_id: participantId,
          session_number: sessionNumber,
          journal_text: journalText,
          ai_summary: aiOutputs?.summary,
          ai_feedback: aiOutputs?.feedback,
          ai_encouragement: aiOutputs?.encouragement
        }).select().single();
        if (error) throw error;
        return data;
      }
    } else {
      const refs: Reflection[] = getLocal('reflections', []);
      const idx = refs.findIndex((r: Reflection) => r.participant_id === participantId && r.session_number === sessionNumber);
      if (idx !== -1) {
        refs[idx].journal_text = journalText;
        if (aiOutputs?.summary) refs[idx].ai_summary = aiOutputs.summary;
        if (aiOutputs?.feedback) refs[idx].ai_feedback = aiOutputs.feedback;
        if (aiOutputs?.encouragement) refs[idx].ai_encouragement = aiOutputs.encouragement;
        setLocal('reflections', refs);
        return refs[idx];
      } else {
        refs.push(newRefl);
        setLocal('reflections', refs);
        return newRefl;
      }
    }
  },

  async getReflections(participantId: string): Promise<Reflection[]> {
    if (supabase) {
      const { data, error } = await supabase.from('reflections').select('*').eq('participant_id', participantId);
      if (error) console.error(error);
      return data || [];
    } else {
      const refs: Reflection[] = getLocal('reflections', []);
      return refs.filter(r => r.participant_id === participantId);
    }
  },

  // --- PRE/POST ASSESSMENT SCORES ---
  async savePreTest(participantId: string, scores: Omit<TestScore, 'id' | 'participant_id' | 'completed_at'>): Promise<void> {
    if (supabase) {
      await supabase.from('pretest').insert({
        participant_id: participantId,
        ...scores
      });
      // Set baseline CBT score as average of scores
      const avg = (scores.self_esteem_score + scores.hope_score + scores.automatic_thoughts_score) / 3;
      await this.updateParticipant(participantId, { cbt_baseline_score: avg });
    } else {
      const pretests = getLocal('pretest', []);
      pretests.push({
        id: `pre-${Math.random().toString(36).substr(2, 9)}`,
        participant_id: participantId,
        ...scores,
        completed_at: new Date().toISOString()
      });
      setLocal('pretest', pretests);
      const avg = (scores.self_esteem_score + scores.hope_score + scores.automatic_thoughts_score) / 3;
      await this.updateParticipant(participantId, { cbt_baseline_score: Number(avg.toFixed(1)) });
    }
  },

  async savePostTest(participantId: string, scores: Omit<TestScore, 'id' | 'participant_id' | 'completed_at'>): Promise<void> {
    if (supabase) {
      await supabase.from('posttest').insert({
        participant_id: participantId,
        ...scores
      });
    } else {
      const posttests = getLocal('posttest', []);
      posttests.push({
        id: `post-${Math.random().toString(36).substr(2, 9)}`,
        participant_id: participantId,
        ...scores,
        completed_at: new Date().toISOString()
      });
      setLocal('posttest', posttests);
    }
  },

  async getPrePostData(participantId: string): Promise<{ pre: TestScore | null, post: TestScore | null }> {
    if (supabase) {
      const { data: preData } = await supabase.from('pretest').select('*').eq('participant_id', participantId).order('completed_at', { ascending: false }).limit(1).maybeSingle();
      const { data: postData } = await supabase.from('posttest').select('*').eq('participant_id', participantId).order('completed_at', { ascending: false }).limit(1).maybeSingle();
      return { pre: preData, post: postData };
    } else {
      const pretests: TestScore[] = getLocal('pretest', []);
      const posttests: TestScore[] = getLocal('posttest', []);
      const pre = pretests.filter(p => p.participant_id === participantId).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0] || null;
      const post = posttests.filter(p => p.participant_id === participantId).sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0] || null;
      return { pre, post };
    }
  },

  // --- FACILITATOR / COUNSELOR ACTIONS ---
  async getFacilitatorParticipants(facilitatorId: string): Promise<Participant[]> {
    if (supabase) {
      const { data: fac } = await supabase.from('facilitators').select('assigned_participants').eq('id', facilitatorId).single();
      if (!fac || !fac.assigned_participants.length) return [];
      const { data: participants } = await supabase.from('participants').select('*').in('id', fac.assigned_participants);
      return participants || [];
    } else {
      const facs: Facilitator[] = getLocal('facilitators', []);
      const fac = facs.find(f => f.id === facilitatorId);
      if (!fac || !fac.assigned_participants.length) return [];
      const parts: Participant[] = getLocal('participants', []);
      return parts.filter(p => fac.assigned_participants.includes(p.id));
    }
  },

  async saveFacilitatorFeedback(reflectionId: string, feedbackText: string, facilitatorId: string): Promise<void> {
    if (supabase) {
      await supabase
        .from('reflections')
        .update({
          facilitator_feedback: feedbackText,
          feedback_by: facilitatorId
        })
        .eq('id', reflectionId);
    } else {
      const reflections: Reflection[] = getLocal('reflections', []);
      const idx = reflections.findIndex((r: Reflection) => r.id === reflectionId);
      if (idx !== -1) {
        reflections[idx].facilitator_feedback = feedbackText;
        reflections[idx].feedback_by = facilitatorId;
        setLocal('reflections', reflections);
      }
    }
  },

  // --- ADMIN ACTIONS ---
  async getAllParticipants(): Promise<Participant[]> {
    if (supabase) {
      const { data, error } = await supabase.from('participants').select('*');
      if (error) console.error(error);
      return data || [];
    } else {
      return getLocal('participants', []);
    }
  },

  async assignParticipantToFacilitator(participantId: string, facilitatorId: string): Promise<void> {
    if (supabase) {
      const { data: fac } = await supabase.from('facilitators').select('assigned_participants').eq('id', facilitatorId).single();
      if (fac) {
        const list = fac.assigned_participants || [];
        if (!list.includes(participantId)) {
          list.push(participantId);
          await supabase.from('facilitators').update({ assigned_participants: list }).eq('id', facilitatorId);
        }
      }
    } else {
      const facs: Facilitator[] = getLocal('facilitators', []);
      const idx = facs.findIndex(f => f.id === facilitatorId);
      if (idx !== -1) {
        if (!facs[idx].assigned_participants.includes(participantId)) {
          facs[idx].assigned_participants.push(participantId);
          setLocal('facilitators', facs);
        }
      }
    }
  },

  // --- CERTIFICATE OF COMPLETION ---
  async getCertificate(participantId: string): Promise<Certificate | null> {
    if (supabase) {
      const { data, error } = await supabase.from('certificates').select('*').eq('participant_id', participantId).maybeSingle();
      if (error) console.error(error);
      return data;
    } else {
      const certs: Certificate[] = getLocal('certificates', []);
      return certs.find(c => c.participant_id === participantId) || null;
    }
  },

  async issueCertificate(participantId: string): Promise<Certificate> {
    const existing = await this.getCertificate(participantId);
    if (existing) return existing;

    const certCode = `MYTHOS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newCert: Certificate = {
      id: `cert-${Math.random().toString(36).substr(2, 9)}`,
      participant_id: participantId,
      issued_at: new Date().toISOString(),
      certificate_code: certCode
    };

    if (supabase) {
      const { data, error } = await supabase.from('certificates').insert({
        participant_id: participantId,
        certificate_code: certCode
      }).select().single();
      if (error) throw error;
      return data;
    } else {
      const certs = getLocal('certificates', []);
      certs.push(newCert);
      setLocal('certificates', certs);
      return newCert;
    }
  },

  async clearParticipantData(participantId: string): Promise<void> {
    if (supabase) {
      await supabase.from('responses').delete().eq('participant_id', participantId);
      await supabase.from('reflections').delete().eq('participant_id', participantId);
      await supabase.from('mood_logs').delete().eq('participant_id', participantId);
    } else {
      const resp = getLocal('responses', []).filter((r: any) => r.participant_id !== participantId);
      setLocal('responses', resp);
      const refs = getLocal('reflections', []).filter((r: any) => r.participant_id !== participantId);
      setLocal('reflections', refs);
      const moods = getLocal('mood_logs', []).filter((r: any) => r.participant_id !== participantId);
      setLocal('mood_logs', moods);
    }
  },

  async seedSampleData(participantId: string): Promise<void> {
    // Inject mock responses for Session 1 to populate the dashboard UI for demonstration
    await this.saveResponse(participantId, 1, 'mood_check_in', 'Masaya at medyo kalmado');
    await this.saveResponse(participantId, 1, 'cbt_questions', {
      q1: "Nakaramdam sila ng kaba at pag-asa dahil bago ang lahat para sa kanila.",
      q2: "Kailangan nila ng katatagan at pagtutulungan upang harapin ang hindi alam.",
      q3: "Ang lakas ay ang kakayahang hindi sumuko sa kabila ng kabiguan.",
      q4: "Ang ganda ay ang pagkakaroon ng mabuting kalooban at pagiging marespeto sa iba.",
      q5: "Matapang, Maparaan, Handa sa Sakripisyo."
    });
    await this.saveResponse(participantId, 1, 'cbt_interactive', 'Pinili kong maging matapang at harapin ang aking mga takot sa eskwelahan.');

    // Inject mock reflection
    await this.saveReflection(
      participantId,
      1,
      "Ngayong araw ay naisip ko na parang ako sina Malakas at Maganda na lumabas sa kawayan. Minsan, nakakulong ako sa aking mga takot, pero kailangan kong basagin ito para makita ang mundo at maging ganap na malaya."
    );
  }
};
