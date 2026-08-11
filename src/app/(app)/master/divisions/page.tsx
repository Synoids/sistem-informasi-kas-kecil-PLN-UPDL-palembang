import { fetchDivisions } from '@/lib/services/master-data.service'
import { DivisionList } from './DivisionList'

export default async function DivisionsPage() {
  const divisions = await fetchDivisions()

  return (
    <div>
      <DivisionList initialData={divisions} />
    </div>
  )
}
