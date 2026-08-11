import { fetchProfilesWithAccess, fetchCashSourcesAdmin } from '@/lib/services/master-data.service'
import { getCurrentProfile } from '@/lib/services/auth.service'
import { UserList } from './UserList'

export default async function UsersPage() {
  const profiles = await fetchProfilesWithAccess()
  const cashSources = await fetchCashSourcesAdmin()
  const currentUser = await getCurrentProfile()

  return (
    <div>
      <UserList 
        initialData={profiles} 
        cashSources={cashSources} 
        currentUserId={currentUser?.id || ''} 
      />
    </div>
  )
}
