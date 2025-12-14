/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://leerszpgoisorifjwnwv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gVEfU-fnQ0DeO_uLWTHCiQ_73UdonAC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
