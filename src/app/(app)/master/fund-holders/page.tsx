import { fetchFundHolders } from '@/lib/services/master-data.service'
import { FundHolderList } from './FundHolderList'

export default async function FundHoldersPage() {
  const fundHolders = await fetchFundHolders()

  return (
    <div>
      <FundHolderList initialData={fundHolders} />
    </div>
  )
}
