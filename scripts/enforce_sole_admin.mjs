import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.error('Auth error:', authErr)
    return
  }

  console.log('Total users found:', users.length)
  const targetEmail = 'sohit@gmail.com'

  let targetFound = false

  for (const u of users) {
    const isTarget = u.email?.toLowerCase() === targetEmail.toLowerCase()
    if (isTarget) targetFound = true
    const role = isTarget ? 'admin' : 'user'

    const { error: pErr } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', u.id)

    console.log(`User: ${u.email} -> Set role to: ${role} | Error: ${pErr ? pErr.message : 'none'}`)
  }

  if (!targetFound) {
    console.warn(`WARNING: ${targetEmail} was not found in auth.users list!`)
  }

  // Also check if any profile has admin that doesn't match
  const { data: allProfiles } = await supabase.from('profiles').select('id, role')
  console.log('All profiles status:', allProfiles)
}

run()
