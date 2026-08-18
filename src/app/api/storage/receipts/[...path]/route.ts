import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const filePath = resolvedParams.path.join('/')

  // Create a signed URL valid for 60 seconds
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(filePath, 60)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to access file or file not found' }, { status: 404 })
  }

  // Redirect the user to the signed URL so the browser can display/download it
  return NextResponse.redirect(data.signedUrl)
}
