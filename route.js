export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const limit = searchParams.get('limit') || '100'
  let url = id
    ? `https://play.limitlesstcg.com/api/tournaments/${id}/standings`
    : `https://play.limitlesstcg.com/api/tournaments?game=PTCG&format=STANDARD&limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': 'PTCG-Tracker/1.0' } })
  const data = await res.json()
  return Response.json(data)
}
