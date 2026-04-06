import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function DoctorContractsFallbackPage({ params }: Props) {
  const { tenantSlug } = await params
  redirect(`/${tenantSlug}/dashboard/contracts`)
}
