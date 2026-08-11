import { fetchCashSourcesAdmin, fetchFundHolders } from '@/lib/services/master-data.service'
import { CashSourceList } from './CashSourceList'

export default async function CashSourcesPage() {
  const cashSources = await fetchCashSourcesAdmin()
  const fundHolders = await fetchFundHolders()

  return (
    <div>
      <CashSourceList initialData={cashSources} fundHolders={fundHolders} />
    </div>
  )
}
