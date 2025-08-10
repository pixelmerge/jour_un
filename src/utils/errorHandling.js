export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  if (error.code === 'PGRST301') {
    return 'Authentication required'
  }
  if (error.code === 'PGRST204') {
    return 'No data found'
  }
  return error.message || 'An unexpected error occurred'
}