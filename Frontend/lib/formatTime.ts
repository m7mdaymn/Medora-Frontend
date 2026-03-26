export const formatTime = (timeString: string) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  let h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'م' : 'ص'
  h = h % 12
  h = h ? h : 12 // الساعة 0 تبقى 12
  return `${h}:${minutes} ${ampm}`
}