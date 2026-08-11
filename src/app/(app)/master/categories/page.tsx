import { fetchCategories } from '@/lib/services/master-data.service'
import { CategoryList } from './CategoryList'

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  return (
    <div>
      <CategoryList initialData={categories} />
    </div>
  )
}
