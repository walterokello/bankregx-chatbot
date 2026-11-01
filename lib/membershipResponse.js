const unavailable = 'We could not check your monthly allowance. Please refresh the page or try again shortly.';

export async function readMembershipResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  function unexpectedResponse() {
    return Object.assign(new Error(unavailable), {
      code: 'MEMBERSHIP_RESPONSE_UNAVAILABLE',
      status: response.status,
      contentType,
    });
  }
  // Deployments, access protection and platform failures may return HTML.
  // Never expose that HTML or a JSON parser error to the visitor.
  if (!contentType.toLowerCase().includes('application/json')) throw unexpectedResponse();
  let data;
  try { data = await response.json(); }
  catch { throw unexpectedResponse(); }
  if (!response.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : unavailable);
  }
  if (!data || !['visitor', 'member'].includes(data.plan)
      || data.limit !== (data.plan === 'member' ? 5 : 1)
      || !Number.isInteger(data.used) || data.used < 0
      || data.remaining !== Math.max(0, data.limit - data.used)
      || !Number.isFinite(Date.parse(data.resetsAt))) {
    throw unexpectedResponse();
  }
  return data;
}
